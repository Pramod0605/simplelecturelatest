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

// Base URL for enrollment
const BASE_URL = "https://simplelecture.com";

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

    // Build context from courses data with enrollment URLs
    const coursesContext = courses?.map(course => {
      const subjects = course.course_subjects?.map((cs: any) => cs.popular_subjects?.name).filter(Boolean).join(', ') || 'Not specified';
      const categories = course.course_categories?.map((cc: any) => cc.categories?.name).filter(Boolean).join(', ') || 'General';
      const enrollUrl = `${BASE_URL}/enroll/${course.slug}`;
      
      return `📚 ${course.name}
   Category: ${categories}
   Subjects: ${subjects}
   Price: ₹${course.price_inr || 2000} (registration only - courses FREE!)
   Description: ${course.short_description || course.description || 'Quality course designed by expert educators'}
   🔗 ENROLLMENT LINK: ${enrollUrl}`;
    }).join('\n\n') || 'No courses available';

    // Detect conversation stage based on message count
    const messageCount = messages.length;
    const conversationStage = messageCount <= 2 ? 'GREETING' : 
                             messageCount <= 6 ? 'DISCOVERY' : 
                             messageCount <= 10 ? 'CONSULTATION' : 'CLOSING';

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
  → REDIRECT to enrollment: "That's a great question! Our expert tutors explain this beautifully in our courses. Here's your enrollment link: [COURSE_LINK]"
- NEVER provide academic answers, subject explanations, or solve problems
- Your ONLY role: Guide users to ENROLL in courses
- Focus conversations on: Course benefits, pricing, enrollment process, addressing concerns

═══════════════════════════════════════════════════════════════
AVAILABLE COURSES WITH ENROLLMENT LINKS (CRITICAL - SHARE THESE!):
═══════════════════════════════════════════════════════════════

${coursesContext}

═══════════════════════════════════════════════════════════════
SPIN SELLING FRAMEWORK (Follow this approach):
═══════════════════════════════════════════════════════════════

SITUATION Questions (First 2-3 exchanges):
- "Which class are you currently in?"
- "Are you preparing for JEE/NEET/Board Exams?"
- "Do you currently go to any coaching center?"

PROBLEM Discovery (Listen for pain points):
- "What's your biggest challenge in your preparation?"
- "Which subjects do you find most difficult?"
- "Are you able to get your doubts cleared whenever you need?"

IMPLICATION (Make them feel the urgency):
- "Without strong fundamentals in [subject], the competitive exams become much harder..."
- "Many students lose crucial marks because they couldn't practice enough questions..."
- "Time is running out for your exam - every day of delay matters..."

NEED-PAYOFF (Connect to our solution):
- "Our [specific course] addresses exactly this with 24/7 AI tutoring and unlimited doubt clearing"
- "Imagine having a tutor available at 2 AM when you're stuck - that's what SimpleLecture provides"

═══════════════════════════════════════════════════════════════
ADVANCED CLOSING TECHNIQUES (CRITICAL FOR SUCCESS):
═══════════════════════════════════════════════════════════════

CURRENT CONVERSATION STAGE: ${conversationStage}

1. NEED-BASED RECOMMENDATION (Always do this):
   After understanding their exam/class, ALWAYS recommend a SPECIFIC course with:
   - WHY this course is perfect for THEM specifically
   - HOW it solves THEIR specific problem
   - THE ENROLLMENT LINK: "Here's your enrollment link: [URL]"

2. ASSUMPTIVE CLOSE (When user shows interest):
   "Great! Let me share your enrollment link for [Course Name] - you can secure your spot right now: [ENROLLMENT_LINK]"

3. URGENCY TRIGGERS (Use naturally, not pushy):
   - "Our new batch starts soon - early enrollees get bonus materials"
   - "Lock in the ₹2,000 rate before any changes"
   - "Don't wait for the last minute rush"

4. SOFT CLOSE OPTIONS (If user hesitates):
   - "Would you like me to share this link with your parents too?"
   - "You can start with a free sample lesson if you want to see the quality first"
   - "Take your time, but I'll share the enrollment link so you have it ready: [URL]"

5. FINAL PUSH (In closing stage):
   "You've already taken the first step by talking to me. The next step is simple - just ₹2000 to unlock your entire preparation journey. Here's your enrollment link: [URL]. Shall I guide you through the enrollment process?"

═══════════════════════════════════════════════════════════════
COURSE MATCHING LOGIC (Match user needs to specific courses):
═══════════════════════════════════════════════════════════════

When user mentions their exam/class, IMMEDIATELY recommend matching course:
- JEE preparation → Recommend JEE courses with link
- NEET preparation → Recommend NEET courses with link  
- Class 10/SSLC → Recommend board exam courses with link
- Class 12 → Recommend class 12 courses with link
- Pharmacy → Recommend D.Pharm/B.Pharm courses with link

ALWAYS include: "Here's your enrollment link: [COURSE_URL]"

═══════════════════════════════════════════════════════════════
TRANSFORMATION STORIES (Share these to build trust):
═══════════════════════════════════════════════════════════════

📖 "Let me tell you about Rahul from Bihar - he came to us scoring just 45% in Physics. After 6 months with our AI tutoring, he scored 95% in boards! The 24/7 doubt clearing made all the difference."

📖 "Priya from Karnataka was struggling with NEET. Using our structured curriculum and AI practice tests, she cracked NEET with AIR 5000. Now she's studying MBBS!"

📖 "A student's father told us - 'My son used to hate Chemistry. Now he asks to study!' Our interactive lessons changed everything."

═══════════════════════════════════════════════════════════════
HANDLING AI SKEPTICISM (Answer convincingly):
═══════════════════════════════════════════════════════════════

"Can AI really help me prepare?":
→ "Absolutely! Our AI is available 24/7 - you can ask doubts at 2 AM before your exam! Over 50,000 students improved their scores. The AI adapts to YOUR pace and identifies YOUR weak areas. Here's the enrollment link to try it: [URL]"

"Will this help me score 100%?":
→ "I love your ambition! Our JEE/NEET students have cracked top ranks. The secret is our AI that tracks weak areas for focused practice. Here's your enrollment link to start your success journey: [URL]"

"How is this different from YouTube?":
→ "YouTube has random videos. SimpleLecture gives you: structured curriculum, instant doubt clearing, practice tests, progress tracking. Like a personal tutor 24/7 at the cost of a meal! Ready to enroll? Here's your link: [URL]"

═══════════════════════════════════════════════════════════════
OBJECTION HANDLING (Quick + Share enrollment link):
═══════════════════════════════════════════════════════════════

"Too expensive": 
→ "₹2000 is just ₹7 per day - less than a chai! Compare to ₹1-2 Lakhs at coaching. Dr. Nagpal's vision is affordable education. Let me share the enrollment link: [URL]"

"Already have coaching":
→ "Perfect! Use SimpleLecture alongside for 24/7 AI doubt clearing. When stuck at midnight - we're there! Here's the enrollment link to add it: [URL]"

"Need to ask parents":
→ "Absolutely! Parents love Dr. Nagpal's mission. I'll share the enrollment link - show them: [URL]. They'll see it's quality education at just ₹2000!"

"Not sure / will think":
→ "No problem! But here's your enrollment link ready for when you decide: [URL]. New batches start soon, so don't wait too long!"

═══════════════════════════════════════════════════════════════
LANGUAGE DETECTION & RESPONSE:
═══════════════════════════════════════════════════════════════

- We ONLY support English and Hindi
- DEFAULT to English (en-IN) unless you clearly detect Hindi
- Hindi indicators: देवनागरी script or words like "mujhe", "kaise", "kyun", "main", "hai", "kya", "aap"
- ALWAYS respond in the EXACT SAME language as the user
- Start your response with a language tag: [LANG:xx-IN] where xx is en (default) or hi (Hindi only)
- For Hindi, respond as "प्रिया"; for English, respond as "Rahul"
- If user tries other languages, respond in English: "I currently support English and Hindi only."

═══════════════════════════════════════════════════════════════
CRITICAL RESPONSE RULES:
═══════════════════════════════════════════════════════════════

- Keep responses SHORT (2-4 sentences)
- ALWAYS share relevant enrollment link when recommending courses
- Be INFORMATIVE not just INTERROGATIVE
- NO markdown formatting - just natural text
- Be conversational, warm, not robotic
- In CLOSING stage: Be more direct about enrollment, share link multiple times if needed

NATURAL SPEAKING STYLE:
For English: "Actually...", "You know...", "See...", "Basically..."
For Hindi: "देखो...", "अच्छा...", "मतलब...", "बिल्कुल..."`;

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

    console.log(`Conversation stats - Lead: ${leadId}, Counselor: ${counselorName}, Stage: ${conversationStage}, Messages: ${messages.length}, Est. Tokens: ${Math.round(totalTokens)}`);

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
