import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseName, shortDescription, detailedDescription, subjects } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from course and subject information
    const subjectsContext = subjects?.map((s: any) => 
      `${s.name}: ${s.description || "No description"}`
    ).join("\n") || "No subjects provided";

    const systemPrompt = `You are an educational course FAQ generator. Generate 5-8 frequently asked questions with comprehensive answers for educational courses. Focus on:
- Course content and curriculum
- Prerequisites and target audience
- Learning outcomes and benefits
- Study materials and resources
- Assessment and certification
- Support and guidance available

Make answers detailed, helpful, and student-focused.`;

    const userPrompt = `Generate FAQs for this course:

Course Name: ${courseName}
Short Description: ${shortDescription || "Not provided"}
Detailed Description: ${detailedDescription || "Not provided"}

Subjects Covered:
${subjectsContext}

Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "question": "Question text here",
    "answer": "Detailed answer here"
  }
]`;

    console.log("Generating FAQs for course:", courseName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    // Parse the JSON response
    let faqs;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      faqs = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse FAQs JSON:", content);
      throw new Error("Failed to parse generated FAQs");
    }

    if (!Array.isArray(faqs)) {
      throw new Error("Generated content is not an array");
    }

    console.log(`Generated ${faqs.length} FAQs successfully`);

    return new Response(JSON.stringify({ faqs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in ai-generate-faqs:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate FAQs" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});