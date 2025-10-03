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
    const { topic_id, difficulty, count = 5 } = await req.json();

    if (!topic_id) {
      return new Response(
        JSON.stringify({ error: "topic_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get topic content
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select(`
        *,
        chapter:chapters(
          title,
          description,
          subject
        )
      `)
      .eq("id", topic_id)
      .single();

    if (topicError || !topic) {
      throw new Error("Topic not found");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`Generating ${count} MCQs for topic:`, topic.title);

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
            content: `You are an expert exam question generator for SimpleLecture.
Generate high-quality Multiple Choice Questions (MCQs) based on the provided content.

Topic: ${topic.title}
Chapter: ${topic.chapter.title}
Subject: ${topic.chapter.subject}
Difficulty: ${difficulty || "medium"}

Generate ${count} MCQs following this exact JSON format:
{
  "questions": [
    {
      "question_text": "Clear, unambiguous question text",
      "options": [
        {"id": "A", "text": "Option A text"},
        {"id": "B", "text": "Option B text"},
        {"id": "C", "text": "Option C text"},
        {"id": "D", "text": "Option D text"}
      ],
      "correct_answer": "A",
      "explanation": "Detailed explanation of why the correct answer is right"
    }
  ]
}

Guidelines:
- Questions should test conceptual understanding, not just memorization
- All options should be plausible
- Avoid "all of the above" or "none of the above"
- Provide clear, educational explanations
- Match the specified difficulty level`
          },
          {
            role: "user",
            content: `Content:\n${topic.content_markdown || topic.chapter.description || "Generate questions based on the topic and chapter context."}`
          }
        ],
        temperature: 0.8,
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
    const content = aiData.choices[0].message.content;

    // Parse JSON response
    let mcqData;
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      mcqData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse MCQ data from AI response");
    }

    // Insert questions into database
    const questionsToInsert = mcqData.questions.map((q: any) => ({
      topic_id,
      question_text: q.question_text,
      question_type: "mcq",
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: difficulty || "medium",
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from("questions")
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting questions:", insertError);
      throw insertError;
    }

    console.log(`Successfully generated and saved ${insertedQuestions.length} MCQs`);

    return new Response(
      JSON.stringify({ 
        questions: insertedQuestions,
        message: `Successfully generated ${insertedQuestions.length} MCQs`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-generate-mcqs:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
