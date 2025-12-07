import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Check if question is relevant to the subject
function isQuestionRelevant(question: string, subjectName: string): boolean {
  const lowerQuestion = question.toLowerCase();
  const lowerSubject = subjectName.toLowerCase();
  
  // Subject-specific keywords
  const subjectKeywords: Record<string, string[]> = {
    'physics': ['force', 'motion', 'energy', 'velocity', 'acceleration', 'gravity', 'newton', 'wave', 'light', 'electricity', 'magnetism', 'quantum', 'relativity', 'momentum', 'work', 'power', 'optics', 'thermodynamics', 'physics'],
    'chemistry': ['atom', 'molecule', 'element', 'compound', 'reaction', 'bond', 'acid', 'base', 'organic', 'inorganic', 'periodic', 'electron', 'proton', 'neutron', 'chemistry', 'chemical'],
    'mathematics': ['equation', 'formula', 'algebra', 'geometry', 'calculus', 'derivative', 'integral', 'function', 'graph', 'number', 'theorem', 'proof', 'matrix', 'vector', 'math', 'maths', 'mathematics'],
    'biology': ['cell', 'organism', 'dna', 'gene', 'protein', 'evolution', 'species', 'ecosystem', 'photosynthesis', 'respiration', 'biology', 'life', 'living'],
  };
  
  // Check if question contains subject-related keywords
  const keywords = subjectKeywords[lowerSubject] || [];
  const hasRelevantKeyword = keywords.some(kw => lowerQuestion.includes(kw));
  
  // Also check if subject name is mentioned
  const mentionsSubject = lowerQuestion.includes(lowerSubject);
  
  // Be generous - if no specific keywords found, still allow general educational questions
  const generalEducationalTerms = ['explain', 'what is', 'how does', 'why', 'define', 'describe', 'calculate', 'solve', 'prove', 'derive'];
  const isEducational = generalEducationalTerms.some(term => lowerQuestion.includes(term));
  
  return hasRelevantKeyword || mentionsSubject || isEducational || keywords.length === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, topicId, chapterId, language = 'en-IN', subjectName = 'General' } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if question is relevant to the subject
    if (subjectName && subjectName !== 'General' && !isQuestionRelevant(question, subjectName)) {
      const isHindi = language === 'hi-IN';
      const notRelevantResponse = {
        cached: false,
        answer: isHindi 
          ? `मैं ${subjectName} का AI प्रोफेसर हूं। यह प्रश्न ${subjectName} से संबंधित नहीं लगता। कृपया संबंधित विषय के AI प्रोफेसर से पूछें।`
          : `I am the ${subjectName} AI Professor. This question doesn't seem to be related to ${subjectName}. Please consult the respective subject's AI Professor for this query.`,
        presentationSlides: [{
          title: isHindi ? 'विषय सीमा' : 'Subject Scope',
          content: isHindi 
            ? `मैं **${subjectName}** विषय में विशेषज्ञ हूं। आपका प्रश्न किसी अन्य विषय से संबंधित प्रतीत होता है।\n\nकृपया उपयुक्त विषय के AI प्रोफेसर से सहायता लें।`
            : `I specialize in **${subjectName}**. Your question appears to be related to a different subject.\n\nPlease consult the appropriate subject's AI Professor for assistance.`,
          keyPoints: [
            isHindi ? `${subjectName} के प्रश्न पूछें` : `Ask questions about ${subjectName}`,
            isHindi ? 'अन्य विषयों के लिए उचित AI प्रोफेसर चुनें' : 'Choose the right AI Professor for other subjects'
          ],
          narration: isHindi 
            ? `नमस्ते! मैं ${subjectName} का AI प्रोफेसर हूं। यह प्रश्न मेरी विशेषज्ञता से बाहर है। कृपया संबंधित विषय के प्रोफेसर से पूछें।`
            : `Hello! I am the ${subjectName} AI Professor. This question is outside my expertise. Please ask the relevant subject professor.`
        }],
        latexFormulas: [],
        keyPoints: [],
        followUpQuestions: [],
        narrationText: isHindi 
          ? `नमस्ते! मैं ${subjectName} का AI प्रोफेसर हूं।`
          : `Hello! I am the ${subjectName} AI Professor.`,
      };
      
      return new Response(
        JSON.stringify(notRelevantResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate question hash for cache lookup
    const questionHash = await hashQuestion(question);
    console.log('Question hash:', questionHash, 'Topic:', topicId, 'Subject:', subjectName);

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
    let detectedSubject = subjectName;

    if (topicId) {
      const { data: topic } = await supabase
        .from('subject_topics')
        .select('*, chapter:subject_chapters(*, subject:popular_subjects(name))')
        .eq('id', topicId)
        .single();
      
      if (topic) {
        context += `Topic: ${topic.title}\n`;
        if (topic.content_markdown) context += `Content: ${topic.content_markdown}\n`;
        if (topic.notes_markdown) context += `Notes: ${topic.notes_markdown}\n`;
        if (topic.chapter) {
          context += `Chapter: ${topic.chapter.title}\n`;
          if (topic.chapter.subject?.name) {
            detectedSubject = topic.chapter.subject.name;
          }
        }
      }
    } else if (chapterId) {
      const { data: chapter } = await supabase
        .from('subject_chapters')
        .select('*, subject:popular_subjects(name)')
        .eq('id', chapterId)
        .single();
      
      if (chapter) {
        context += `Chapter: ${chapter.title}\n`;
        if (chapter.subject?.name) {
          detectedSubject = chapter.subject.name;
        }
      }
    }

    // System prompt for lecture-style teaching with per-slide narration
    const isHindi = language === 'hi-IN';
    const professorName = isHindi ? 'प्रोफेसर' : 'Professor';
    
    const systemPrompt = `You are ${professorName} AI, an expert Indian teacher specializing in ${detectedSubject}. You explain concepts in an engaging, lecture-style presentation format. ${isHindi ? 'Respond in Hindi using Devanagari script.' : 'Respond in clear Indian English.'}

SUBJECT EXPERTISE: ${detectedSubject}
- If the question is NOT related to ${detectedSubject}, politely redirect: "I am the ${detectedSubject} AI Professor. For questions about [other topic], please consult the respective AI Professor."

TEACHING STYLE:
- Speak slowly and clearly as if explaining to a student face-to-face
- Use natural ${isHindi ? 'Hindi' : 'Indian English'} phrases ("${isHindi ? 'देखो, यहाँ क्या होता है...' : 'See, what happens here is...'}", "${isHindi ? 'अब मैं यह समझाता हूं...' : 'Now, let me explain this simply...'}")
- Break complex topics into digestible slides (4-6 slides)
- Each slide should have its own narration for audio playback
- Include practical examples and analogies
- For formulas, write them in LaTeX format: $formula$ for inline, $$formula$$ for display
- Highlight key terms by wrapping them in **bold**

CONTEXT FROM COURSE MATERIAL:
${context || 'No specific context available. Provide general educational explanation.'}

CRITICAL REQUIREMENTS:
1. Each slide MUST have a "narration" field - the exact text to be spoken aloud for that slide
2. The SECOND-TO-LAST slide MUST be a story/real-world example with "isStory": true
3. The LAST slide MUST be "Tips & Tricks to Remember" with "isTips": true - include memory tricks, mnemonics, and quick recall techniques
4. Include infographics descriptions where visual aids would help understanding
5. Keep each slide focused on ONE concept

OUTPUT FORMAT (strict JSON):
{
  "presentation_slides": [
    {
      "title": "Introduction to [Topic]",
      "content": "Main explanation with **highlighted** terms and $formulas$",
      "narration": "Spoken narration for this specific slide - conversational, slow, clear",
      "keyPoints": ["Key point 1", "Key point 2"],
      "formula": "Optional LaTeX formula",
      "infographic": "Optional: Description of helpful diagram/chart"
    },
    {
      "title": "Real-World Example",
      "content": "A relatable story that makes this concept memorable...",
      "narration": "Let me share a story to help you understand this better...",
      "keyPoints": ["Takeaway from the story"],
      "isStory": true
    },
    {
      "title": "Tips & Tricks to Remember",
      "content": "Memory tricks and mnemonics to help you recall this concept easily...",
      "narration": "Here are some simple tricks to remember everything we learned...",
      "keyPoints": ["Mnemonic 1", "Quick formula trick", "Visual memory technique"],
      "isTips": true
    }
  ],
  "latex_formulas": [
    {"formula": "E = mc^2", "explanation": "Energy equals mass times speed of light squared"}
  ],
  "key_points": ["Summary point 1", "Summary point 2"],
  "follow_up_questions": ["Follow up 1", "Follow up 2"]
}

SLIDE STRUCTURE:
1. Introduction/Concept slides (2-3 slides)
2. Story/Real-world example slide (isStory: true)
3. Tips & Tricks to Remember slide (isTips: true) - ALWAYS the last slide

TIPS & TRICKS SLIDE REQUIREMENTS:
- Include mnemonics (e.g., "ROY G BIV" for colors)
- Memory tricks using familiar associations
- Quick recall techniques for formulas
- Visualization tips
- Common mistake warnings`;

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
      parsedContent = {
        presentation_slides: [{ 
          title: "Answer", 
          content: content, 
          keyPoints: [],
          narration: content 
        }],
        latex_formulas: [],
        key_points: [],
        follow_up_questions: []
      };
    }

    // Ensure all slides have narration
    const slides = (parsedContent.presentation_slides || []).map((slide: any, index: number) => ({
      ...slide,
      narration: slide.narration || slide.content || '',
    }));

    // Generate infographics for slides that need them
    console.log(`Processing ${slides.length} slides for infographics...`);
    const slidesWithInfographics = await Promise.all(
      slides.map(async (slide: any, idx: number) => {
        if (slide.infographic) {
          console.log(`Generating infographic for slide ${idx + 1}: ${slide.infographic.substring(0, 50)}...`);
          try {
            // Generate actual infographic using Lovable AI image generation
            const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-image-preview",
                messages: [
                  {
                    role: "user",
                    content: `Create a simple, clear educational infographic: ${slide.infographic}. Make it suitable for students, with clear labels and easy-to-understand visuals.`
                  }
                ],
                modalities: ["image", "text"]
              }),
            });

            console.log(`Infographic API response status for slide ${idx + 1}:`, imageResponse.status);
            
            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              if (generatedImage) {
                console.log(`Infographic generated successfully for slide ${idx + 1}, URL length: ${generatedImage.length}`);
                return { ...slide, infographicUrl: generatedImage };
              } else {
                console.log(`No image URL in response for slide ${idx + 1}:`, JSON.stringify(imageData).substring(0, 200));
              }
            } else {
              const errorText = await imageResponse.text();
              console.error(`Infographic API error for slide ${idx + 1}:`, imageResponse.status, errorText.substring(0, 200));
            }
          } catch (imgError) {
            console.error(`Infographic generation error for slide ${idx + 1}:`, imgError);
          }
        }
        return slide;
      })
    );

    // Generate video for story slide if it exists
    const storySlide = slidesWithInfographics.find((s: any) => s.isStory);
    if (storySlide) {
      try {
        const videoResponse = await fetch(`${supabaseUrl}/functions/v1/generate-story-video`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storyText: storySlide.narration || storySlide.content,
            prompt: `Educational animation about: ${storySlide.title}. ${storySlide.content?.substring(0, 100)}`
          }),
        });

        if (videoResponse.ok) {
          const videoData = await videoResponse.json();
          if (videoData.success && videoData.videoUrl) {
            const storyIndex = slidesWithInfographics.findIndex((s: any) => s.isStory);
            if (storyIndex !== -1) {
              slidesWithInfographics[storyIndex] = {
                ...slidesWithInfographics[storyIndex],
                videoUrl: videoData.videoUrl
              };
            }
          }
        }
      } catch (videoError) {
        console.error('Video generation error:', videoError);
      }
    }

    // Cache the response
    const cacheData = {
      topic_id: topicId || null,
      chapter_id: chapterId || null,
      question_hash: questionHash,
      question_text: question,
      answer_text: slidesWithInfographics.map((s: any) => s.narration).join(' '),
      answer_html: null,
      presentation_slides: slidesWithInfographics,
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
        answer: slidesWithInfographics.map((s: any) => s.narration).join(' '),
        presentationSlides: slidesWithInfographics,
        latexFormulas: parsedContent.latex_formulas || [],
        keyPoints: parsedContent.key_points || [],
        followUpQuestions: parsedContent.follow_up_questions || [],
        narrationText: slidesWithInfographics.map((s: any) => s.narration).join(' '),
        subjectName: detectedSubject,
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