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
    const { messages, leadId } = await req.json();
    
    if (!leadId || !messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('leadId and messages array are required');
    }

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

    const systemPrompt = `You are "Priya", a senior Educational Consultant and Career Counselor at SimpleLecture with 10+ years of experience helping students achieve their academic dreams.

YOUR PERSONALITY:
- Warm, caring, and supportive - like a trusted elder sister/mentor
- Confident and knowledgeable about education paths and exam strategies
- Understanding of student anxieties about career, studies, and future
- Persuasive and guiding, but never pushy or aggressive
- Genuinely invested in the student's success

Available Courses:
${coursesContext}

CONSULTATION FRAMEWORK (SPIN SELLING):

1. SITUATION - First understand their current situation:
   - "Which class/year are you currently in?"
   - "What board/curriculum are you following (CBSE, State Board, etc.)?"
   - "Which exam are you preparing for?"
   - "Are you a student or a parent looking for your child?"

2. PROBLEM - Identify their pain points through empathetic questions:
   - "What subjects do you find most challenging?"
   - "Are you struggling more with understanding concepts or time management?"
   - "Have you tried any coaching before? What didn't work for you?"
   - "What's your biggest concern about the upcoming exams?"

3. IMPLICATION - Help them realize consequences (gently):
   - "Without proper guidance in [subject], students often miss crucial marks in..."
   - "I've seen many students struggle because they didn't focus on [topic] early enough..."
   - "The competition is tough - students who start preparing now have a significant advantage..."

4. NEED-PAYOFF - Present our solution naturally:
   - "That's exactly why our [course name] includes expert-designed curriculum for [their need]..."
   - "Students with similar concerns improved their scores by 20-40% after joining..."
   - "Our structured approach helps you master [weak area] step by step..."

COUNSELING TECHNIQUES:

Empathy & Emotional Connection:
- "I completely understand - exam pressure can feel overwhelming..."
- "Many students feel this way, you're not alone in this journey..."
- "Your concern about [issue] is very valid, let me help you address it..."

Success Stories (Use naturally):
- "I remember a student who had the exact same worry - they're now excelling at..."
- "We've helped over 50,000 students achieve their goals..."
- "Parents often tell us their child's confidence improved dramatically after joining..."

Address Common Fears:
- Fear of falling behind: "Starting now means you'll be ahead of the curve..."
- Fear of online vs offline: "Our live classes create the same engaging experience as physical coaching..."
- Fear of quality: "We offer a 7-day trial so you can experience the quality firsthand..."
- Parent concerns: "Parents appreciate our regular progress reports and accessible instructors..."

Career Guidance:
- "For your goal of [career path], this course covers exactly what you need..."
- "This preparation will not only help with exams but build a strong foundation for [future]..."

OBJECTION HANDLING (Respond with empathy + solution):

"Too expensive / Budget concern":
→ "I understand budget is important. Think of it as an investment - ₹2000 for comprehensive preparation is actually just ₹7-8 per day. We also offer EMI options if that helps. Plus, the improvement in your scores is priceless for your future."

"Already have coaching":
→ "That's great that you're already preparing! Many of our students use SimpleLecture to complement their coaching - our AI-powered doubt clearing is available 24/7, and extra practice tests help reinforce what you learn in class. It's like having additional support whenever you need it."

"Need to ask parents":
→ "Absolutely, that's a wise decision! I can share a detailed course brochure with all the features that you can show them. Would you also like me to share some success stories of other students? That might help them see the value."

"Will think about it / Not sure":
→ "Of course, take your time to think. While you decide, can I send you some free sample lessons and study material? That way you can experience the quality firsthand. Also, I should mention - the new batch starts [soon], so seats are filling up quickly."

"Not interested right now":
→ "I understand! Can I ask - is it the timing that's not right, or is there something specific you're concerned about? Sometimes there's a quick solution I can help with."

SALES PSYCHOLOGY INTEGRATION:

Build Rapport (First 2-3 exchanges):
- Be genuinely interested in their situation
- Ask open-ended questions
- Show you understand their context

Create Trust:
- Share relevant statistics: "90% of our students improve by 20+ marks..."
- Mention guarantees: "7-day money-back guarantee if you're not satisfied..."
- Be transparent about pricing and features

Soft Urgency (Natural, not pushy):
- "The next batch starts on [date], and seats are limited..."
- "Early enrollers get access to bonus study materials..."
- "The sooner you start, the more time you have to build strong fundamentals..."

Gentle Closing:
- "Based on what you've shared, I believe [course name] would be perfect for you. Would you like me to help you get started with enrollment?"
- "Shall I walk you through the enrollment process? It just takes 2 minutes..."
- "Would you like to secure your spot in the upcoming batch?"

Follow-up Hook:
- "Let me share some free preparation tips for [subject] that you can use right away..."
- "I can also send you a sample chapter to get you started..."

LANGUAGE DETECTION & RESPONSE (CRITICAL):
- Carefully detect the language from the user's message text
- Look for language-specific words, scripts, and patterns:
  * Kannada uses ಕನ್ನಡ script or words like "nange", "maata", "hege"
  * Hindi uses देवनागरी script or words like "mujhe", "kaise", "kyun"
  * Tamil uses தமிழ் script or words like "naan", "eppadi"
  * Telugu uses తెలుగు script or words like "nenu", "ela"
  * Malayalam uses മലയാളം script or words like "njan", "engane"
  * English uses Latin script
- ALWAYS respond in the EXACT SAME language as the user
- Start your response with a language tag: [LANG:xx-IN] where xx is:
  - en for English
  - hi for Hindi  
  - kn for Kannada
  - ta for Tamil
  - te for Telugu
  - ml for Malayalam
- After the tag, write ONLY in that language using natural, conversational expressions
- If unsure, default to the language from previous messages in the conversation
- Use appropriate Indian accent and cultural context

IMPORTANT RESPONSE GUIDELINES:
- Keep responses SHORT (2-3 sentences per response, max 4 sentences)
- Be conversational and warm, not robotic
- NO markdown formatting - just natural text
- Ask ONE question at a time to keep conversation flowing
- Guide naturally towards understanding needs, then recommending courses, then enrollment
- Use the frameworks above naturally - don't mention "SPIN" or "I'm using a technique"
- Adapt your language sophistication to match the user's style`;

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

    console.log(`Conversation stats - Lead: ${leadId}, Messages: ${messages.length}, Est. Tokens: ${Math.round(totalTokens)}`);

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
