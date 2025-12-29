import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const SYSTEM_PROMPT = `You are an AI Support Assistant for SimpleLecture LMS platform.

Your role:
- Help users with technical, account, payment, and platform-related issues.
- You must NOT answer academic, course subject, exam, or assignment questions.

Rules:
1. If a query is academic or course-related (like asking about a subject topic, exam answers, assignment solutions), politely redirect the user to the Forum: "This looks like a course-related question. Please use the Forum section for academic discussions where teachers and peers can help you better."
2. Provide clear, step-by-step solutions for support issues.
3. Ask the user if the issue is resolved at the end of your response.
4. If you are unsure or lack information, say so and indicate you'll escalate the ticket: "I'm not entirely sure about this. Let me escalate this to our support team for a more accurate response."
5. Do not guess or provide incorrect information.
6. Maintain a professional, polite, and concise tone.
7. Never claim to be human or replace admin authority.
8. Keep responses focused and actionable - don't be overly verbose.

You can help with:
- Login issues (password reset, access problems)
- Payment status (failed, pending, invoice)
- Course access issues
- App usage help
- Certificates, progress tracking
- General LMS navigation
- Technical issues (video not playing, app not loading)
- Account settings

Escalation Conditions:
- User indicates dissatisfaction
- You are unsure about the resolution
- Issue involves account security, payments, or system errors
- Complex issues requiring admin intervention

Response Format:
- Short explanation of the issue
- Clear action steps (numbered if multiple steps)
- Confirmation question

Example Ending:
"Please let me know if this resolves your issue. If not, I'll escalate this to our support team for further assistance."`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, ticketId, userId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[AI Support] Processing request for ticket: ${ticketId}, messages: ${messages.length}`);

    // Create Supabase client for database operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Build conversation history for the AI
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("[AI Support] Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("[AI Support] Payment required");
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[AI Support] AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    console.log("[AI Support] Streaming response started");

    // Return the stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("[AI Support] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
