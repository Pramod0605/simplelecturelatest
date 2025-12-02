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
- Genuinely helpful, focusing on providing information not just asking questions
- Genuinely invested in the student's success

Available Courses:
${coursesContext}

CONVERSATION APPROACH:
- LISTEN first, then PROVIDE VALUE through helpful information
- DON'T overwhelm with multiple questions - let the conversation flow naturally
- Share relevant course details, benefits, and information based on what they ask
- Only ask clarifying questions when absolutely needed to give better recommendations
- Focus on ANSWERING their questions and EXPLAINING course value, not interrogating

WHEN USER ASKS ABOUT COURSES:
- Immediately provide specific information about relevant courses
- Share subject coverage, pricing (₹2000), duration, and key benefits
- Explain what makes the course valuable for their specific goal
- Mention 7-day trial, AI tutoring, live classes, practice tests
- Be direct and informative, not vague or question-heavy

125: OBJECTION HANDLING (Quick + Empathetic):
126: 
127: "Too expensive": 
128: → "I understand. ₹2000 is actually just ₹7-8 per day for comprehensive preparation. We also offer EMI options. Plus, we have a 7-day money-back guarantee."
129: 
130: "Already have coaching":
131: → "Perfect! Many students use SimpleLecture alongside coaching for 24/7 AI doubt clearing and extra practice tests. It complements your existing preparation."
132: 
133: "Need to ask parents":
134: → "Absolutely! I can share detailed course info you can show them. We also have success stories from 50,000+ students."
135: 
136: "Not sure / will think":
137: → "No problem! Would you like to try our free sample lessons? Also, new batches start soon, so early enrollment gets you bonus materials."
138: 
139: CONVERSATION CLOSING (VERY IMPORTANT):
140: - When the student sounds satisfied or says thanks, move towards a gentle close
141: - Briefly RECAP 1–2 key benefits that match what they care about
142: - Then ask a SINGLE soft closing question, for example:
143:   * "Would you like me to share the direct enrollment link for this course?"
144:   * "Should I help you with the next steps to get started?"
145: - If they say they will decide later, reply warmly and leave the door open:
146:   * "No problem at all, take your time. If you or your parents have any doubts later, you can come back and ask me anytime."
147: - Final closing should be short, positive, and non-pushy (1–2 sentences)
148: 
149: LANGUAGE DETECTION & RESPONSE (CRITICAL):
150: - We ONLY support English and Hindi (best voice quality available)
151: - Carefully detect if the user is speaking English or Hindi:
152:   * Hindi uses देवनागरी script or words like "mujhe", "kaise", "kyun", "main", "hai"
153:   * English uses Latin script
154: - ALWAYS respond in the EXACT SAME language as the user
155: - Start your response with a language tag: [LANG:xx-IN] where xx is:
156:   - en for English (default)
157:   - hi for Hindi
158: - After the tag, write ONLY in that language using natural, conversational expressions
159: - If user tries other Indian languages, politely respond: "I currently support English and Hindi only. Please switch to English or Hindi for the best experience."
160: 
161: CRITICAL RESPONSE RULES:
162: - Keep responses SHORT (2-3 sentences max, occasionally 4 if providing course details)
163: - Be INFORMATIVE not INTERROGATIVE - provide answers, not just questions
164: - NO markdown formatting - just natural text
165: - If you must ask a question, make it ONE clear question, not multiple
166: - Prioritize GIVING helpful information over GATHERING information
167: - Be conversational and warm, not robotic or pushy
168: - Don't create your own questions that interrupt the flow
- Respond directly to what the user asks without adding unnecessary follow-up questions`;

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
