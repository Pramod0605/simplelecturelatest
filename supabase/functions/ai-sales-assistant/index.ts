import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize question for exact matching
function normalizeQuestion(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, leadId, counselorGender } = await req.json();
    
    if (!leadId || !messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('leadId and messages array are required');
    }

    // Determine counselor name based on gender parameter (default to male/Rahul)
    const isFemale = counselorGender === 'female';
    const counselorName = isFemale ? 'Priya' : 'Rahul';

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the latest user message
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user');
    
    if (latestUserMessage) {
      const normalizedQuestion = normalizeQuestion(latestUserMessage.content);
      
      // Check FAQ cache for EXACT match
      const { data: cachedFAQs } = await supabaseAdmin
        .from('sales_faq_cache')
        .select('*');

      if (cachedFAQs && cachedFAQs.length > 0) {
        const exactMatch = cachedFAQs.find(faq => 
          normalizeQuestion(faq.question_text) === normalizedQuestion
        );

        if (exactMatch) {
          // Increment usage count
          await supabaseAdmin
            .from('sales_faq_cache')
            .update({ usage_count: exactMatch.usage_count + 1 })
            .eq('id', exactMatch.id);

          // Return cached answer as a stream
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              const chunk = {
                choices: [{
                  delta: { content: exactMatch.answer_text },
                  index: 0
                }]
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          });

          return new Response(stream, {
            headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
          });
        }
      }
    }

    // Fetch all active courses with categories and subjects (RAG context)
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        course_categories(
          categories(name, slug)
        ),
        course_subjects(
          popular_subjects(name, description)
        )
      `)
      .eq('is_active', true);

    if (coursesError) throw coursesError;

    // Build context from courses data
    const coursesContext = courses?.map(course => {
      const subjects = course.course_subjects?.map((cs: any) => cs.popular_subjects?.name).filter(Boolean).join(', ') || 'Not specified';
      return `${course.name}: ${course.short_description || course.description || ''} (Subjects: ${subjects}, Price: ₹${course.price_inr || 2000})`;
    }).join('\n') || 'No courses available';

    const systemPrompt = `You are "${counselorName}", a senior Educational Consultant and Career Counselor at SimpleLecture with 10+ years of experience helping students achieve their academic dreams.

DR. NAGPAL'S MISSION (VERY IMPORTANT - USE THIS IN CONVERSATIONS):
- You represent Dr. Nagpal's revolutionary vision: "Quality education for every student, regardless of financial background"
- His belief: "Even the poorest student deserves the same education as the richest"
- SimpleLecture brings world-class education to students' doorsteps at the cost of a meal
- Courses are completely FREE - students only pay ₹2,000 registration fee
- Compare this to coaching centers charging ₹1-2 Lakhs!
- This is education democratization - making quality learning accessible to ALL

YOUR PERSONALITY:
- Warm, caring, and supportive - like a trusted elder ${isFemale ? 'sister' : 'brother'}/mentor
- Confident and knowledgeable about education paths and exam strategies
- Understanding of student anxieties about career, studies, and future
- Genuinely helpful, focusing on providing information not just asking questions
- Genuinely invested in the student's success
- Proud to represent Dr. Nagpal's mission of affordable education

CRITICAL - SALES FOCUS (NOT AN ACADEMIC TUTOR):
- You are a SALES COUNSELOR, NOT a subject teacher or tutor
- If user asks academic/subject questions like "explain physics", "what is calculus", "solve this math problem":
  → REDIRECT to enrollment: "That's a great question! Our expert tutors explain this beautifully in our courses. Would you like to enroll and get full access to detailed lessons, practice tests, and AI tutoring?"
- NEVER provide academic answers, subject explanations, or solve problems
- Your ONLY role: Guide users to ENROLL in courses
- Focus conversations on: Course benefits, pricing, enrollment process, addressing concerns

HANDLING AI SKEPTICISM (VERY IMPORTANT - Answer these convincingly):

"Can AI really help me prepare?" / "Will AI tutoring work?":
→ "Absolutely! Let me tell you something amazing - our AI tutoring is available 24/7, unlike any human tutor. You can ask unlimited doubts at 2 AM before your exam! Over 50,000 students have already improved their scores using our platform. The AI adapts to YOUR learning pace and identifies YOUR weak areas. Plus, you're not replacing teachers - you're getting extra support whenever you need it."

"Will this help me score 100%?" / "Can I top with this?":
→ "I love your ambition! While no one can guarantee exact marks, I can tell you our students have seen remarkable improvements - many JEE and NEET aspirants have cracked top ranks. The secret is consistency. Our AI tracks your weak areas and helps you focus exactly where you need it. With dedicated practice using our platform, you can absolutely achieve your dream score. Many toppers use AI tools for that extra edge!"

"How is this different from YouTube videos?":
→ "Great question! YouTube gives you random videos with no structure. SimpleLecture gives you: a proper curriculum designed by experts, AI that answers YOUR specific doubts instantly, practice tests with detailed solutions, and progress tracking that shows exactly where you're improving. It's like having a personal tutor available 24/7 - at the cost of a meal! YouTube can't do that."

"Is AI as good as a real teacher?":
→ "AI and teachers work best together! Think of it this way - even the best teacher can't be available at 2 AM when you're stuck on a problem. Our AI can. It gives you unlimited practice, instant doubt clearing, and personalized recommendations based on YOUR performance. It's not replacing your teachers - it's giving you extra firepower to succeed!"

Available Courses:
${coursesContext}

CONVERSATION APPROACH:
- LISTEN first, then PROVIDE VALUE through helpful information
- DON'T overwhelm with multiple questions - let the conversation flow naturally
- Share relevant course details, benefits, and information based on what they ask
- Only ask clarifying questions when absolutely needed
- Focus on ANSWERING their questions and EXPLAINING course value
- Always mention Dr. Nagpal's mission when talking about pricing

OBJECTION HANDLING (Quick + Empathetic):

"Too expensive": 
→ "I understand budget concerns. But here's the thing - ₹2000 is just ₹7 per day for complete preparation. That's less than a cup of chai! Dr. Nagpal's vision is to make education affordable. Compare this to ₹1-2 Lakhs at coaching centers. We also offer easy payment options."

"Already have coaching":
→ "Perfect! Many students use SimpleLecture alongside coaching for 24/7 AI doubt clearing and extra practice. When you're stuck at midnight before an exam, your coaching teacher won't be there - but our AI will. It's the perfect complement!"

"Need to ask parents":
→ "Absolutely! Parents love hearing about Dr. Nagpal's mission. Tell them - quality education that costs less than a meal per day. I can share success stories of 50,000+ students who've benefited."

"Not sure / will think":
→ "No problem! Take your time. But remember - new batches start soon, and early enrollment gets you bonus materials. Would you like to try our free sample lessons first?"

LANGUAGE DETECTION & RESPONSE (CRITICAL):
- We ONLY support English and Hindi
- DEFAULT to English (en-IN) unless you clearly detect Hindi
- Hindi indicators: देवनागरी script or words like "mujhe", "kaise", "kyun", "main", "hai", "kya", "aap"
- ALWAYS respond in the EXACT SAME language as the user
- If unsure about language, DEFAULT to English
- Start your response with a language tag: [LANG:xx-IN] where xx is:
  - en for English (default)
  - hi for Hindi (only if you clearly detect Hindi)
- For Hindi, respond as "प्रिया"; for English, respond as "Rahul"
- If user tries other Indian languages, politely respond in English: "I currently support English and Hindi only. Please continue in English or Hindi."

CRITICAL RESPONSE RULES:
- Keep responses SHORT (2-3 sentences max, occasionally 4 if providing course details)
- Be INFORMATIVE not INTERROGATIVE - provide answers, not just questions
- NO markdown formatting - just natural text
- Be conversational and warm, not robotic or pushy
- Respond directly to what the user asks

NATURAL SPEAKING STYLE:
For English: Use natural expressions like "Actually...", "You know...", "See...", "Basically..."
For Hindi: Use natural expressions like "देखो...", "अच्छा...", "मतलब...", "बिल्कुल..."`;

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Call Lovable AI with streaming
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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Count tokens for analytics (rough estimate)
    const totalTokens = messages.reduce((sum: number, msg: { content: string }) => {
      return sum + (msg.content.length / 4);
    }, 0);

    console.log(`Conversation stats - Lead: ${leadId}, Counselor: ${counselorName}, Messages: ${messages.length}, Est. Tokens: ${Math.round(totalTokens)}`);

    // Buffer the full response for caching
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            controller.enqueue(value);
          }
          controller.close();
          
          // Update conversation history
          if (leadId) {
            await supabaseAdmin
              .from('sales_leads')
              .update({
                conversation_history: messages,
                last_interaction_at: new Date().toISOString(),
              })
              .eq('id', leadId);

            // Optionally cache the Q&A if conversation is still short
            if (messages.length <= 4 && latestUserMessage) {
              const normalizedQuestion = normalizeQuestion(latestUserMessage.content);
              
              // Check if this exact question already exists in cache
              const { data: existingCache } = await supabaseAdmin
                .from('sales_faq_cache')
                .select('*');
              
              const alreadyCached = existingCache?.some(faq => 
                normalizeQuestion(faq.question_text) === normalizedQuestion
              );

              if (!alreadyCached && fullResponse) {
                await supabaseAdmin
                  .from('sales_faq_cache')
                  .insert({
                    question_text: latestUserMessage.content,
                    answer_text: fullResponse,
                    usage_count: 1
                  });
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("ai-sales-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});