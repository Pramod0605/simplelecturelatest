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

// Clean JSON response - handle markdown code blocks and escape issues
function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  
  // Remove markdown code block wrappers
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  // Try to find JSON object boundaries
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }
  
  return cleaned.trim();
}

// Robust JSON parsing with multiple strategies
function parseAIResponseRobust(rawContent: string): any {
  // Strategy 1: Direct parse after cleaning
  try {
    const cleaned = cleanJsonResponse(rawContent);
    return JSON.parse(cleaned);
  } catch (e1) {
    console.log('Strategy 1 (direct parse) failed:', (e1 as Error).message);
  }
  
  // Strategy 2: Fix common escape issues
  try {
    let sanitized = cleanJsonResponse(rawContent);
    // Fix unescaped newlines in string values
    sanitized = sanitized.replace(/\n/g, '\\n');
    sanitized = sanitized.replace(/\r/g, '\\r');
    sanitized = sanitized.replace(/\t/g, '\\t');
    return JSON.parse(sanitized);
  } catch (e2) {
    console.log('Strategy 2 (escape fix) failed:', (e2 as Error).message);
  }
  
  // Strategy 3: Remove control characters
  try {
    let sanitized = cleanJsonResponse(rawContent);
    // Remove all control characters except \n \r \t which we'll escape
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    // Now escape the remaining whitespace chars
    sanitized = sanitized.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    return JSON.parse(sanitized);
  } catch (e3) {
    console.log('Strategy 3 (control char removal) failed:', (e3 as Error).message);
  }
  
  // Strategy 4: Extract presentation_slides array using regex
  try {
    const slidesMatch = rawContent.match(/"presentation_slides"\s*:\s*\[([\s\S]*?)\](?=\s*,?\s*["}\]])/);
    if (slidesMatch) {
      // Try to extract individual slide objects
      const slidesContent = slidesMatch[1];
      const slideObjects: any[] = [];
      
      // Match each slide object
      const slideMatches = slidesContent.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      for (const match of slideMatches) {
        try {
          const slideText = match[0].replace(/\n/g, '\\n').replace(/\r/g, '\\r');
          slideObjects.push(JSON.parse(slideText));
        } catch (slideErr) {
          console.log('Could not parse individual slide');
        }
      }
      
      if (slideObjects.length > 0) {
        console.log(`Strategy 4 extracted ${slideObjects.length} slides via regex`);
        return { presentation_slides: slideObjects };
      }
    }
  } catch (e4) {
    console.log('Strategy 4 (regex extraction) failed:', (e4 as Error).message);
  }
  
  // All strategies failed
  console.error('All JSON parsing strategies failed');
  return null;
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

    // SKIP CACHE - Always generate fresh presentations for now
    console.log('Skipping cache - generating fresh presentation');


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
- Speak SLOWLY and CLEARLY as if explaining to a student face-to-face
- Use natural ${isHindi ? 'Hindi' : 'Indian English'} phrases ("${isHindi ? 'देखो, यहाँ क्या होता है...' : 'See, what happens here is...'}", "${isHindi ? 'अब मैं यह समझाता हूं...' : 'Now, let me explain this simply...'}")
- Create EXACTLY 6 slides for a complete explanation
- Each slide MUST have detailed narration (150-250 words per slide) for audio playback
- Include practical examples and analogies in every concept slide
- For formulas, write them in LaTeX format: $formula$ for inline, $$formula$$ for display
- Highlight key terms by wrapping them in **bold**

CONTEXT FROM COURSE MATERIAL:
${context || 'No specific context available. Provide general educational explanation.'}

MANDATORY 6-SLIDE STRUCTURE (FOLLOW EXACTLY):

SLIDE 1 - Introduction:
- title: "Introduction to [Topic]"
- content: Brief definition
- keyPoints: 3 key terms to understand
- narration: 150-200 words explaining what and why
- infographic: "Diagram showing [topic overview visual]"

SLIDE 2 - Core Concept:
- title: "[Main Concept]"
- content: Explanation with formula if applicable
- keyPoints: 3 important points
- formula: "LaTeX formula if applicable"
- narration: 150-200 words deep explanation
- infographic: "Chart/diagram showing [concept visual]"

SLIDE 3 - Example/Application:
- title: "Understanding Through Example"
- content: Practical example with step-by-step
- keyPoints: Key steps or points
- narration: 150-200 words working through example
- infographic: "Illustration showing [example visual]"

SLIDE 4 - Advanced Points:
- title: "Important Details"
- content: Additional important information
- keyPoints: 3-4 detailed points
- narration: 150-200 words covering nuances
- infographic: "Visual showing [detailed diagram]"

SLIDE 5 - Real-World Story (MANDATORY):
- title: "A Story to Remember"
- content: Relatable real-world story or analogy
- keyPoints: ["Key takeaway from story"]
- narration: 200-250 words engaging story with emotional connection
- isStory: true
- infographic: "Scene illustration: [describe characters, setting, action in the story]"

SLIDE 6 - Tips & Tricks (MANDATORY):
- title: "Tips & Tricks to Remember"
- content: Memory tricks, mnemonics, quick recall methods
- keyPoints: ["Mnemonic 1", "Memory trick 2", "Quick formula tip"]
- narration: 150-200 words with practical memory techniques
- isTips: true

OUTPUT FORMAT (STRICT JSON - no markdown code blocks):
{
  "presentation_slides": [
    {
      "title": "string",
      "content": "string with **bold** terms",
      "narration": "150-250 word spoken text",
      "keyPoints": ["point1", "point2", "point3"],
      "formula": "optional LaTeX",
      "infographic": "description for image generation",
      "isStory": false,
      "isTips": false
    }
  ],
  "latex_formulas": [{"formula": "E=mc^2", "explanation": "explanation"}],
  "key_points": ["summary1", "summary2"],
  "follow_up_questions": ["question1", "question2"]
}

CRITICAL: 
- EVERY slide MUST have an "infographic" field with a detailed visual description
- Slide 5 MUST have "isStory": true
- Slide 6 MUST have "isTips": true
- Return ONLY valid JSON, no markdown code blocks`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI for response
    console.log('Calling AI for presentation generation...');
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
    const rawContent = aiResponse.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("No response from AI");
    }

    console.log('Raw AI response length:', rawContent.length);

    // Clean and parse JSON response with robust parsing
    let parsedContent = parseAIResponseRobust(rawContent);
    
    if (!parsedContent || !parsedContent.presentation_slides || parsedContent.presentation_slides.length === 0) {
      console.error('❌ JSON parsing completely failed - returning error response');
      console.error('Raw content preview:', rawContent.substring(0, 500));
      
      // Return a proper error response instead of dumping raw JSON
      return new Response(
        JSON.stringify({
          error: "Failed to generate presentation. Please try again.",
          cached: false,
          presentationSlides: [{
            title: isHindi ? "त्रुटि" : "Error",
            content: isHindi ? "प्रस्तुति बनाने में समस्या हुई।" : "There was a problem creating the presentation.",
            keyPoints: [isHindi ? "कृपया पुनः प्रयास करें" : "Please try again"],
            narration: isHindi ? "क्षमा करें, प्रस्तुति बनाने में कुछ समस्या हुई। कृपया दोबारा प्रश्न पूछें।" : "Sorry, there was an issue creating your presentation. Please ask your question again."
          }],
          latexFormulas: [],
          keyPoints: [],
          followUpQuestions: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log('✅ Successfully parsed AI response with', parsedContent.presentation_slides?.length || 0, 'slides');
    
    // Log first slide structure for debugging
    if (parsedContent.presentation_slides?.[0]) {
      const firstSlide = parsedContent.presentation_slides[0];
      console.log('First slide keys:', Object.keys(firstSlide).join(', '));
      console.log('First slide title:', firstSlide.title);
      console.log('First slide has keyPoints:', Array.isArray(firstSlide.keyPoints) ? firstSlide.keyPoints.length : 'no');
      console.log('First slide has key_points:', Array.isArray(firstSlide.key_points) ? firstSlide.key_points.length : 'no');
    }

    // Ensure all slides have narration and validate structure - handle BOTH camelCase and snake_case
    let slides = (parsedContent.presentation_slides || []).map((slide: any, index: number) => ({
      title: slide.title || `Slide ${index + 1}`,
      content: slide.content || '',
      narration: slide.narration || slide.content || '',
      // Handle both keyPoints (camelCase) and key_points (snake_case) from AI
      keyPoints: slide.keyPoints || slide.key_points || [],
      formula: slide.formula || null,
      infographic: slide.infographic || null,
      isStory: slide.isStory === true || slide.is_story === true,
      isTips: slide.isTips === true || slide.is_tips === true,
    }));

    console.log(`Processing ${slides.length} slides...`);
    
    // Log each slide structure for debugging
    slides.forEach((slide: any, idx: number) => {
      console.log(`Slide ${idx + 1}: "${slide.title}" - ${slide.keyPoints?.length || 0} keyPoints, infographic: ${slide.infographic ? 'yes' : 'no'}`);
    });

    // Validate and add missing story/tips slides if needed
    const hasStorySlide = slides.some((s: any) => s.isStory === true);
    const hasTipsSlide = slides.some((s: any) => s.isTips === true);

    if (!hasStorySlide) {
      console.log('Adding missing story slide...');
      slides.push({
        title: isHindi ? "याद रखने के लिए एक कहानी" : "A Story to Remember",
        content: isHindi 
          ? "इस अवधारणा को समझने के लिए एक सरल उदाहरण सोचें..."
          : "Think of a simple real-world example to understand this concept...",
        narration: isHindi
          ? "देखो, इस अवधारणा को याद रखने के लिए, एक सरल कहानी सोचो। जब हम रोजमर्रा की जिंदगी में इस सिद्धांत को देखते हैं, तो यह समझना बहुत आसान हो जाता है। याद रखो, हर बड़ी खोज एक साधारण प्रश्न से शुरू हुई।"
          : "See, to remember this concept, think of a simple story. When we observe this principle in everyday life, it becomes much easier to understand. Remember, every great discovery started with a simple question. The key is to connect what we learn in textbooks with what we see around us every day.",
        keyPoints: [isHindi ? "व्यावहारिक उदाहरण" : "Practical application"],
        isStory: true,
        infographic: "Illustration showing a student having an 'aha moment' while observing the concept in real life"
      });
    }

    if (!hasTipsSlide) {
      console.log('Adding missing tips slide...');
      slides.push({
        title: isHindi ? "याद रखने के टिप्स" : "Tips & Tricks to Remember",
        content: isHindi
          ? "इन आसान तरीकों से याद करें..."
          : "Use these simple tricks to remember...",
        narration: isHindi
          ? "अब मैं तुम्हें कुछ आसान तरीके बताता हूं जिनसे तुम यह सब याद रख सकते हो। पहला, एक छोटा सा फॉर्मूला याद करो। दूसरा, हमेशा चित्र बनाकर सोचो। तीसरा, रोज थोड़ा-थोड़ा अभ्यास करो।"
          : "Now let me share some simple tricks to help you remember all this. First, memorize a short formula or mnemonic. Second, always visualize the concept with a diagram. Third, practice a little bit every day. These three simple steps will make sure you never forget what we learned today.",
        keyPoints: [
          isHindi ? "संक्षिप्त सूत्र याद करें" : "Remember key formulas",
          isHindi ? "चित्र बनाकर सोचें" : "Visualize with diagrams", 
          isHindi ? "रोज अभ्यास करें" : "Practice daily"
        ],
        isTips: true,
        infographic: "Visual showing memory techniques: flashcards, mind maps, and practice schedule"
      });
    }

    // Count slides with infographic descriptions
    const slidesWithInfographicDesc = slides.filter((s: any) => s.infographic && s.infographic.length > 10);
    console.log(`${slidesWithInfographicDesc.length} slides have infographic descriptions`);

    // Generate infographics for ALL slides that have descriptions
    console.log(`Generating infographics for ${slidesWithInfographicDesc.length} slides...`);
    
    const slidesWithInfographics = await Promise.all(
      slides.map(async (slide: any, idx: number) => {
        if (slide.infographic && slide.infographic.length > 10) {
          console.log(`[Slide ${idx + 1}] Generating infographic: "${slide.infographic.substring(0, 60)}..."`);
          try {
            // Use correct model with modalities parameter
            const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-image-preview",
                modalities: ["image", "text"],
                messages: [
                  {
                    role: "user",
                    content: `Create a clear, educational infographic or diagram for students.

Topic: ${slide.title}
Visual Description: ${slide.infographic}

Requirements:
- Clean, professional educational illustration
- Clear labels in English
- Simple color coding (blue, green, orange for contrast)
- Easy to understand at a glance
- White or light background
- Suitable for 10th-12th grade students
- No text-heavy elements, focus on visuals`
                  }
                ],
              }),
            });

            console.log(`[Slide ${idx + 1}] Image API response status:`, imageResponse.status);
            
            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              
              // Extract image from response - check all possible paths
              let generatedImage = null;
              
              // Path 1: images array in message
              if (imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
                generatedImage = imageData.choices[0].message.images[0].image_url.url;
                console.log(`[Slide ${idx + 1}] Found image in message.images`);
              }
              // Path 2: content array with image_url type
              else if (Array.isArray(imageData.choices?.[0]?.message?.content)) {
                const imageContent = imageData.choices[0].message.content.find(
                  (c: any) => c.type === 'image' || c.type === 'image_url'
                );
                if (imageContent?.image_url?.url) {
                  generatedImage = imageContent.image_url.url;
                  console.log(`[Slide ${idx + 1}] Found image in content array`);
                }
              }
              // Path 3: direct data array
              else if (imageData.data?.[0]?.url) {
                generatedImage = imageData.data[0].url;
                console.log(`[Slide ${idx + 1}] Found image in data array`);
              }
              
              if (generatedImage) {
                console.log(`[Slide ${idx + 1}] ✅ Infographic generated successfully`);
                return { ...slide, infographicUrl: generatedImage };
              } else {
                console.log(`[Slide ${idx + 1}] ⚠️ No image URL in response. Keys:`, Object.keys(imageData));
                if (imageData.choices?.[0]?.message) {
                  console.log(`[Slide ${idx + 1}] Message keys:`, Object.keys(imageData.choices[0].message));
                }
              }
            } else {
              const errorText = await imageResponse.text();
              console.error(`[Slide ${idx + 1}] ❌ Image API error:`, imageResponse.status, errorText.substring(0, 300));
            }
          } catch (imgError) {
            console.error(`[Slide ${idx + 1}] ❌ Infographic generation exception:`, imgError);
          }
        } else {
          console.log(`[Slide ${idx + 1}] Skipping - no infographic description`);
        }
        return slide;
      })
    );

    // Log final slide status
    const generatedCount = slidesWithInfographics.filter((s: any) => s.infographicUrl).length;
    console.log(`Infographic generation complete: ${generatedCount}/${slides.length} slides have images`);

    // Generate video for story slide if it exists
    const storySlide = slidesWithInfographics.find((s: any) => s.isStory);
    if (storySlide) {
      console.log('Generating video for story slide...');
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
              console.log('✅ Story video generated');
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

    console.log('Returning response with', slidesWithInfographics.length, 'slides');

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
