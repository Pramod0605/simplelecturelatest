import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { contentJson, examName, year, paperType } = await req.json();

    if (!contentJson) {
      return new Response(
        JSON.stringify({ error: "Missing required field: contentJson" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Convert JSON content to string for LLM analysis
    const jsonString = typeof contentJson === "string" 
      ? contentJson 
      : JSON.stringify(contentJson, null, 2);

    console.log("Extracting MCQs from parsed PDF for preview");
    console.log("Exam:", examName, "Year:", year, "Type:", paperType);
    console.log("Content length:", jsonString.length);

    // Use LLM to extract MCQs with correct answers
    const extractionPrompt = `You are an expert at extracting Multiple Choice Questions (MCQs) from previous year exam papers.

Analyze the following parsed PDF content and extract ALL multiple choice questions with their correct answers.

IMPORTANT GUIDELINES:
1. Extract EVERY question you can find
2. For each question, identify the correct answer from the answer key or solution section
3. If options are labeled (A), (B), (C), (D) or 1, 2, 3, 4 - normalize to A, B, C, D
4. Look for answer keys at the end of the document
5. Determine difficulty based on:
   - "easy": Basic recall, direct application of formulas
   - "medium": Single-concept application, moderate calculation
   - "hard": Multi-step reasoning, complex analysis, advanced concepts

Return ONLY a valid JSON array. Each question must have this exact format:
{
  "question_number": 1,
  "question_text": "The complete question text including any given data",
  "options": {
    "A": { "text": "First option text" },
    "B": { "text": "Second option text" },
    "C": { "text": "Third option text" },
    "D": { "text": "Fourth option text" }
  },
  "correct_answer": "A",
  "explanation": "Brief explanation if available, otherwise empty string",
  "difficulty": "easy" | "medium" | "hard",
  "marks": 4
}

If no MCQs are found, return: []

EXAM CONTEXT: ${examName} ${year} ${paperType || ""}

Content to analyze:
${jsonString.substring(0, 80000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "You are an expert at extracting structured MCQ data from previous year exam papers. You excel at finding answer keys and matching them to questions. Always respond with valid JSON only, no markdown formatting." 
          },
          { role: "user", content: extractionPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted, please add credits" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      console.error("Raw response:", llmResponse.substring(0, 1000));
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Failed to parse AI response", 
          questions: [],
          questionsCount: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize and validate questions
    const normalizedQuestions = extractedQuestions.map((q, index) => {
      // Normalize options format
      let options: Record<string, { text: string }> = {};
      
      if (Array.isArray(q.options)) {
        // Convert array to object format
        const keys = ["A", "B", "C", "D"];
        q.options.forEach((opt: any, i: number) => {
          if (i < 4) {
            options[keys[i]] = { text: typeof opt === "string" ? opt : opt.text || String(opt) };
          }
        });
      } else if (typeof q.options === "object") {
        // Already object format, ensure correct structure
        Object.entries(q.options).forEach(([key, val]: [string, any]) => {
          const normalizedKey = key.toUpperCase().replace(/[()]/g, "").trim();
          if (["A", "B", "C", "D"].includes(normalizedKey)) {
            options[normalizedKey] = { 
              text: typeof val === "string" ? val : val?.text || String(val) 
            };
          }
        });
      }

      // Normalize correct answer
      let correctAnswer = q.correct_answer || "";
      if (correctAnswer) {
        correctAnswer = String(correctAnswer).toUpperCase().replace(/[()]/g, "").trim();
        // Handle numeric answers (1,2,3,4 -> A,B,C,D)
        const numMap: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
        if (numMap[correctAnswer]) {
          correctAnswer = numMap[correctAnswer];
        }
      }

      return {
        question_number: q.question_number || index + 1,
        question_text: q.question_text || q.question || "",
        options,
        correct_answer: correctAnswer,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
        marks: q.marks || 4,
      };
    }).filter(q => q.question_text.trim().length > 0);

    console.log(`Successfully extracted ${normalizedQuestions.length} questions for preview`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        questions: normalizedQuestions,
        questionsCount: normalizedQuestions.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in extract-questions-preview:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        questions: [],
        questionsCount: 0 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
