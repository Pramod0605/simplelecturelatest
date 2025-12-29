import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum questions to extract - papers can have 1-200 questions
const MAX_QUESTIONS = 200;
// Number of parallel chunks to process
const CHUNK_COUNT = 6;
// Maximum recovery attempts per chunk (dynamic: 2 for badly failed chunks)
const MAX_CHUNK_RECOVERY_ATTEMPTS = 2;
// Questions to target per recovery call
const RECOVERY_BATCH_SIZE = 15;
// Chunk overlap in characters to avoid splitting questions
const CHUNK_OVERLAP = 500;

interface ExtractedOption {
  text: string;
  image_url?: string;
}

interface ExtractedQuestion {
  question_number: number;
  question_text: string;
  options: Record<string, ExtractedOption>;
  correct_answer: string;
  question_type: "mcq" | "integer";
  explanation: string;
  difficulty: string;
  marks: number;
}

interface ChunkWithRange {
  text: string;
  chunkIndex: number;
  expectedRange: number[];
  answerKeySlice: Map<number, string>;
}

interface ChunkResult {
  chunkIndex: number;
  questions: ExtractedQuestion[];
  recovered: number;
  errors: string[];
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
  extractionStats?: {
    expected: number;
    extracted: number;
    recoveryAttempts: number;
    recoveredInRetries: number;
    stillMissing: number[];
    completionRate: string;
  };
}

/**
 * Convert numeric answer (1-4) to letter (A-D)
 */
function numericToLetter(num: string): string | null {
  const map: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
  return map[num] || null;
}

/**
 * Parse markdown table rows for answer key
 */
function parseTableAnswers(text: string): Map<number, string> {
  const answers = new Map<number, string>();
  
  const primaryPattern = /\|\s*(\d{1,3})\s*\.?\s*\(([^)]+)\)/g;
  let match;
  
  while ((match = primaryPattern.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    const rawAnswer = match[2].trim();
    
    if (qNum < 1 || qNum > MAX_QUESTIONS) continue;
    
    if (/^[1-4]$/.test(rawAnswer)) {
      const letter = numericToLetter(rawAnswer);
      if (letter) answers.set(qNum, letter);
    } else if (/^[A-Da-d]$/.test(rawAnswer)) {
      answers.set(qNum, rawAnswer.toUpperCase());
    } else if (/^-?\d+\.?\d*$/.test(rawAnswer)) {
      answers.set(qNum, rawAnswer);
    }
  }
  
  const simpleTablePattern = /\|\s*(\d{1,3})\s*\|\s*([A-Da-d1-4])\s*\|/g;
  while ((match = simpleTablePattern.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    if (answers.has(qNum)) continue;
    
    let answer = match[2].toUpperCase();
    if (/^[1-4]$/.test(answer)) {
      const converted = numericToLetter(answer);
      if (converted) answer = converted;
    }
    
    if (qNum >= 1 && qNum <= MAX_QUESTIONS && /^[A-D]$/.test(answer)) {
      answers.set(qNum, answer);
    }
  }
  
  return answers;
}

/**
 * Extract answer key from the document text
 */
function extractAnswerKey(text: string): Map<number, string> {
  const answerMap = new Map<number, string>();
  
  const answerKeyHeaders = [
    /ANSWER\s*KEY/i,
    /ANSWERS?\s*:/i,
    /SOLUTION\s*KEY/i,
    /CORRECT\s*ANSWERS?/i,
    /KEY\s*:/i,
  ];
  
  let searchText = text;
  let answerKeyStart = -1;
  
  for (const header of answerKeyHeaders) {
    const match = text.search(header);
    if (match !== -1 && (answerKeyStart === -1 || match > answerKeyStart)) {
      answerKeyStart = match;
    }
  }
  
  if (answerKeyStart !== -1) {
    searchText = text.slice(answerKeyStart);
    console.log(`Found answer key section at position ${answerKeyStart}`);
  } else {
    searchText = text.slice(-80000);
    console.log("No answer key header found, searching last 80K chars...");
  }
  
  const tableLines = (searchText.match(/\|.*\|/g) || []).length;
  if (tableLines > 5) {
    const tableAnswers = parseTableAnswers(searchText);
    for (const [k, v] of tableAnswers) {
      answerMap.set(k, v);
    }
  }
  
  const mcqPatterns = [
    /(\d{1,3})\s*\.?\s*\(([A-Da-d])\)/g,
    /(\d{1,3})\s*[\.\)\-:]\s*([A-Da-d])(?=[\s,;.\n\r]|$)/g,
    /Q\.?\s*(\d{1,3})\s*[\:\-\.\)]\s*\(?([A-Da-d])\)?/gi,
  ];
  
  const numericMcqPatterns = [
    /(\d{1,3})\s*\.?\s*\(([1-4])\)/g,
    /(\d{1,3})\s*[\.\)\-:]\s*([1-4])(?=[\s,;.\n\r]|$)/g,
  ];
  
  const integerPatterns = [
    /(\d{1,3})\s*\.?\s*\((-?\d{2,})\)/g,
    /(\d{1,3})\s*[:\-]\s*(-?\d{2,})(?=[\s,;.\n\r]|$)/g,
  ];
  
  for (const pattern of mcqPatterns) {
    let match;
    while ((match = pattern.exec(searchText)) !== null) {
      const qNum = parseInt(match[1], 10);
      const answer = match[2].toUpperCase();
      if (qNum >= 1 && qNum <= MAX_QUESTIONS && /^[A-D]$/.test(answer) && !answerMap.has(qNum)) {
        answerMap.set(qNum, answer);
      }
    }
  }
  
  for (const pattern of numericMcqPatterns) {
    let match;
    while ((match = pattern.exec(searchText)) !== null) {
      const qNum = parseInt(match[1], 10);
      const numAnswer = match[2];
      if (qNum >= 1 && qNum <= MAX_QUESTIONS && !answerMap.has(qNum)) {
        const letter = numericToLetter(numAnswer);
        if (letter) answerMap.set(qNum, letter);
      }
    }
  }
  
  for (const pattern of integerPatterns) {
    let match;
    while ((match = pattern.exec(searchText)) !== null) {
      const qNum = parseInt(match[1], 10);
      const intAnswer = match[2];
      if (qNum >= 1 && qNum <= MAX_QUESTIONS && !answerMap.has(qNum)) {
        answerMap.set(qNum, intAnswer);
      }
    }
  }
  
  console.log(`Total answers found: ${answerMap.size}`);
  return answerMap;
}

/**
 * Helper function for delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create smart chunks with expected question ranges
 */
function createSmartChunks(
  text: string, 
  totalQuestions: number,
  answerKey: Map<number, string>
): ChunkWithRange[] {
  const chunks: ChunkWithRange[] = [];
  const questionsPerChunk = Math.ceil(totalQuestions / CHUNK_COUNT);
  
  // Find all question positions in text
  const questionPattern = /(?:^|\n)\s*(?:Q\.?\s*)?(\d{1,3})\s*[\.\)]/gm;
  const questionPositions: { index: number; qNum: number }[] = [];
  let match;
  
  while ((match = questionPattern.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    if (qNum >= 1 && qNum <= MAX_QUESTIONS) {
      questionPositions.push({ index: match.index, qNum });
    }
  }
  
  console.log(`Found ${questionPositions.length} question markers in text`);
  
  // If we can't find question markers, split by character count
  if (questionPositions.length < CHUNK_COUNT) {
    const chunkSize = Math.ceil(text.length / CHUNK_COUNT);
    for (let i = 0; i < CHUNK_COUNT; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize, text.length);
      const chunkText = text.slice(start, end);
      
      if (chunkText.trim().length < 100) continue;
      
      const rangeStart = i * questionsPerChunk + 1;
      const rangeEnd = Math.min((i + 1) * questionsPerChunk, totalQuestions);
      const expectedRange = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, j) => rangeStart + j);
      
      const answerKeySlice = new Map<number, string>();
      for (const qNum of expectedRange) {
        const answer = answerKey.get(qNum);
        if (answer) answerKeySlice.set(qNum, answer);
      }
      
      chunks.push({
        text: chunkText,
        chunkIndex: i,
        expectedRange,
        answerKeySlice,
      });
    }
    return chunks;
  }
  
  // Smart chunking based on question positions with OVERLAP
  for (let i = 0; i < CHUNK_COUNT; i++) {
    const rangeStart = i * questionsPerChunk + 1;
    const rangeEnd = Math.min((i + 1) * questionsPerChunk, totalQuestions);
    const expectedRange = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, j) => rangeStart + j);
    
    // Find text boundaries for this range
    const startPos = questionPositions.find(p => p.qNum >= rangeStart);
    const endPos = questionPositions.find(p => p.qNum > rangeEnd);
    
    // Add CHUNK_OVERLAP to ensure we don't cut questions in half
    let chunkStart = startPos ? Math.max(0, startPos.index - CHUNK_OVERLAP) : (i * Math.ceil(text.length / CHUNK_COUNT));
    let chunkEnd = endPos ? endPos.index + CHUNK_OVERLAP : ((i + 1) * Math.ceil(text.length / CHUNK_COUNT));
    
    // Ensure we don't exceed text bounds
    chunkStart = Math.max(0, chunkStart);
    chunkEnd = Math.min(text.length, chunkEnd);
    
    const chunkText = text.slice(chunkStart, chunkEnd);
    
    if (chunkText.trim().length < 100) continue;
    
    const answerKeySlice = new Map<number, string>();
    for (const qNum of expectedRange) {
      const answer = answerKey.get(qNum);
      if (answer) answerKeySlice.set(qNum, answer);
    }
    
    chunks.push({
      text: chunkText,
      chunkIndex: i,
      expectedRange,
      answerKeySlice,
    });
  }
  
  console.log(`Created ${chunks.length} smart chunks`);
  return chunks;
}

/**
 * Normalize raw extracted questions from AI response
 */
function normalizeQuestions(raw: any[]): ExtractedQuestion[] {
  const seen = new Set<number>();
  const result: ExtractedQuestion[] = [];
  
  for (const q of raw) {
    const num = Number(q.question_number || q.number || q.q_num || 0);
    if (num <= 0 || seen.has(num)) continue;
    seen.add(num);
    
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
    
    let difficulty = "Medium";
    const rawDiff = String(q.difficulty || "medium").toLowerCase();
    if (rawDiff.includes("easy") || rawDiff.includes("low")) difficulty = "Low";
    else if (rawDiff.includes("hard") || rawDiff.includes("advanced")) difficulty = "Advanced";
    else if (rawDiff.includes("intermediate")) difficulty = "Intermediate";
    
    result.push({
      question_number: num,
      question_text: String(q.question_text || q.text || q.question || ""),
      options,
      correct_answer: "",
      question_type: "mcq",
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
    
    console.log("=== Starting PARALLEL MCQ Extraction ===");
    console.log(`Exam: ${examName}  Year: ${year} Type: ${paperType}`);

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

    // Step 1: Extract answer key (NO AI - regex only)
    console.log("Extracting answer key...");
    const answerKey = extractAnswerKey(extractionText);
    const expectedQuestionCount = answerKey.size;
    console.log(`🎯 EXPECTED QUESTIONS: ${expectedQuestionCount} (from answer key)`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Step 2: Create smart chunks with question ranges
    const smartChunks = createSmartChunks(extractionText, expectedQuestionCount || 90, answerKey);
    console.log(`Created ${smartChunks.length} parallel chunks`);

    const tools = [
      {
        type: "function",
        function: {
          name: "extract_questions",
          description: "Extract multiple choice questions from exam paper content.",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question_number: { type: "number" },
                    question_text: { type: "string" },
                    options: {
                      type: "object",
                      properties: {
                        A: { type: "string" },
                        B: { type: "string" },
                        C: { type: "string" },
                        D: { type: "string" },
                      },
                      required: ["A", "B", "C", "D"],
                      additionalProperties: true,
                    },
                    difficulty: { type: "string" },
                    marks: { type: "number" },
                    explanation: { type: "string" },
                  },
                  required: ["question_number", "question_text", "options"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },
    ];

    const tool_choice = { type: "function", function: { name: "extract_questions" } };

    /**
     * Process a single chunk with the AI
     */
    async function callAI(
      chunkText: string,
      expectedRange: number[],
      isRecovery: boolean = false,
      targetQuestions?: number[]
    ): Promise<ExtractedQuestion[]> {
      const rangeStr = expectedRange.length > 0 
        ? `Questions ${expectedRange[0]}-${expectedRange[expectedRange.length - 1]}`
        : "Questions";
      
      let systemPrompt: string;
      let userPrompt: string;
      
      if (isRecovery && targetQuestions && targetQuestions.length > 0) {
        systemPrompt = `You are an expert at extracting specific questions from exam papers.
Focus ONLY on finding questions ${targetQuestions.join(", ")}.
Return them in JSON format with question_number, question_text, options, difficulty, marks, explanation.`;
        
        userPrompt = `FIND ONLY these specific questions: ${targetQuestions.join(", ")}

Search carefully for each question number. Return ONLY these questions.

Content:
${chunkText}`;
      } else {
        systemPrompt = `You are an expert at extracting MCQs from exam papers.

RULES:
1. Extract ALL questions in range ${rangeStr}
2. DO NOT determine correct answer - leave correct_answer as ""
3. Extract question text exactly as written
4. Extract all options A, B, C, D

Return JSON: { "questions": [...] }`;
        
        userPrompt = `Extract ${rangeStr} from this ${examName} ${year} ${paperType || ""} exam paper.
Expected questions: ${expectedRange.join(", ")}

Content:
${chunkText}`;
      }

      const maxRetries = 2;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            await delay(attempt * 1500);
          }
          
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
              tools,
              tool_choice,
              temperature: 0.1,
              max_tokens: 16000,
            }),
          });

          if (response.status === 429 || response.status === 402) {
            if (attempt < maxRetries) continue;
            throw new Error(response.status === 429 ? "Rate limited" : "Credits exhausted");
          }

          if (!response.ok) {
            if (attempt < maxRetries) continue;
            throw new Error(`API error ${response.status}`);
          }

          const data = await response.json();
          const message = data.choices?.[0]?.message;
          const toolArgs = message?.tool_calls?.[0]?.function?.arguments as string | undefined;
          const content = (message?.content as string | undefined) || "";

          let parsed: any = null;

          if (toolArgs) {
            try {
              parsed = JSON.parse(toolArgs);
            } catch (e) {
              console.error("Tool args parse error:", e);
            }
          }

          if (!parsed && content) {
            try {
              let jsonText = content.trim();
              if (jsonText.startsWith("```")) {
                jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
              }
              const objectMatch = jsonText.match(/\{[\s\S]*\}/);
              if (objectMatch) {
                parsed = JSON.parse(objectMatch[0]);
              }
            } catch (e) {
              console.error("Content parse error:", e);
            }
          }

          if (parsed) {
            const rawQuestions = parsed.questions || (Array.isArray(parsed) ? parsed : []);
            if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
              return normalizeQuestions(rawQuestions);
            }
          }
          
          return [];
          
        } catch (err) {
          if (attempt === maxRetries) throw err;
        }
      }
      
      return [];
    }

    /**
     * Process a single chunk with its own scoped recovery loop
     */
    async function processChunkWithRecovery(chunk: ChunkWithRange): Promise<ChunkResult> {
      const { text, chunkIndex, expectedRange, answerKeySlice } = chunk;
      const errors: string[] = [];
      let totalRecovered = 0;
      
      console.log(`\n📦 Chunk ${chunkIndex + 1}: Processing Q${expectedRange[0]}-${expectedRange[expectedRange.length - 1]}`);
      
      // Initial extraction
      let questions: ExtractedQuestion[] = [];
      try {
        questions = await callAI(text, expectedRange);
        console.log(`   Chunk ${chunkIndex + 1}: Initial extraction got ${questions.length} questions`);
      } catch (err) {
        errors.push(`Chunk ${chunkIndex + 1} initial: ${err instanceof Error ? err.message : "Unknown"}`);
        console.error(`   Chunk ${chunkIndex + 1} failed:`, err);
      }
      
      // Build map of extracted questions
      const questionMap = new Map<number, ExtractedQuestion>();
      for (const q of questions) {
        if (expectedRange.includes(q.question_number)) {
          questionMap.set(q.question_number, q);
        }
      }
      
      // Per-chunk scoped recovery - only for THIS chunk's expected questions
      // FIXED: Removed the "<= 10" restriction - recovery should run for ANY missing questions
      const missing = expectedRange.filter(n => !questionMap.has(n) && answerKeySlice.has(n));
      
      if (missing.length > 0) {
        console.log(`   Chunk ${chunkIndex + 1}: Missing ${missing.length} questions, attempting recovery...`);
        
        // Dynamic recovery attempts: more attempts for badly failed chunks
        const maxAttempts = missing.length > 5 ? MAX_CHUNK_RECOVERY_ATTEMPTS : 1;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const currentMissing = expectedRange.filter(n => !questionMap.has(n) && answerKeySlice.has(n));
          if (currentMissing.length === 0) break;
          
          try {
            await delay(300 + attempt * 200); // Increasing delay between attempts
            // FIXED: Process more questions per recovery (RECOVERY_BATCH_SIZE instead of 8)
            const recovered = await callAI(text, expectedRange, true, currentMissing.slice(0, RECOVERY_BATCH_SIZE));
            
            let newlyRecovered = 0;
            for (const q of recovered) {
              if (currentMissing.includes(q.question_number) && !questionMap.has(q.question_number)) {
                questionMap.set(q.question_number, q);
                newlyRecovered++;
              }
            }
            
            totalRecovered += newlyRecovered;
            console.log(`   Chunk ${chunkIndex + 1}: Recovery attempt ${attempt + 1} got ${newlyRecovered} questions`);
            
            if (newlyRecovered === 0) break;
          } catch (err) {
            errors.push(`Chunk ${chunkIndex + 1} recovery ${attempt + 1}: ${err instanceof Error ? err.message : "Unknown"}`);
            break;
          }
        }
      }
      
      const finalQuestions = Array.from(questionMap.values());
      console.log(`   Chunk ${chunkIndex + 1}: Final count ${finalQuestions.length}/${expectedRange.length}`);
      
      return {
        chunkIndex,
        questions: finalQuestions,
        recovered: totalRecovered,
        errors,
      };
    }

    // ===== PARALLEL EXTRACTION =====
    console.log("\n===== PHASE 1: PARALLEL EXTRACTION =====");
    
    // Launch all chunks in parallel with small stagger to avoid rate limits
    const chunkPromises = smartChunks.map((chunk, i) => 
      delay(i * 200).then(() => processChunkWithRecovery(chunk))
    );
    
    const startTime = Date.now();
    const chunkResults = await Promise.all(chunkPromises);
    const elapsedTime = Date.now() - startTime;
    
    console.log(`\n⏱️ Parallel extraction completed in ${elapsedTime}ms`);

    // ===== MERGE RESULTS =====
    console.log("\n===== PHASE 2: MERGE RESULTS =====");
    
    const allQuestions: ExtractedQuestion[] = [];
    const allErrors: string[] = [];
    let totalRecovered = 0;
    let chunksProcessed = 0;
    
    for (const result of chunkResults) {
      allQuestions.push(...result.questions);
      allErrors.push(...result.errors);
      totalRecovered += result.recovered;
      if (result.questions.length > 0) chunksProcessed++;
    }
    
    // Deduplicate by question number
    const questionMap = new Map<number, ExtractedQuestion>();
    for (const q of allQuestions) {
      if (!questionMap.has(q.question_number)) {
        questionMap.set(q.question_number, q);
      }
    }
    
    console.log(`Merged: ${questionMap.size} unique questions from ${chunksProcessed} chunks`);

    // ===== PHASE 2.5: GLOBAL RECOVERY FOR REMAINING MISSING QUESTIONS =====
    const globalMissing = Array.from(answerKey.keys()).filter(n => !questionMap.has(n));
    
    if (globalMissing.length > 0 && globalMissing.length <= 25) {
      console.log(`\n===== PHASE 2.5: GLOBAL RECOVERY =====`);
      console.log(`Attempting global recovery for ${globalMissing.length} missing questions: ${globalMissing.slice(0, 10).join(", ")}${globalMissing.length > 10 ? "..." : ""}`);
      
      try {
        // Use last portion of text which often contains all questions
        const globalRecoveryText = extractionText.slice(-40000);
        const globalRecovered = await callAI(globalRecoveryText, globalMissing, true, globalMissing);
        
        let globalNewlyRecovered = 0;
        for (const q of globalRecovered) {
          if (globalMissing.includes(q.question_number) && !questionMap.has(q.question_number)) {
            questionMap.set(q.question_number, q);
            globalNewlyRecovered++;
            totalRecovered++;
          }
        }
        
        console.log(`Global recovery: Found ${globalNewlyRecovered} additional questions`);
        
        // Second global recovery attempt if still missing significant questions
        const stillMissingAfterFirst = Array.from(answerKey.keys()).filter(n => !questionMap.has(n));
        if (stillMissingAfterFirst.length > 0 && stillMissingAfterFirst.length <= 15) {
          await delay(500);
          console.log(`Second global recovery attempt for ${stillMissingAfterFirst.length} questions...`);
          
          const secondRecovered = await callAI(extractionText.slice(0, 40000), stillMissingAfterFirst, true, stillMissingAfterFirst);
          
          for (const q of secondRecovered) {
            if (stillMissingAfterFirst.includes(q.question_number) && !questionMap.has(q.question_number)) {
              questionMap.set(q.question_number, q);
              globalNewlyRecovered++;
              totalRecovered++;
            }
          }
          console.log(`Second global recovery: Total recovered ${globalNewlyRecovered} questions`);
        }
      } catch (err) {
        console.error(`Global recovery failed:`, err);
        allErrors.push(`Global recovery: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // ===== APPLY ANSWER KEY =====
    console.log("\n===== PHASE 3: APPLY ANSWER KEY =====");
    
    let answersApplied = 0;
    const missingAnswers: number[] = [];
    
    for (const [qNum, question] of questionMap) {
      const answer = answerKey.get(qNum);
      if (answer) {
        question.correct_answer = answer;
        question.question_type = /^[A-D]$/.test(answer) ? "mcq" : "integer";
        answersApplied++;
      } else {
        missingAnswers.push(qNum);
      }
    }
    
    console.log(`Applied ${answersApplied} answers from answer key`);

    // Final sorted array
    const finalQuestions = Array.from(questionMap.values())
      .sort((a, b) => a.question_number - b.question_number)
      .slice(0, MAX_QUESTIONS);

    // Calculate statistics
    const stillMissing = expectedQuestionCount > 0 
      ? Array.from(answerKey.keys()).filter(n => !questionMap.has(n))
      : [];
    const completionRate = expectedQuestionCount > 0 
      ? `${Math.round((finalQuestions.length / expectedQuestionCount) * 100)}%`
      : "N/A";

    console.log(`\n===== EXTRACTION COMPLETE =====`);
    console.log(`📊 Final: ${finalQuestions.length}/${expectedQuestionCount} questions (${completionRate})`);
    console.log(`⏱️ Total time: ${elapsedTime}ms`);
    console.log(`✅ Recovered in retries: ${totalRecovered}`);
    if (stillMissing.length > 0) {
      console.log(`❌ Still missing: ${stillMissing.slice(0, 20).join(", ")}${stillMissing.length > 20 ? "..." : ""}`);
    }

    const isPartial = expectedQuestionCount > 0 && finalQuestions.length < expectedQuestionCount * 0.95;

    const response: ExtractResponse = {
      success: finalQuestions.length > 0,
      questions: finalQuestions,
      questionsCount: finalQuestions.length,
      partial: isPartial || (allErrors.length > 0 && finalQuestions.length > 0),
      error: finalQuestions.length === 0 ? "No MCQs could be extracted" : 
             isPartial ? `Extracted ${finalQuestions.length} of ${expectedQuestionCount} expected questions (${completionRate})` : undefined,
      errorCode: finalQuestions.length === 0 ? "NO_QUESTIONS" : undefined,
      errors: allErrors.length > 0 ? allErrors : undefined,
      chunksProcessed,
      answerKeyStats: {
        found: answerKey.size,
        applied: answersApplied,
        missing: missingAnswers.slice(0, 20),
      },
      extractionStats: {
        expected: expectedQuestionCount,
        extracted: finalQuestions.length,
        recoveryAttempts: smartChunks.length, // Each chunk does its own recovery
        recoveredInRetries: totalRecovered,
        stillMissing: stillMissing.slice(0, 30),
        completionRate,
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
