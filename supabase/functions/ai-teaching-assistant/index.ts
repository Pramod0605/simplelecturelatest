import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create MD5-like hash for question lookup
async function hashQuestion(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Extract PDF text content (simplified - would use proper PDF parser in production)
async function fetchPDFContent(pdfUrl: string): Promise<string> {
  try {
    // For B2 private bucket, we'd need to get a signed URL first
    // For now, return placeholder if PDF processing isn't set up
    console.log('PDF URL to fetch:', pdfUrl);
    return `[PDF Content from: ${pdfUrl}]`;
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, topicId, chapterId, language = 'en-IN' } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate question hash for cache lookup
    const questionHash = await hashQuestion(question);
    console.log('Question hash:', questionHash, 'Topic:', topicId);

    // Check cache first
    let cacheQuery = supabase
      .from('teaching_qa_cache')
      .select('*')
      .eq('question_hash', questionHash)
      .eq('language', language);

    if (topicId) {
      cacheQuery = cacheQuery.eq('topic_id', topicId);
    } else if (chapterId) {
      cacheQuery = cacheQuery.eq('chapter_id', chapterId);
    }

    const { data: cachedAnswer } = await cacheQuery.maybeSingle();

    if (cachedAnswer) {
      console.log('Cache hit! Returning cached answer');
      // Increment usage count
      await supabase
        .from('teaching_qa_cache')
        .update({ usage_count: (cachedAnswer.usage_count || 0) + 1 })
        .eq('id', cachedAnswer.id);

      return new Response(
        JSON.stringify({
          cached: true,
          answer: cachedAnswer.answer_text,
          answerHtml: cachedAnswer.answer_html,
          presentationSlides: cachedAnswer.presentation_slides,
          latexFormulas: cachedAnswer.latex_formulas,
          narrationText: cachedAnswer.answer_text,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch context from topic/chapter
    let context = '';
    let topicData = null;
    let chapterData = null;

    if (topicId) {
      const { data: topic } = await supabase
        .from('subject_topics')
        .select('*, chapter:subject_chapters(*)')
        .eq('id', topicId)
        .single();
      
      topicData = topic;
      if (topic) {
        context += `Topic: ${topic.title}\n`;
        if (topic.content_markdown) {
          context += `Content: ${topic.content_markdown}\n`;
        }
        if (topic.notes_markdown) {
          context += `Notes: ${topic.notes_markdown}\n`;
        }
        if (topic.pdf_url) {
          const pdfContent = await fetchPDFContent(topic.pdf_url);
          context += `PDF Content: ${pdfContent}\n`;
        }
        if (topic.chapter) {
          context += `Chapter: ${topic.chapter.title}\n`;
          if (topic.chapter.pdf_url) {
            const chapterPdf = await fetchPDFContent(topic.chapter.pdf_url);
            context += `Chapter PDF: ${chapterPdf}\n`;
          }
        }
      }
    } else if (chapterId) {
      const { data: chapter } = await supabase
        .from('subject_chapters')
        .select('*')
        .eq('id', chapterId)
        .single();
      
      chapterData = chapter;
      if (chapter) {
        context += `Chapter: ${chapter.title}\n`;
        if (chapter.pdf_url) {
          const pdfContent = await fetchPDFContent(chapter.pdf_url);
          context += `PDF Content: ${pdfContent}\n`;
        }
      }
    }

    // System prompt for lecture-style teaching
    const isHindi = language === 'hi-IN';
    const systemPrompt = `You are an expert Indian teacher explaining concepts in a lecture style. ${isHindi ? 'Respond in Hindi using Devanagari script.' : 'Respond in clear Indian English.'}

TEACHING STYLE:
- Speak slowly and clearly as if explaining to a student face-to-face
- Use ${isHindi ? 'Hindi' : 'Indian English'} phrases naturally ("${isHindi ? 'देखो, यहाँ क्या होता है...' : 'See, what happens here is...'}", "${isHindi ? 'अब मैं यह समझाता हूं...' : 'Now, let me explain this simply...'}")
- Break complex topics into digestible parts
- Include practical examples and analogies
- For formulas, write them in LaTeX format: $formula$ for inline, $$formula$$ for display
- Highlight key terms by wrapping them in **bold**

CONTEXT FROM COURSE MATERIAL:
${context || 'No specific context available. Provide general educational explanation.'}

OUTPUT FORMAT:
You must respond with valid JSON in this exact structure:
{
  "presentation_slides": [
    {
      "title": "slide title",
      "content": "main explanation text with **highlighted** terms and $formulas$",
      "keyPoints": ["point 1", "point 2"],
      "formula": "optional LaTeX formula if relevant"
    }
  ],
  "narration_text": "lecture-style explanation text that will be spoken aloud, slow and clear",
  "latex_formulas": [
    {"formula": "E = mc^2", "explanation": "Energy equals mass times speed of light squared"}
  ],
  "key_points": ["summary point 1", "summary point 2", "summary point 3"],
  "follow_up_questions": ["suggested follow up question 1", "suggested follow up question 2"]
}

Create 2-4 slides depending on complexity. Make the narration natural and teacher-like.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI for response
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      // Fallback structure
      parsedContent = {
        presentation_slides: [{ title: "Answer", content: content, keyPoints: [] }],
        narration_text: content,
        latex_formulas: [],
        key_points: [],
        follow_up_questions: []
      };
    }

    // Cache the response
    const cacheData = {
      topic_id: topicId || null,
      chapter_id: chapterId || null,
      question_hash: questionHash,
      question_text: question,
      answer_text: parsedContent.narration_text || content,
      answer_html: null,
      presentation_slides: parsedContent.presentation_slides || [],
      latex_formulas: parsedContent.latex_formulas || [],
      language: language,
    };

    const { error: cacheError } = await supabase
      .from('teaching_qa_cache')
      .insert(cacheData);

    if (cacheError) {
      console.error('Cache insert error:', cacheError);
    }

    return new Response(
      JSON.stringify({
        cached: false,
        answer: parsedContent.narration_text || content,
        presentationSlides: parsedContent.presentation_slides || [],
        latexFormulas: parsedContent.latex_formulas || [],
        keyPoints: parsedContent.key_points || [],
        followUpQuestions: parsedContent.follow_up_questions || [],
        narrationText: parsedContent.narration_text || content,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-teaching-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
