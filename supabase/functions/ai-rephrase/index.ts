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
    const { text, type } = await req.json();

    if (!text || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text and type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AI settings to determine which model to use
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: settings } = await supabaseClient
      .from("ai_settings")
      .select("setting_value")
      .eq("setting_key", "ai_model")
      .single();

    const model = settings?.setting_value?.model || "google/gemini-2.5-flash";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create appropriate system prompt based on type
    const systemPrompts: Record<string, string> = {
      chapter: "You are an expert educational content writer. Rephrase the given chapter title to make it more clear, engaging, and academically appropriate. Keep it concise (under 100 characters). Return only the rephrased text, nothing else.",
      topic: "You are an expert educational content writer. Rephrase the given topic title to make it more clear, engaging, and academically appropriate. Keep it concise (under 100 characters). Return only the rephrased text, nothing else.",
      question: "You are an expert in educational assessment. Rephrase the given question to make it clearer, more precise, and better formatted. Maintain the same difficulty level and intent. Return only the rephrased question, nothing else.",
      answer: "You are an expert in educational content. Rephrase the given answer to make it more clear and concise while maintaining accuracy. Return only the rephrased answer, nothing else.",
      explanation: "You are an expert educator. Rephrase the given explanation to make it clearer and more helpful for students. Keep it informative but accessible. Return only the rephrased explanation, nothing else.",
    };

    const systemPrompt = systemPrompts[type] || systemPrompts.question;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const rephrased = data.choices?.[0]?.message?.content?.trim();

    if (!rephrased) {
      throw new Error("No response from AI");
    }

    return new Response(
      JSON.stringify({ 
        original: text,
        rephrased,
        type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-rephrase function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
