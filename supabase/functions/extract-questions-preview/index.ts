import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedOption {
  text: string;
  image_url?: string;
}

interface ExtractedQuestion {
  question_number: number;
  question_text: string;
  options: Record<string, ExtractedOption>;
  correct_answer: string;
  explanation: string;
  difficulty: string;
  marks: number;
}

interface ExtractResponse {
  success: boolean;
  questions: ExtractedQuestion[];
  questionsCount: number;
  partial?: boolean;
  error?: string;
  errorCode?: string;
  errors?: string[];
  chunksProcessed?: number;
  answerKeyStats?: {
    found: number;
    applied: number;
    missing: number[];
  };
}

/**
 * Extract answer key from the document text using robust token-based parsing.
 * Searches for answer key section or falls back to last portion of document.
 */
function extractAnswerKey(text: string): Map<number, string> {
  const answerMap = new Map<number, string>();
  
  // Look for answer key section headers
  const answerKeyHeaders = [
    /ANSWER\s*KEY/i,
    /ANSWERS?:/i,
    /SOLUTION\s*KEY/i,
    /KEY:/i,
    /उत्तर\s*कुंजी/i, // Hindi
  ];
  
  let searchText = text;
  let answerKeyStart = -1;
  
  // Try to find answer key section
  for (const header of answerKeyHeaders) {
    const match = text.search(header);
    if (match !== -1 && (answerKeyStart === -1 || match > answerKeyStart)) {
      answerKeyStart = match;
    }
  }
  
  // If found answer key section, use text from there; otherwise use last 80K chars
  if (answerKeyStart !== -1) {
    searchText = text.slice(answerKeyStart);
    console.log(`Found answer key section at position ${answerKeyStart}`);
  } else {
    // Fallback: search in last 80K characters (roughly last 3-5 pages)
    searchText = text.slice(-80000);
    console.log("No answer key header found, searching last 80K chars...");
  }
  
  // Multiple regex patterns for different answer key formats
  const patterns = [
    // Format: "1. (A)" or "1.(A)" or "1 (A)"
    /(\d+)\s*\.?\s*\(([A-Da-d])\)/g,
    // Format: "1. A" or "1.A" or "1 A" (letter at word boundary)
    /(\d+)\s*[\.\)\-:]\s*([A-Da-d])(?=[\s,;.\n\r]|$)/g,
    // Format: "Q1: A" or "Q.1: A"
    /Q\.?\s*(\d+)\s*[\:\-\.\)]\s*\(?([A-Da-d])\)?/gi,
    // Format: "Ans 1: A" or "Answer 1: A"
    /(?:Ans(?:wer)?)\s*[\.\:\-]?\s*(\d+)\s*[\:\-\.\)]\s*\(?([A-Da-d])\)?/gi,
    // Format: table-like "1    A" or "1  A" (multiple spaces)
    /(?:^|\n)\s*(\d+)\s{2,}([A-Da-d])(?:\s|$)/gm,
    // Format: "1=A" or "1 = A"
    /(\d+)\s*=\s*\(?([A-Da-d])\)?/g,
    // Format: just "1 A" at start of line
    /(?:^|\n)\s*(\d+)\s+([A-Da-d])(?=\s|\n|$)/gm,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(searchText)) !== null) {
      const qNum = parseInt(match[1], 10);
      const answer = match[2].toUpperCase();
      
      // Only accept reasonable question numbers (1-200)
      if (qNum >= 1 && qNum <= 200 && !answerMap.has(qNum)) {
        answerMap.set(qNum, answer);
      }
    }
  }
  
  console.log(`Found ${answerMap.size} answers in answer key`);
  
  // Log sample of found answers for debugging
  if (answerMap.size > 0) {
    const sample = Array.from(answerMap.entries()).slice(0, 5);
    console.log("Sample answers:", JSON.stringify(sample));
  }
  
  return answerMap;
}

/**
 * Split text into chunks at question boundaries to avoid breaking questions.
 */
function chunkTextByQuestions(text: string, maxChunkSize: number = 100000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxChunkSize) {
      chunks.push(remaining);
      break;
    }
    
    // Find a good break point near maxChunkSize
    let breakPoint = maxChunkSize;
    
    // Look for question boundary patterns near the break point
    const searchStart = Math.max(0, maxChunkSize - 5000);
    const searchEnd = Math.min(remaining.length, maxChunkSize + 2000);
    const searchRegion = remaining.slice(searchStart, searchEnd);
    
    // Find question starts in the search region
    const questionPattern = /(?:^|\n)\s*(?:Q\.?\s*)?(\d{1,3})\s*[\.\)]/gm;
    let lastMatch = null;
    let match;
    
    while ((match = questionPattern.exec(searchRegion)) !== null) {
      if (searchStart + match.index >= maxChunkSize - 3000) {
        // Found a question boundary after the target point
        if (!lastMatch || searchStart + match.index <= maxChunkSize) {
          lastMatch = { index: searchStart + match.index };
        }
        break;
      }
      lastMatch = { index: searchStart + match.index };
    }
    
    if (lastMatch && lastMatch.index > maxChunkSize * 0.7) {
      breakPoint = lastMatch.index;
    }
    
    chunks.push(remaining.slice(0, breakPoint));
    remaining = remaining.slice(breakPoint);
  }
  
  return chunks;
}

/**
 * Normalize raw extracted questions from AI response.
 */
function normalizeQuestions(raw: any[]): ExtractedQuestion[] {
  const seen = new Set<number>();
  const result: ExtractedQuestion[] = [];
  
  for (const q of raw) {
    const num = Number(q.question_number || q.number || q.q_num || 0);
    if (num <= 0 || seen.has(num)) continue;
    seen.add(num);
    
    // Normalize options
    let options: Record<string, ExtractedOption> = {};
    if (q.options) {
      if (Array.isArray(q.options)) {
        const labels = ["A", "B", "C", "D", "E"];
        q.options.forEach((opt: any, i: number) => {
          if (i < labels.length) {
            const text = typeof opt === "string" ? opt : (opt?.text || opt?.value || String(opt));
            options[labels[i]] = { text };
          }
        });
      } else if (typeof q.options === "object") {
        for (const [key, val] of Object.entries(q.options)) {
          const normalKey = key.toUpperCase().replace(/[^A-D]/g, "");
          if (normalKey && normalKey.length === 1) {
            const text = typeof val === "string" ? val : ((val as any)?.text || String(val));
            options[normalKey] = { text };
          }
        }
      }
    }
    
    // Map difficulty
    let difficulty = "medium";
    const rawDiff = String(q.difficulty || "medium").toLowerCase();
    if (rawDiff.includes("easy") || rawDiff.includes("simple")) difficulty = "easy";
    else if (rawDiff.includes("hard") || rawDiff.includes("difficult")) difficulty = "hard";
    
    result.push({
      question_number: num,
      question_text: String(q.question_text || q.text || q.question || ""),
      options,
      correct_answer: "", // Will be filled from answer key
      explanation: String(q.explanation || q.solution || ""),
      difficulty,
      marks: Number(q.marks || q.mark || 4),
    });
  }
  
  return result.sort((a, b) => a.question_number - b.question_number);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentJson, contentMarkdown, examName, year, paperType } = await req.json();
    
    console.log("=== Starting MCQ Extraction ===");
    console.log(`Exam: ${examName}  Year: ${year} Type: ${paperType} `);

    // Prefer markdown over JSON for cleaner text
    let extractionText = "";
    if (contentMarkdown && typeof contentMarkdown === "string" && contentMarkdown.length > 100) {
      extractionText = contentMarkdown;
      console.log(`Using markdown content, length: ${extractionText.length}`);
    } else if (contentJson) {
      extractionText = typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson);
      console.log(`Using stringified contentJson, length: ${extractionText.length}`);
    }
    
    if (!extractionText || extractionText.length < 100) {
      return new Response(
        JSON.stringify({
          success: false,
          questions: [],
          questionsCount: 0,
          error: "No valid content provided for extraction",
          errorCode: "NO_CONTENT",
        } as ExtractResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Full extraction text length: ${extractionText.length}`);

    // Step 1: Extract answer key from document (NO AI - just regex parsing)
    console.log("Extracting answer key from document...");
    const answerKey = extractAnswerKey(extractionText);
    console.log(`Answer key extracted: ${answerKey.size} answers found`);

    // Step 2: Split text into chunks for processing
    const chunks = chunkTextByQuestions(extractionText, 120000);
    console.log(`Split text into ${chunks.length} chunks`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // System prompt - explicitly tell AI NOT to determine correct answers
    const systemPrompt = `You are an expert at extracting multiple choice questions from exam papers.

IMPORTANT RULES:
1. Extract ALL questions you find - do not skip any
2. DO NOT guess or determine the correct answer - leave correct_answer as empty string ""
3. Extract question text exactly as written (preserve formatting, formulas)
4. Extract all options A, B, C, D (and E if present)
5. If a question has an image reference, note it in the question text

Return a JSON array of objects with this exact structure:
{
  "questions": [
    {
      "question_number": <number>,
      "question_text": "<full question text>",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "difficulty": "easy|medium|hard",
      "marks": <number, usually 4>,
      "explanation": ""
    }
  ]
}

Return ONLY valid JSON, no other text.`;

    const allQuestions: ExtractedQuestion[] = [];
    const errors: string[] = [];
    let chunksProcessed = 0;
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}, length: ${chunk.length}`);
      
      const userPrompt = `Extract ALL multiple choice questions from this ${examName} ${year} ${paperType || ""} exam paper content.
Remember: DO NOT determine correct answers - leave them empty. Just extract questions and options.

Content:
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
            temperature: 0.1,
          }),
        });

        console.log(`Chunk ${i + 1} - Gateway response status: ${response.status}`);

        if (response.status === 429) {
          errors.push(`Chunk ${i + 1}: Rate limited`);
          continue;
        }
        
        if (response.status === 402) {
          errors.push(`Chunk ${i + 1}: Credits exhausted`);
          break;
        }

        if (!response.ok) {
          const errText = await response.text();
          errors.push(`Chunk ${i + 1}: API error ${response.status}`);
          console.error(`Chunk ${i + 1} error:`, errText);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        console.log(`Chunk ${i + 1} - LLM response length: ${content.length}`);

        // Parse JSON from response
        let parsed: any = null;
        try {
          // Clean up response - remove markdown code blocks if present
          let jsonText = content.trim();
          if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          }
          
          // Try to find JSON object or array in response
          const objectMatch = jsonText.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            parsed = JSON.parse(objectMatch[0]);
          }
        } catch (parseErr) {
          console.error(`Chunk ${i + 1} - JSON parse error:`, parseErr);
          errors.push(`Chunk ${i + 1}: Failed to parse response`);
        }

        if (parsed) {
          const rawQuestions = parsed.questions || (Array.isArray(parsed) ? parsed : []);
          if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
            const normalized = normalizeQuestions(rawQuestions);
            console.log(`Chunk ${i + 1} - Extracted ${normalized.length} questions`);
            allQuestions.push(...normalized);
          }
        }
        
        chunksProcessed++;
      } catch (chunkErr) {
        console.error(`Chunk ${i + 1} processing error:`, chunkErr);
        errors.push(`Chunk ${i + 1}: ${chunkErr instanceof Error ? chunkErr.message : "Unknown error"}`);
      }
    }

    // Deduplicate questions by number
    const questionMap = new Map<number, ExtractedQuestion>();
    for (const q of allQuestions) {
      if (!questionMap.has(q.question_number)) {
        questionMap.set(q.question_number, q);
      }
    }

    // Step 3: Apply answer key to questions (NO AI - just mapping)
    console.log(`Applying answer key to ${questionMap.size} questions...`);
    let answersApplied = 0;
    const missingAnswers: number[] = [];
    
    for (const [qNum, question] of questionMap) {
      const answer = answerKey.get(qNum);
      if (answer) {
        question.correct_answer = answer;
        answersApplied++;
      } else {
        missingAnswers.push(qNum);
      }
    }
    console.log(`Applied ${answersApplied} answers from answer key`);
    
    if (missingAnswers.length > 0 && missingAnswers.length <= 20) {
      console.log(`Missing answers for questions: ${missingAnswers.join(", ")}`);
    }

    // Convert to sorted array
    const finalQuestions = Array.from(questionMap.values())
      .sort((a, b) => a.question_number - b.question_number);

    console.log(`Final: ${finalQuestions.length} unique questions extracted`);

    const response: ExtractResponse = {
      success: finalQuestions.length > 0,
      questions: finalQuestions,
      questionsCount: finalQuestions.length,
      partial: errors.length > 0 && finalQuestions.length > 0,
      error: finalQuestions.length === 0 ? "No MCQs could be extracted" : undefined,
      errorCode: finalQuestions.length === 0 ? "NO_QUESTIONS" : undefined,
      errors: errors.length > 0 ? errors : undefined,
      chunksProcessed,
      answerKeyStats: {
        found: answerKey.size,
        applied: answersApplied,
        missing: missingAnswers.slice(0, 20), // Limit to first 20
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Extraction error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        questions: [],
        questionsCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: "SERVER_ERROR",
      } as ExtractResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
