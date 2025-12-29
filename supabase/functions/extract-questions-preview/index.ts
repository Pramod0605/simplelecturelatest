import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum questions to extract - papers can have 1-200 questions
const MAX_QUESTIONS = 200;
// Maximum retry attempts for missing question recovery
const MAX_RECOVERY_ATTEMPTS = 5;

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
 * Handles formats like: | 1. (3) | 2. (4) | and | 21. (8788) |
 */
function parseTableAnswers(text: string): Map<number, string> {
  const answers = new Map<number, string>();
  
  // PRIMARY PATTERN: Match "| 1. (3) |" or "| 21. (8788) |" format
  // This is the actual format used in JEE/MathonGo papers
  const primaryPattern = /\|\s*(\d{1,3})\s*\.?\s*\(([^)]+)\)/g;
  let match;
  
  while ((match = primaryPattern.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    const rawAnswer = match[2].trim();
    
    if (qNum < 1 || qNum > MAX_QUESTIONS) continue;
    
    // Check what type of answer it is
    if (/^[1-4]$/.test(rawAnswer)) {
      // MCQ with numeric answer (1-4) -> convert to A-D
      const letter = numericToLetter(rawAnswer);
      if (letter) answers.set(qNum, letter);
    } else if (/^[A-Da-d]$/.test(rawAnswer)) {
      // MCQ with letter answer
      answers.set(qNum, rawAnswer.toUpperCase());
    } else if (/^-?\d+\.?\d*$/.test(rawAnswer)) {
      // Integer-type or numeric answer (like 8788, 474, 17280)
      answers.set(qNum, rawAnswer);
    }
  }
  
  // FALLBACK PATTERN: Match simple table "| 1 | A |" or "| 1 | 2 |"
  const simpleTablePattern = /\|\s*(\d{1,3})\s*\|\s*([A-Da-d1-4])\s*\|/g;
  while ((match = simpleTablePattern.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    if (answers.has(qNum)) continue; // Don't overwrite
    
    let answer = match[2].toUpperCase();
    if (/^[1-4]$/.test(answer)) {
      const converted = numericToLetter(answer);
      if (converted) answer = converted;
    }
    
    if (qNum >= 1 && qNum <= MAX_QUESTIONS && /^[A-D]$/.test(answer)) {
      answers.set(qNum, answer);
    }
  }
  
  console.log(`parseTableAnswers: Found ${answers.size} answers from table patterns`);
  
  return answers;
}

/**
 * Extract answer key from the document text using robust token-based parsing.
 * Handles tables, numeric answers (1-4), and various text formats.
 */
function extractAnswerKey(text: string): Map<number, string> {
  const answerMap = new Map<number, string>();
  
  // Look for answer key section headers
  const answerKeyHeaders = [
    /ANSWER\s*KEY/i,
    /ANSWERS?\s*:/i,
    /SOLUTION\s*KEY/i,
    /CORRECT\s*ANSWERS?/i,
    /KEY\s*:/i,
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
    console.log(`Answer key section length: ${searchText.length} chars`);
    console.log(`Answer key sample (first 500 chars): ${searchText.substring(0, 500)}`);
  } else {
    // Fallback: search in last 80K characters (roughly last 3-5 pages)
    searchText = text.slice(-80000);
    console.log("No answer key header found, searching last 80K chars...");
  }
  
  // Count table-like lines for debugging
  const tableLines = (searchText.match(/\|.*\|/g) || []).length;
  console.log(`Found ${tableLines} table-like lines in answer key section`);
  
  // Strategy 1: Try to parse as markdown table first
  if (tableLines > 5) {
    const tableAnswers = parseTableAnswers(searchText);
    console.log(`Table parsing found ${tableAnswers.size} answers`);
    for (const [k, v] of tableAnswers) {
      answerMap.set(k, v);
    }
  }
  
  // Strategy 2: Additional patterns for non-table answer formats
  const mcqPatterns = [
    // Format: "1. (A)" or "1.(A)" or "1 (A)"
    /(\d{1,3})\s*\.?\s*\(([A-Da-d])\)/g,
    // Format: "1. A" or "1.A" or "1 A" (letter at word boundary)
    /(\d{1,3})\s*[\.\)\-:]\s*([A-Da-d])(?=[\s,;.\n\r]|$)/g,
    // Format: "Q1: A" or "Q.1: A"
    /Q\.?\s*(\d{1,3})\s*[\:\-\.\)]\s*\(?([A-Da-d])\)?/gi,
    // Format: "Ans 1: A" or "Answer 1: A"
    /(?:Ans(?:wer)?)\s*[\.\:\-]?\s*(\d{1,3})\s*[\:\-\.\)]\s*\(?([A-Da-d])\)?/gi,
    // Format: table-like "1    A" or "1  A" (multiple spaces)
    /(?:^|\n)\s*(\d{1,3})\s{2,}([A-Da-d])(?:\s|$)/gm,
    // Format: "1=A" or "1 = A"
    /(\d{1,3})\s*=\s*\(?([A-Da-d])\)?/g,
    // Format: just "1 A" at start of line
    /(?:^|\n)\s*(\d{1,3})\s+([A-Da-d])(?=\s|\n|$)/gm,
  ];
  
  // Numeric MCQ patterns (1-4 instead of A-D)
  const numericMcqPatterns = [
    // Format: "1. (2)" or "1.(3)" - most common for JEE
    /(\d{1,3})\s*\.?\s*\(([1-4])\)/g,
    // Format: "1. 2" or "1:3" (numeric answer)
    /(\d{1,3})\s*[\.\)\-:]\s*([1-4])(?=[\s,;.\n\r]|$)/g,
    // Format: table-like "1    2" (question number, numeric answer)
    /(?:^|\n)\s*(\d{1,3})\s{2,}([1-4])(?:\s|$)/gm,
  ];
  
  // Integer-type answer patterns (multi-digit like 8788, 474, 17280)
  const integerPatterns = [
    // Format: "21. (8788)" or "21.(474)"
    /(\d{1,3})\s*\.?\s*\((-?\d{2,})\)/g,
    // Format: "21: 8788" or "21 - 8788"
    /(\d{1,3})\s*[:\-]\s*(-?\d{2,})(?=[\s,;.\n\r]|$)/g,
  ];
  
  // Apply MCQ letter patterns
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
  
  // Apply numeric MCQ patterns (convert 1-4 to A-D)
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
  
  // Apply integer-type patterns (store as-is, don't convert)
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
  
  // Log sample of found answers for debugging
  if (answerMap.size > 0) {
    const sample = Array.from(answerMap.entries()).slice(0, 10);
    console.log("Sample answers:", JSON.stringify(sample));
  } else {
    // Log what we're searching in for debugging
    console.log("No answers found. First 1000 chars of search text:");
    console.log(searchText.substring(0, 1000));
  }
  
  return answerMap;
}

/**
 * Count approximate number of questions in text
 */
function countQuestionsInText(text: string): number {
  const questionPattern = /(?:^|\n)\s*(?:Q\.?\s*)?(\d{1,3})\s*[\.\)]/gm;
  const matches = text.match(questionPattern) || [];
  return matches.length;
}

/**
 * Helper function for delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Split text into chunks at question boundaries to avoid breaking questions.
 * Uses both character count AND question count limits for optimal extraction.
 */
function chunkTextByQuestions(text: string, maxChunkSize: number = 15000, maxQuestionsPerChunk: number = 20): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let remaining = text;
  
  // Find all question positions in the text
  const questionPattern = /(?:^|\n)\s*(?:Q\.?\s*)?(\d{1,3})\s*[\.\)]/gm;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxChunkSize) {
      chunks.push(remaining);
      break;
    }
    
    // Find all question starts in remaining text
    const questionPositions: { index: number; qNum: number }[] = [];
    let match;
    const patternCopy = new RegExp(questionPattern.source, questionPattern.flags);
    
    while ((match = patternCopy.exec(remaining)) !== null) {
      const qNum = parseInt(match[1], 10);
      if (qNum >= 1 && qNum <= MAX_QUESTIONS) {
        questionPositions.push({ index: match.index, qNum });
      }
    }
    
    // Determine break point based on both size and question count
    let breakPoint = maxChunkSize;
    
    if (questionPositions.length > maxQuestionsPerChunk) {
      // Find the position after maxQuestionsPerChunk questions
      const targetQuestion = questionPositions[maxQuestionsPerChunk];
      if (targetQuestion && targetQuestion.index > 0) {
        breakPoint = Math.min(breakPoint, targetQuestion.index);
      }
    }
    
    // Look for question boundary near the break point
    const searchStart = Math.max(0, breakPoint - 5000);
    const searchEnd = Math.min(remaining.length, breakPoint + 2000);
    
    // Find the closest question boundary
    let bestBreakPoint = breakPoint;
    for (const pos of questionPositions) {
      if (pos.index >= searchStart && pos.index <= searchEnd) {
        if (pos.index <= breakPoint && pos.index > bestBreakPoint * 0.7) {
          bestBreakPoint = pos.index;
        } else if (pos.index > breakPoint && bestBreakPoint === breakPoint) {
          bestBreakPoint = pos.index;
          break;
        }
      }
    }
    
    if (bestBreakPoint > 0 && bestBreakPoint < remaining.length) {
      breakPoint = bestBreakPoint;
    }
    
    // Ensure we don't create tiny chunks
    if (breakPoint < maxChunkSize * 0.3 && remaining.length > maxChunkSize) {
      breakPoint = Math.min(maxChunkSize, remaining.length);
    }
    
    chunks.push(remaining.slice(0, breakPoint));
    remaining = remaining.slice(breakPoint);
  }
  
  return chunks;
}

/**
 * Re-chunk a failed chunk into smaller pieces for retry
 */
function rechunkFailedContent(text: string): string[] {
  // Split into 8KB chunks for failed content
  return chunkTextByQuestions(text, 8000, 10);
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
    
    // Map difficulty to match DB constraint: 'Low', 'Medium', 'Intermediate', 'Advanced'
    let difficulty = "Medium";
    const rawDiff = String(q.difficulty || "medium").toLowerCase();
    if (rawDiff.includes("easy") || rawDiff.includes("simple") || rawDiff.includes("low")) difficulty = "Low";
    else if (rawDiff.includes("hard") || rawDiff.includes("difficult") || rawDiff.includes("advanced")) difficulty = "Advanced";
    else if (rawDiff.includes("intermediate")) difficulty = "Intermediate";
    
    result.push({
      question_number: num,
      question_text: String(q.question_text || q.text || q.question || ""),
      options,
      correct_answer: "", // Will be filled from answer key
      question_type: "mcq", // Default, will be updated when answer is applied
      explanation: String(q.explanation || q.solution || ""),
      difficulty,
      marks: Number(q.marks || q.mark || 4),
    });
  }
  
  return result.sort((a, b) => a.question_number - b.question_number);
}

/**
 * Find missing questions by comparing extracted questions against answer key
 */
function findMissingQuestions(
  extracted: Map<number, ExtractedQuestion>,
  answerKey: Map<number, string>
): number[] {
  const missing: number[] = [];
  for (const qNum of answerKey.keys()) {
    if (!extracted.has(qNum)) {
      missing.push(qNum);
    }
  }
  return missing.sort((a, b) => a - b);
}

/**
 * Split missing questions into smaller batches for more focused extraction
 */
function batchMissingQuestions(missingNumbers: number[], batchSize: number = 10): number[][] {
  const batches: number[][] = [];
  for (let i = 0; i < missingNumbers.length; i += batchSize) {
    batches.push(missingNumbers.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Find text segments around specific question numbers for targeted extraction
 */
function findRelevantTextForQuestions(fullText: string, targetNumbers: number[]): string {
  const segments: string[] = [];
  
  for (const qNum of targetNumbers) {
    // Look for content around this question number
    // Pattern to find question start
    const patterns = [
      new RegExp(`(?:^|\\n)\\s*(?:Q\\.?\\s*)?${qNum}\\s*[\\.\\)]`, 'gm'),
      new RegExp(`Question\\s*${qNum}`, 'gi'),
      new RegExp(`\\b${qNum}\\s*\\.\\s*[A-Z]`, 'gm'),
    ];
    
    for (const pattern of patterns) {
      const match = pattern.exec(fullText);
      if (match) {
        // Get 3000 chars around the match (1000 before, 2000 after)
        const start = Math.max(0, match.index - 1000);
        const end = Math.min(fullText.length, match.index + 2000);
        const segment = fullText.slice(start, end);
        
        // Avoid duplicating segments
        if (!segments.some(s => s.includes(segment.slice(500, 1000)))) {
          segments.push(segment);
        }
        break;
      }
    }
  }
  
  // If no specific segments found, return the full text (for broad search)
  if (segments.length === 0) {
    return fullText;
  }
  
  return segments.join("\n\n---SEGMENT BREAK---\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentJson, contentMarkdown, examName, year, paperType } = await req.json();
    
    console.log("=== Starting MCQ Extraction with Self-Correcting Loop ===");
    console.log(`Exam: ${examName}  Year: ${year} Type: ${paperType}`);

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
    
    // This is the expected question count (ground truth)
    const expectedQuestionCount = answerKey.size;
    console.log(`🎯 EXPECTED QUESTIONS: ${expectedQuestionCount} (from answer key)`);

    // Step 2: Split text into chunks for processing
    const chunks = chunkTextByQuestions(extractionText, 15000, 20);
    console.log(`Split text into ${chunks.length} chunks for extraction`);
    
    // Estimate from content patterns (backup)
    const estimatedFromContent = countQuestionsInText(extractionText);
    console.log(`Estimated questions from content patterns: ${estimatedFromContent}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // System prompt - includes expected count to guide extraction
    const systemPrompt = `You are an expert at extracting multiple choice questions from exam papers.

IMPORTANT RULES:
1. Extract ALL questions you find in this content
2. This paper contains ${expectedQuestionCount > 0 ? expectedQuestionCount : "multiple"} questions - try to find ALL of them
3. DO NOT guess or determine the correct answer - leave correct_answer as empty string ""
4. Extract question text exactly as written (preserve formatting, formulas)
5. IMPORTANT: JSON escaping: any backslash must be doubled (\\).
6. Extract all options A, B, C, D (and E if present)
7. If a question has an image reference, note it in the question text
8. Do not stop early - extract every single question you can find

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

    const errors: string[] = [];
    let chunksProcessed = 0;

    // Use tool-calling for structured output
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
     * Process a single chunk and return extracted questions
     */
    async function processChunk(
      chunk: string, 
      chunkIndex: number, 
      totalChunks: number,
      isRetry: boolean = false,
      targetQuestions?: number[] // For targeted extraction
    ): Promise<ExtractedQuestion[]> {
      const chunkLabel = isRetry 
        ? `Chunk ${chunkIndex + 1} (retry${targetQuestions ? ` for Q${targetQuestions.join(",")}` : ""})` 
        : `Chunk ${chunkIndex + 1}/${totalChunks}`;
      console.log(`Processing ${chunkLabel}, length: ${chunk.length}`);
      
      let userPrompt: string;
      
      if (targetQuestions && targetQuestions.length > 0) {
        // Targeted prompt for missing questions
        userPrompt = `CRITICAL: Find ONLY these specific questions that were missed: ${targetQuestions.join(", ")}

These question numbers exist in this exam paper but were not found in the previous extraction.
Search VERY carefully for each of these question numbers: ${targetQuestions.join(", ")}

Look for patterns like:
- "Q.${targetQuestions[0]}." or "${targetQuestions[0]}."
- "Question ${targetQuestions[0]}"
- Just the number "${targetQuestions[0]}" followed by a question

Extract ONLY questions with these numbers: ${targetQuestions.join(", ")}
DO NOT extract other questions. Focus on finding these missing ones.

Content:
${chunk}`;
      } else {
        // Standard extraction prompt
        userPrompt = `Extract ALL multiple choice questions from this ${examName} ${year} ${paperType || ""} exam paper content.
Remember: DO NOT determine correct answers - leave them empty. Just extract questions and options.
${expectedQuestionCount > 0 ? `This paper has ${expectedQuestionCount} total questions - make sure to find all of them.` : ""}

Content:
${chunk}`;
      }

      const maxRetries = 3;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            const waitTime = attempt * 2000;
            console.log(`${chunkLabel} - Retry ${attempt}/${maxRetries} after ${waitTime}ms...`);
            await delay(waitTime);
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
              max_tokens: 32000,
            }),
          });

          console.log(`${chunkLabel} - Gateway response status: ${response.status}`);

          if (response.status === 429) {
            if (attempt < maxRetries) {
              console.log(`${chunkLabel} - Rate limited, will retry...`);
              continue;
            }
            throw new Error("Rate limited after retries");
          }
          
          if (response.status === 402) {
            throw new Error("Credits exhausted");
          }

          if (!response.ok) {
            const errText = await response.text();
            console.error(`${chunkLabel} error:`, errText);
            if (attempt < maxRetries) continue;
            throw new Error(`API error ${response.status}`);
          }

          const data = await response.json();
          const message = data.choices?.[0]?.message;
          const toolArgs = message?.tool_calls?.[0]?.function?.arguments as string | undefined;
          const content = (message?.content as string | undefined) || "";

          if (toolArgs) {
            console.log(`${chunkLabel} - Tool args length: ${toolArgs.length}`);
          } else {
            console.log(`${chunkLabel} - LLM response length: ${content.length}`);
          }

          // Parse JSON from response
          let parsed: any = null;

          // Preferred: tool calling output
          if (toolArgs) {
            try {
              parsed = JSON.parse(toolArgs);
            } catch (e) {
              console.error(`${chunkLabel} - Tool args JSON parse error:`, e);
            }
          }

          // Fallback: parse from message.content
          if (!parsed && content) {
            try {
              let jsonText = content.trim();
              if (jsonText.startsWith("```")) {
                jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
              }
              
              const objectMatch = jsonText.match(/\{[\s\S]*\}/);
              if (objectMatch) {
                let jsonStr = objectMatch[0]
                  .replace(/\\u(?![0-9a-fA-F]{4})/g, "u")
                  .replace(/\\([^"\\\/bfnrtu])/g, "$1")
                  .replace(/[\x00-\x1F\x7F]/g, (char: string) => {
                    if (char === "\n") return "\\n";
                    if (char === "\r") return "\\r";
                    if (char === "\t") return "\\t";
                    return "";
                  });

                try {
                  parsed = JSON.parse(jsonStr);
                } catch {
                  // Aggressive cleanup
                  jsonStr = objectMatch[0]
                    .replace(/\\u(?![0-9a-fA-F]{4})/g, "u")
                    .replace(/\\(?!["\\/bfnrtu])/g, "")
                    .replace(/[\x00-\x1F\x7F]/g, "");
                  parsed = JSON.parse(jsonStr);
                }
              }
            } catch (parseErr) {
              console.error(`${chunkLabel} - JSON parse error:`, parseErr);
            }
          }

          if (parsed) {
            const rawQuestions = parsed.questions || (Array.isArray(parsed) ? parsed : []);
            if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
              const normalized = normalizeQuestions(rawQuestions);
              console.log(`${chunkLabel} - Extracted ${normalized.length} questions`);
              return normalized;
            }
          }
          
          console.log(`${chunkLabel} - No questions extracted from response`);
          return [];
          
        } catch (attemptErr) {
          if (attempt === maxRetries) {
            throw attemptErr;
          }
        }
      }
      
      return [];
    }

    /**
     * Targeted extraction for specific missing questions
     */
    async function extractMissingQuestions(
      fullText: string,
      missingNumbers: number[],
    ): Promise<ExtractedQuestion[]> {
      console.log(`\n🔍 TARGETED EXTRACTION for ${missingNumbers.length} missing questions: ${missingNumbers.join(", ")}`);
      
      const allRecovered: ExtractedQuestion[] = [];
      
      // Split into batches of 10 for more focused extraction
      const batches = batchMissingQuestions(missingNumbers, 10);
      console.log(`Split into ${batches.length} batches for targeted extraction`);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length}: Questions ${batch.join(", ")}`);
        
        // Find relevant text segments for these questions
        const relevantText = findRelevantTextForQuestions(fullText, batch);
        
        // Add delay between batches
        if (i > 0) {
          await delay(1500);
        }
        
        try {
          const recovered = await processChunk(relevantText, i, batches.length, true, batch);
          
          // Only accept questions that match our target list
          const validRecovered = recovered.filter(q => batch.includes(q.question_number));
          
          if (validRecovered.length > 0) {
            console.log(`✅ Batch ${i + 1} recovered ${validRecovered.length} questions: ${validRecovered.map(q => q.question_number).join(", ")}`);
            allRecovered.push(...validRecovered);
          } else {
            console.log(`❌ Batch ${i + 1} found 0 targeted questions`);
          }
        } catch (err) {
          console.error(`Batch ${i + 1} failed:`, err);
          errors.push(`Recovery batch ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }
      
      return allRecovered;
    }

    // ===== INITIAL EXTRACTION =====
    console.log("\n===== PHASE 1: INITIAL EXTRACTION =====");
    const allQuestions: ExtractedQuestion[] = [];

    // Process each chunk with delays and fallback logic
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Add delay between chunks (except first one)
      if (i > 0) {
        console.log(`Waiting 1.5s before processing chunk ${i + 1}...`);
        await delay(1500);
      }
      
      try {
        const extracted = await processChunk(chunk, i, chunks.length);
        
        // If chunk is large (>10KB) but returned 0 questions, try re-chunking
        if (extracted.length === 0 && chunk.length > 10000) {
          console.log(`Chunk ${i + 1} returned 0 questions for ${chunk.length} chars - attempting re-chunk...`);
          
          const subChunks = rechunkFailedContent(chunk);
          console.log(`Re-chunked into ${subChunks.length} smaller pieces`);
          
          for (let j = 0; j < subChunks.length; j++) {
            await delay(1000);
            try {
              const subExtracted = await processChunk(subChunks[j], j, subChunks.length, true);
              if (subExtracted.length > 0) {
                console.log(`Sub-chunk ${j + 1} extracted ${subExtracted.length} questions`);
                allQuestions.push(...subExtracted);
              }
            } catch (subErr) {
              console.error(`Sub-chunk ${j + 1} failed:`, subErr);
              errors.push(`Sub-chunk ${i + 1}.${j + 1}: ${subErr instanceof Error ? subErr.message : "Unknown error"}`);
            }
          }
        } else {
          allQuestions.push(...extracted);
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

    console.log(`\n📊 Initial extraction: ${questionMap.size}/${expectedQuestionCount} questions`);

    // ===== SELF-CORRECTING LOOP =====
    let recoveryAttempts = 0;
    let totalRecovered = 0;

    if (expectedQuestionCount > 0) {
      console.log("\n===== PHASE 2: SELF-CORRECTING RECOVERY LOOP =====");
      
      while (recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
        const missingNumbers = findMissingQuestions(questionMap, answerKey);
        
        if (missingNumbers.length === 0) {
          console.log(`\n🎉 100% EXTRACTION COMPLETE! All ${expectedQuestionCount} questions extracted.`);
          break;
        }
        
        console.log(`\n⚠️ Recovery Attempt ${recoveryAttempts + 1}/${MAX_RECOVERY_ATTEMPTS}`);
        console.log(`Missing ${missingNumbers.length} questions: ${missingNumbers.slice(0, 20).join(", ")}${missingNumbers.length > 20 ? "..." : ""}`);
        
        // Targeted extraction for missing questions
        const recovered = await extractMissingQuestions(extractionText, missingNumbers);
        
        // Merge recovered questions
        let newlyRecovered = 0;
        for (const q of recovered) {
          if (!questionMap.has(q.question_number)) {
            questionMap.set(q.question_number, q);
            newlyRecovered++;
          }
        }
        
        totalRecovered += newlyRecovered;
        console.log(`✅ Recovered ${newlyRecovered} new questions in attempt ${recoveryAttempts + 1}`);
        console.log(`📊 Current total: ${questionMap.size}/${expectedQuestionCount} questions`);
        
        recoveryAttempts++;
        
        // If no progress made, try a different approach or stop
        if (newlyRecovered === 0) {
          console.log("No new questions recovered in this attempt.");
          
          // For last attempts, try full text search with different strategies
          if (recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
            console.log("Will try again with different extraction strategy...");
            await delay(2000);
          } else {
            console.log("Max recovery attempts reached. Returning best result.");
          }
        }
      }
    }

    // ===== FINAL PROCESSING =====
    console.log("\n===== PHASE 3: FINAL PROCESSING =====");

    // Apply answer key to questions (NO AI - just mapping)
    console.log(`Applying answer key to ${questionMap.size} questions...`);
    let answersApplied = 0;
    const missingAnswers: number[] = [];
    
    for (const [qNum, question] of questionMap) {
      const answer = answerKey.get(qNum);
      if (answer) {
        question.correct_answer = answer;
        // Determine question type based on answer format
        if (/^[A-D]$/.test(answer)) {
          question.question_type = "mcq";
        } else {
          question.question_type = "integer";
        }
        answersApplied++;
      } else {
        missingAnswers.push(qNum);
      }
    }
    console.log(`Applied ${answersApplied} answers from answer key`);

    // Convert to sorted array and cap at MAX_QUESTIONS
    const finalQuestions = Array.from(questionMap.values())
      .sort((a, b) => a.question_number - b.question_number)
      .slice(0, MAX_QUESTIONS);

    // Calculate final statistics
    const stillMissing = expectedQuestionCount > 0 ? findMissingQuestions(questionMap, answerKey) : [];
    const completionRate = expectedQuestionCount > 0 
      ? `${Math.round((finalQuestions.length / expectedQuestionCount) * 100)}%`
      : "N/A";

    console.log(`\n===== EXTRACTION COMPLETE =====`);
    console.log(`📊 Final: ${finalQuestions.length}/${expectedQuestionCount} questions (${completionRate})`);
    console.log(`🔄 Recovery attempts: ${recoveryAttempts}`);
    console.log(`✅ Recovered in retries: ${totalRecovered}`);
    if (stillMissing.length > 0) {
      console.log(`❌ Still missing: ${stillMissing.slice(0, 20).join(", ")}${stillMissing.length > 20 ? "..." : ""}`);
    }

    const isComplete = expectedQuestionCount > 0 && finalQuestions.length >= expectedQuestionCount;
    const isPartial = expectedQuestionCount > 0 && finalQuestions.length < expectedQuestionCount * 0.95;

    const response: ExtractResponse = {
      success: finalQuestions.length > 0,
      questions: finalQuestions,
      questionsCount: finalQuestions.length,
      partial: isPartial || (errors.length > 0 && finalQuestions.length > 0),
      error: finalQuestions.length === 0 ? "No MCQs could be extracted" : 
             isPartial ? `Extracted ${finalQuestions.length} of ${expectedQuestionCount} expected questions (${completionRate})` : undefined,
      errorCode: finalQuestions.length === 0 ? "NO_QUESTIONS" : undefined,
      errors: errors.length > 0 ? errors : undefined,
      chunksProcessed,
      answerKeyStats: {
        found: answerKey.size,
        applied: answersApplied,
        missing: missingAnswers.slice(0, 20),
      },
      extractionStats: {
        expected: expectedQuestionCount,
        extracted: finalQuestions.length,
        recoveryAttempts,
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
