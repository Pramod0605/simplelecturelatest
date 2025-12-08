import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { contentJson, subjectId, chapterId, topicId, subtopicId, entityType, entityName } = await req.json();

    if (!contentJson || !subjectId || !chapterId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contentJson, subjectId, chapterId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch subject and chapter info for category binding
    const { data: subjectData } = await supabase
      .from("popular_subjects")
      .select("category_id, name")
      .eq("id", subjectId)
      .single();

    const categoryId = subjectData?.category_id;

    // Convert JSON content to string for LLM analysis
    const jsonString = typeof contentJson === "string" 
      ? contentJson 
      : JSON.stringify(contentJson, null, 2);

    console.log("Extracting MCQs from JSON for:", entityType, entityName);
    console.log("JSON content length:", jsonString.length);

    // Use LLM to extract MCQs and analyze difficulty
    const extractionPrompt = `You are an expert at extracting Multiple Choice Questions (MCQs) from educational content.

Analyze the following JSON content from a parsed PDF document and extract ALL multiple choice questions.

For each question, determine the difficulty level based on these criteria:
- "easy": Basic recall, simple definitions, direct facts
- "medium": Single-concept application, understanding relationships
- "hard": Multi-step reasoning, complex analysis, advanced concepts

Return ONLY a valid JSON array of questions. Each question must have:
{
  "question_text": "The complete question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "The correct option text (must match one of the options exactly)",
  "explanation": "Brief explanation of why this is correct",
  "difficulty": "easy" | "medium" | "hard",
  "marks": 1 or 2 or 4 (based on complexity)
}

If no MCQs are found, return an empty array: []

Content to analyze:
${jsonString.substring(0, 50000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert at extracting structured MCQ data from educational documents. Always respond with valid JSON only." },
          { role: "user", content: extractionPrompt }
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM API error:", response.status, errorText);
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const llmResponse = data.choices?.[0]?.message?.content || "[]";
    
    console.log("LLM response preview:", llmResponse.substring(0, 500));

    // Parse the LLM response
    let extractedQuestions: any[] = [];
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = llmResponse.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();
      
      extractedQuestions = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(extractedQuestions)) {
        extractedQuestions = [extractedQuestions];
      }
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      console.error("Raw response:", llmResponse);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse extracted questions", 
          questionsCount: 0,
          details: "LLM response was not valid JSON"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (extractedQuestions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          questionsCount: 0,
          message: "No MCQs found in the document" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${extractedQuestions.length} questions to insert`);

    // Insert questions into the database
    const questionsToInsert = extractedQuestions.map((q, index) => {
      // Normalize options to array format
      let options = q.options;
      if (!Array.isArray(options) && typeof options === "object") {
        options = Object.values(options);
      }

      return {
        question_text: q.question_text || q.question || "",
        question_type: "single_correct",
        question_format: "text",
        options: options || [],
        correct_answer: q.correct_answer || "",
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
        marks: q.marks || 1,
        topic_id: topicId || null,
        subtopic_id: subtopicId || null,
        category_id: categoryId || null,
        is_verified: false,
        is_ai_generated: true,
        llm_verified: false,
        verification_status: "pending",
      };
    });

    // Filter out questions with empty question_text
    const validQuestions = questionsToInsert.filter(q => q.question_text.trim().length > 0);

    if (validQuestions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          questionsCount: 0,
          message: "No valid questions found after parsing" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: insertedQuestions, error: insertError } = await supabase
      .from("questions")
      .insert(validQuestions)
      .select("id");

    if (insertError) {
      console.error("Failed to insert questions:", insertError);
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    console.log(`Successfully inserted ${insertedQuestions?.length || 0} questions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        questionsCount: insertedQuestions?.length || 0,
        message: `Extracted and added ${insertedQuestions?.length || 0} questions to question bank`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in extract-json-to-questions:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        questionsCount: 0 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
