import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, topic_id, student_id } = await req.json();

    if (!question || !topic_id || !student_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get topic context
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select(`
        *,
        chapter:chapters(
          title,
          description,
          course:courses(name)
        )
      `)
      .eq("id", topic_id)
      .single();

    if (topicError || !topic) {
      throw new Error("Topic not found");
    }

    // Prepare context for RAG
    const context = `
Topic: ${topic.title}
Chapter: ${topic.chapter.title}
Course: ${topic.chapter.course.name}
Content: ${topic.content_markdown || "No detailed content available"}
Description: ${topic.chapter.description || ""}
`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Calling AI with question:", question);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert AI tutor for SimpleLecture. Help students understand concepts clearly.
Use the following context to answer questions accurately:

${context}

Guidelines:
- Provide clear, step-by-step explanations
- Use simple language appropriate for students
- Include examples when helpful
- Reference the course material context
- Be encouraging and patient
- If the question is outside the topic scope, politely guide them back`
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    // Log the interaction
    await supabase.from("doubt_logs").insert({
      student_id,
      topic_id,
      question,
      answer,
      context_used: context.substring(0, 500), // Store truncated context
      model_used: "google/gemini-2.5-flash",
      response_time_ms: Date.now(),
    });

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-doubt-clear:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
