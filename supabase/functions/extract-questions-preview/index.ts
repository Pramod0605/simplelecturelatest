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

// Extract answer key from the last portion of the document
function extractAnswerKey(text: string): Map<number, string> {
  const answerMap = new Map<number, string>();
  
  // Look for answer key in the last 30K characters (usually last pages)
  const lastSection = text.slice(-30000);
  
  console.log("Searching for answer key in last 30K chars...");
  
  // Common answer key patterns in JEE/NEET papers
  const patterns = [
    // "1. (A)", "1.(A)", "1 (A)", "1(A)"
    /(\d+)\s*[\.\)]*\s*\(([A-Da-d])\)/g,
    // "1. A", "1.A", "1-A", "1 - A"
    /(\d+)\s*[\.\-\)]\s*([A-Da-d])(?:\s|$|,|\.|;)/g,
    // "Q1: A", "Q.1: A", "Q1 - A"
    /Q\.?\s*(\d+)\s*[\:\-\.\)]\s*\(?([A-Da-d])\)?/gi,
    // "Answer 1: A" or "Ans 1: A"
    /(?:Ans(?:wer)?)\s*[\.\:\-]?\s*(\d+)\s*[\:\-\.\)]\s*\(?([A-Da-d])\)?/gi,
    // Table format: "1 A", "2 B" (simple space separation)
    /(?:^|\n|\s)(\d+)\s+([A-Da-d])(?:\s|\n|$)/g,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(lastSection)) !== null) {
      const qNum = parseInt(match[1]);
      const answer = match[2].toUpperCase();
      if (qNum > 0 && qNum <= 200 && ['A', 'B', 'C', 'D'].includes(answer)) {
        // Only set if not already set (first match wins)
        if (!answerMap.has(qNum)) {
          answerMap.set(qNum, answer);
        }
      }
    }
  }
  
  console.log(`Found ${answerMap.size} answers in answer key`);
  if (answerMap.size > 0) {
    const sample = Array.from(answerMap.entries()).slice(0, 5);
    console.log("Sample answers:", sample);
  }
  
  return answerMap;
}

// Split text into chunks for processing
function chunkText(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Try to break at a question boundary if possible
    if (end < text.length) {
      // Look for question number pattern to break at
      const searchRegion = text.slice(end - 500, end + 500);
      const qMatch = searchRegion.match(/\n\s*(?:Q\.?\s*)?(\d+)\s*[\.\)]/);
      if (qMatch && qMatch.index !== undefined) {
        end = end - 500 + qMatch.index;
      }
    }
    
    chunks.push(text.slice(start, Math.min(end, text.length)));
    start = end;
  }
  
  console.log(`Split text into ${chunks.length} chunks`);
  return chunks;
}

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
    console.log("Full extraction text length:", extractionText.length);

    // Step 1: Extract answer key from the end of the document FIRST
    const answerKey = extractAnswerKey(extractionText);
    console.log(`Answer key extracted: ${answerKey.size} answers found`);

    // Step 2: Split into chunks if needed (120K per chunk max)
    const MAX_CHUNK_SIZE = 120000;
    const chunks = chunkText(extractionText, MAX_CHUNK_SIZE);
    
    // Updated system prompt - tell AI NOT to guess answers since we have the answer key
    const systemPrompt = `You are an expert at parsing educational questions from JEE/NEET examination papers.

**Your Task:**
Extract each question as a separate object with:
- question_number: The question number (1, 2, 3, etc.)
- question_text: Full question with LaTeX formulas preserved (e.g., \\( x^2 + 5x + 6 = 0 \\))
- options: { "A": "...", "B": "...", "C": "...", "D": "..." } for MCQs
- correct_answer: Leave as empty string "" - we will fill this from the answer key
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

**IMPORTANT:**
- Do NOT try to determine correct answers - leave correct_answer as ""
- Focus only on extracting question text and options accurately
- Extract ALL questions you can find, even if there are many

**Output Format:**
Return a valid JSON object with this structure:
{
  "questions": [
    {
      "question_number": 1,
      "question_text": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "",
      "explanation": "",
      "difficulty": "medium",
      "marks": 4
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No markdown code blocks, no explanations, just the JSON object.`;

    let allQuestions: ExtractedQuestion[] = [];
    const errors: string[] = [];
    let chunksProcessed = 0;

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}, length: ${chunk.length}`);

      const userPrompt = `EXAM: ${examName} ${year} ${paperType || ""}
${chunks.length > 1 ? `(Part ${i + 1} of ${chunks.length})` : ""}

Extract ALL multiple-choice questions from this document:

${chunk}`;

      try {
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
            temperature: 0.2, // Lower temperature for more consistent extraction
          }),
        });

        const responseText = await response.text();
        console.log(`Chunk ${i + 1} - Gateway response status:`, response.status);

        if (!response.ok) {
          const status = response.status;
          console.error(`Chunk ${i + 1} - AI gateway error:`, status, responseText.slice(0, 500));
          
          if (status === 429 || status === 402) {
            // For rate limit or credits issues, return immediately
            const res: ExtractResponse = {
              success: false,
              questions: allQuestions,
              questionsCount: allQuestions.length,
              partial: allQuestions.length > 0,
              error: status === 429 ? "Rate limit exceeded, please try again later" : "API credits exhausted, please add credits",
              errorCode: status === 429 ? "RATE_LIMIT" : "CREDITS_EXHAUSTED",
              chunksProcessed,
            };
            return new Response(JSON.stringify(res), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          errors.push(`Chunk ${i + 1}: Gateway error ${status}`);
          continue;
        }

        const data = JSON.parse(responseText);
        const llmResponse = data?.choices?.[0]?.message?.content;

        if (!llmResponse) {
          console.error(`Chunk ${i + 1} - No content in AI response`);
          errors.push(`Chunk ${i + 1}: Empty response`);
          continue;
        }

        console.log(`Chunk ${i + 1} - LLM response length:`, llmResponse.length);

        // Parse JSON response
        let extractedData: any;
        try {
          let jsonText = llmResponse.trim();
          if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          }
          extractedData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error(`Chunk ${i + 1} - Failed to parse JSON:`, parseError);
          errors.push(`Chunk ${i + 1}: JSON parse error`);
          continue;
        }

        const rawQuestions = extractedData?.questions || [];
        if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
          const normalized = normalizeQuestions(rawQuestions);
          console.log(`Chunk ${i + 1} - Extracted ${normalized.length} questions`);
          allQuestions.push(...normalized);
        }
        
        chunksProcessed++;
      } catch (chunkError) {
        console.error(`Chunk ${i + 1} - Error:`, chunkError);
        errors.push(`Chunk ${i + 1}: ${chunkError instanceof Error ? chunkError.message : "Unknown error"}`);
      }
    }

    // Step 3: Apply answer key to all extracted questions
    console.log(`Applying answer key to ${allQuestions.length} questions...`);
    let answersApplied = 0;
    for (const q of allQuestions) {
      if (answerKey.has(q.question_number)) {
        q.correct_answer = answerKey.get(q.question_number)!;
        answersApplied++;
      }
    }
    console.log(`Applied ${answersApplied} answers from answer key`);

    // Dedupe again after merging chunks
    const deduped = new Map<number, ExtractedQuestion>();
    for (const q of allQuestions) {
      if (!deduped.has(q.question_number)) {
        deduped.set(q.question_number, q);
      }
    }
    const finalQuestions = Array.from(deduped.values()).sort((a, b) => a.question_number - b.question_number);

    console.log(`Final: ${finalQuestions.length} unique questions extracted`);

    const res: ExtractResponse = {
      success: finalQuestions.length > 0,
      questions: finalQuestions,
      questionsCount: finalQuestions.length,
      partial: errors.length > 0 && finalQuestions.length > 0,
      error: finalQuestions.length === 0 ? "No MCQs could be extracted from this PDF." : undefined,
      errorCode: finalQuestions.length === 0 ? "NO_QUESTIONS" : undefined,
      errors: errors.length > 0 ? errors : undefined,
      chunksProcessed,
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
