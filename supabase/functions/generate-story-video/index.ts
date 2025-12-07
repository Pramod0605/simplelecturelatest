import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyText, prompt } = await req.json();

    if (!storyText && !prompt) {
      return new Response(
        JSON.stringify({ error: "Story text or prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const KIE_AI_API_KEY = Deno.env.get("KIE_AI_API_KEY");
    if (!KIE_AI_API_KEY) {
      console.log("KIE_AI_API_KEY not configured, returning placeholder");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Video generation not configured",
          videoUrl: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a visual prompt from the story
    const videoPrompt = prompt || `Educational animation: ${storyText.substring(0, 200)}. Simple, clear visuals with smooth animation. Suitable for educational content.`;

    console.log("Generating video with WAN 2.2:", videoPrompt.substring(0, 100));

    // Call KIE.AI WAN 2.2 API
    const response = await fetch("https://api.kie.ai/v1/video/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KIE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: videoPrompt,
        resolution: "480p",
        aspect_ratio: "16:9",
        enable_prompt_expansion: true,
        duration: 8, // 8-10 seconds
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("KIE.AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Video generation failed: ${response.status}`,
          videoUrl: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("Video generation result:", result);

    // KIE.AI returns task_id for async processing
    if (result.task_id) {
      // Poll for completion (simplified - in production use webhooks)
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`https://api.kie.ai/v1/video/status/${result.task_id}`, {
          headers: {
            "Authorization": `Bearer ${KIE_AI_API_KEY}`,
          },
        });
        
        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          if (statusResult.status === "completed" && statusResult.video_url) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                videoUrl: statusResult.video_url 
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else if (statusResult.status === "failed") {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "Video generation failed",
                videoUrl: null 
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        attempts++;
      }
      
      // Timeout - return task_id for later checking
      return new Response(
        JSON.stringify({ 
          success: false, 
          taskId: result.task_id,
          error: "Video generation in progress",
          videoUrl: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Direct response with video URL
    return new Response(
      JSON.stringify({ 
        success: true, 
        videoUrl: result.video_url || result.url || null 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-story-video:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        videoUrl: null 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
