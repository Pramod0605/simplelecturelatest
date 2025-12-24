import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ExtractedOption = { text: string };

type ExtractedQuestion = {
  question_number: number;
  question_text: string;
  options: Record<string, ExtractedOption>;
  correct_answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
};

type ExtractResponse = {
  success: boolean;
  questions: ExtractedQuestion[];
  questionsCount: number;
  partial?: boolean;
  error?: string;
  errorCode?: string;
  errors?: string[];
  chunksProcessed?: number;
};

function normalizeQuestions(raw: any[]): ExtractedQuestion[] {
  const normalized = raw
    .map((q, index) => {
      let options: Record<string, ExtractedOption> = {};

      if (q.options && typeof q.options === "object" && !Array.isArray(q.options)) {
        // Handle { "A": "...", "B": "...", ... } format
        Object.entries(q.options).forEach(([key, val]: [string, any]) => {
          const normalizedKey = key.toUpperCase().replace(/[()]/g, "").trim();
          if (["A", "B", "C", "D"].includes(normalizedKey)) {
            options[normalizedKey] = {
              text: typeof val === "string" ? val : val?.text || String(val),
            };
          }
        });
      } else if (Array.isArray(q.options)) {
        const keys = ["A", "B", "C", "D"];
        q.options.forEach((opt: any, i: number) => {
          if (i < 4) {
            options[keys[i]] = {
              text: typeof opt === "string" ? opt : opt?.text || String(opt),
            };
          }
        });
      }

      let correctAnswer = q.correct_answer || q.answer || "";
      if (correctAnswer) {
        correctAnswer = String(correctAnswer).toUpperCase().replace(/[()]/g, "").trim();
        const numMap: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
        if (numMap[correctAnswer]) correctAnswer = numMap[correctAnswer];
      }

      // Map difficulty from Document Tab format to Previous Year format
      let difficulty: "easy" | "medium" | "hard" = "medium";
      const rawDifficulty = String(q.difficulty || "").toLowerCase();
      if (rawDifficulty === "low" || rawDifficulty === "easy") {
        difficulty = "easy";
      } else if (rawDifficulty === "advanced" || rawDifficulty === "hard") {
        difficulty = "hard";
      }

      return {
        question_number: Number(q.question_number ?? index + 1),
        question_text: String(q.question_text ?? q.question ?? ""),
        options,
        correct_answer: correctAnswer,
        explanation: String(q.explanation ?? ""),
        difficulty,
        marks: Number(q.marks ?? 4),
      } satisfies ExtractedQuestion;
    })
    .filter((q) => q.question_text.trim().length > 0);

  // Dedupe by question number
  const map = new Map<number, ExtractedQuestion>();
  for (const q of normalized) {
    if (!map.has(q.question_number)) map.set(q.question_number, q);
  }

  return Array.from(map.values()).sort((a, b) => a.question_number - b.question_number);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentJson, contentMarkdown, examName, year, paperType } = await req.json();

    // Prefer markdown (clean text) over JSON
    let extractionText = "";
    
    if (contentMarkdown && typeof contentMarkdown === "string" && contentMarkdown.trim().length > 100) {
      extractionText = contentMarkdown.trim();
      console.log("Using contentMarkdown directly, length:", extractionText.length);
    } else if (contentJson) {
      // Try to get markdown from Datalab JSON structure
      const parsed = typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
      if (parsed?.markdown && typeof parsed.markdown === "string") {
        extractionText = parsed.markdown.trim();
        console.log("Extracted markdown from contentJson.markdown, length:", extractionText.length);
      } else {
        // Fallback: stringify the JSON for LLM
        extractionText = JSON.stringify(parsed, null, 2);
        console.log("Using stringified contentJson, length:", extractionText.length);
      }
    }

    if (!extractionText || extractionText.length < 100) {
      const res: ExtractResponse = {
        success: false,
        questions: [],
        questionsCount: 0,
        error: "No content provided or content too short",
        errorCode: "BAD_REQUEST",
      };
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("=== Starting MCQ Extraction ===");
    console.log("Exam:", examName, "Year:", year, "Type:", paperType);
    console.log("Extraction text length:", extractionText.length);

    // Use the proven system prompt from process-llm-extraction (Document Tab)
    const systemPrompt = `You are an expert at parsing educational questions from JEE/NEET examination papers.

**Your Task:**
Extract each question as a separate object with:
- question_number: The question number (1, 2, 3, etc.)
- question_text: Full question with LaTeX formulas preserved (e.g., \\( x^2 + 5x + 6 = 0 \\))
- options: { "A": "...", "B": "...", "C": "...", "D": "..." } for MCQs
- correct_answer: The correct option letter (A, B, C, or D). If answer key is at the end of document, use it.
- explanation: Solution/explanation if present (use empty string if not available)
- difficulty: "easy", "medium", or "hard" based on complexity
- marks: Usually 4 for JEE/NEET questions

**Question Boundary Detection:**
- Look for question numbers: "Q1", "Q2", "1.", "2.", "(1)", "(2)", etc.
- Each MCQ typically has 4 options (A, B, C, D or 1, 2, 3, 4)
- Questions may span multiple lines
- Options may contain LaTeX formulas

**LaTeX Preservation:**
- Keep all LaTeX exactly as written: \\( ... \\) for inline, \\[ ... \\] for display
- Common symbols: \\sqrt{}, \\frac{}{}, \\int, \\sum, \\alpha, \\beta, etc.

**Answer Key Detection:**
- Look for answer key section at the end of the document
- Common formats: "1. (A)", "1-A", "Answers: 1.A, 2.B, ..."
- Match answers to question numbers

**Output Format:**
Return a valid JSON object with this structure:
{
  "questions": [
    {
      "question_number": 1,
      "question_text": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "A",
      "explanation": "",
      "difficulty": "medium",
      "marks": 4
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No markdown code blocks, no explanations, just the JSON object.`;

    const userPrompt = `EXAM: ${examName} ${year} ${paperType || ""}

Extract ALL multiple-choice questions from this document:

${extractionText.slice(0, 150000)}`;

    console.log("Calling Gemini with prompt length:", userPrompt.length);

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // More deterministic output (same as Document Tab)
      }),
    });

    const responseText = await response.text();
    console.log("Gateway response status:", response.status);
    console.log("Gateway response preview:", responseText.slice(0, 500));

    if (!response.ok) {
      const status = response.status;
      console.error("AI gateway error:", status, responseText.slice(0, 500));

      const res: ExtractResponse = {
        success: false,
        questions: [],
        questionsCount: 0,
        error:
          status === 429
            ? "Rate limit exceeded, please try again later"
            : status === 402
              ? "API credits exhausted, please add credits"
              : "AI gateway error",
        errorCode:
          status === 429
            ? "RATE_LIMIT"
            : status === 402
              ? "CREDITS_EXHAUSTED"
              : "AI_GATEWAY_ERROR",
      };

      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(responseText);
    const llmResponse = data?.choices?.[0]?.message?.content;

    if (!llmResponse) {
      console.error("No content in AI response");
      const res: ExtractResponse = {
        success: false,
        questions: [],
        questionsCount: 0,
        error: "No response from AI",
        errorCode: "EMPTY_RESPONSE",
      };
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("LLM response length:", llmResponse.length);
    console.log("LLM response preview:", llmResponse.slice(0, 300));

    // Parse JSON response (handle markdown code blocks if present)
    let extractedData: any;
    try {
      let jsonText = llmResponse.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Response was:", llmResponse.slice(0, 1000));

      const res: ExtractResponse = {
        success: false,
        questions: [],
        questionsCount: 0,
        error: "Failed to parse AI response as JSON",
        errorCode: "PARSE_ERROR",
      };
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawQuestions = extractedData?.questions || [];

    if (!Array.isArray(rawQuestions)) {
      console.error("Invalid response format: questions is not an array");
      const res: ExtractResponse = {
        success: false,
        questions: [],
        questionsCount: 0,
        error: "Invalid response format from AI",
        errorCode: "INVALID_FORMAT",
      };
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = normalizeQuestions(rawQuestions);

    console.log(`Extracted ${normalized.length} questions`);

    const res: ExtractResponse = {
      success: normalized.length > 0,
      questions: normalized,
      questionsCount: normalized.length,
      error: normalized.length === 0 ? "No MCQs could be extracted from this PDF." : undefined,
      errorCode: normalized.length === 0 ? "NO_QUESTIONS" : undefined,
    };

    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-questions-preview:", error);
    const res: ExtractResponse = {
      success: false,
      questions: [],
      questionsCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      errorCode: "SERVER_ERROR",
    };
    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
