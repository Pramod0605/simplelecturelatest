import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum questions to extract - papers can have 1-200 questions
const MAX_QUESTIONS = 200;
// Number of parallel chunks to process
const CHUNK_COUNT = 6;
// Maximum recovery attempts per chunk
const MAX_CHUNK_RECOVERY_ATTEMPTS = 3;
// Questions to target per recovery call
const RECOVERY_BATCH_SIZE = 10;
// Chunk overlap in characters - INCREASED from 500 to 3000
const CHUNK_OVERLAP = 3000;
// Global recovery threshold - INCREASED from 25 to 50
const GLOBAL_RECOVERY_THRESHOLD = 50;

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
 * Find all question positions with improved patterns
 */
function findQuestionPositions(text: string): { index: number; qNum: number }[] {
  const positions: { index: number; qNum: number }[] = [];
  const seen = new Set<number>();
  
  // Multiple patterns to catch different question formats
  const patterns = [
    /(?:^|\n)\s*(?:Q|Question)\s*\.?\s*(\d{1,3})\s*[\.\):\-]/gmi,  // Q1. Q.1 Question 1
    /(?:^|\n)\s*(\d{1,3})\s*\.\s+[A-Z]/gm,                          // 1. A sentence...
    /(?:^|\n)\s*(\d{1,3})\s*\)\s+/gm,                               // 1) 
    /(?:^|\n)\s*\((\d{1,3})\)\s+/gm,                                // (1)
    /(?:^|\n)\s*(\d{1,3})\s*[\.\)]\s*(?:Match|Which|What|If|A|The|In|For|Consider)/gmi, // 1. Match...
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const qNum = parseInt(match[1], 10);
      if (qNum >= 1 && qNum <= MAX_QUESTIONS && !seen.has(qNum)) {
        seen.add(qNum);
        positions.push({ index: match.index, qNum });
      }
    }
  }
  
  // Sort by position in text
  return positions.sort((a, b) => a.index - b.index);
}

/**
 * Create smart chunks with expected question ranges - IMPROVED with more overlap
 */
function createSmartChunks(
  text: string, 
  totalQuestions: number,
  answerKey: Map<number, string>
): ChunkWithRange[] {
  const chunks: ChunkWithRange[] = [];
  const questionsPerChunk = Math.ceil(totalQuestions / CHUNK_COUNT);
  
  // Find all question positions with improved detection
  const questionPositions = findQuestionPositions(text);
  console.log(`Found ${questionPositions.length} question markers in text`);
  
  // If we found enough markers, use position-based chunking with HEAVY overlap
  if (questionPositions.length >= CHUNK_COUNT * 2) {
    for (let i = 0; i < CHUNK_COUNT; i++) {
      const rangeStart = i * questionsPerChunk + 1;
      const rangeEnd = Math.min((i + 1) * questionsPerChunk, totalQuestions);
      const expectedRange = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, j) => rangeStart + j);
      
      // Find text boundaries - look for questions just before and after range
      const startQ = questionPositions.find(p => p.qNum >= rangeStart - 2);
      const endQ = questionPositions.find(p => p.qNum > rangeEnd + 2);
      
      // Use generous overlap on both sides
      let chunkStart = startQ ? Math.max(0, startQ.index - CHUNK_OVERLAP) : (i * Math.ceil(text.length / CHUNK_COUNT));
      let chunkEnd = endQ ? Math.min(text.length, endQ.index + CHUNK_OVERLAP) : Math.min(text.length, ((i + 1) * Math.ceil(text.length / CHUNK_COUNT)) + CHUNK_OVERLAP);
      
      // Find paragraph boundaries to avoid cutting mid-sentence
      const beforeStart = text.lastIndexOf('\n\n', chunkStart + 100);
      if (beforeStart > chunkStart - 500 && beforeStart > 0) {
        chunkStart = beforeStart;
      }
      
      const afterEnd = text.indexOf('\n\n', chunkEnd - 100);
      if (afterEnd !== -1 && afterEnd < chunkEnd + 500) {
        chunkEnd = afterEnd;
      }
      
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
  } else {
    // Fallback: split by character count with MUCH MORE overlap
    const baseChunkSize = Math.ceil(text.length / CHUNK_COUNT);
    const overlapSize = CHUNK_OVERLAP;
    
    for (let i = 0; i < CHUNK_COUNT; i++) {
      const rangeStart = i * questionsPerChunk + 1;
      const rangeEnd = Math.min((i + 1) * questionsPerChunk, totalQuestions);
      const expectedRange = Array.from({ length: rangeEnd - rangeStart + 1 }, (_, j) => rangeStart + j);
      
      // Calculate chunk boundaries with overlap
      const start = Math.max(0, i * baseChunkSize - overlapSize);
      const end = Math.min(text.length, (i + 1) * baseChunkSize + overlapSize);
      
      const chunkText = text.slice(start, end);
      
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
  }
  
  console.log(`Created ${chunks.length} smart chunks with ${CHUNK_OVERLAP} char overlap`);
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
    
    console.log("=== Starting IMPROVED MCQ Extraction ===");
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
     * Process a single chunk with the AI - IMPROVED prompts
     */
    async function callAI(
      chunkText: string,
      expectedRange: number[],
      isRecovery: boolean = false,
      targetQuestions?: number[],
      temperature: number = 0.1
    ): Promise<ExtractedQuestion[]> {
      const rangeStr = expectedRange.length > 0 
        ? `Questions ${expectedRange[0]}-${expectedRange[expectedRange.length - 1]}`
        : "Questions";
      
      let systemPrompt: string;
      let userPrompt: string;
      
      if (isRecovery && targetQuestions && targetQuestions.length > 0) {
        // IMPROVED recovery prompt - more explicit and structured
        systemPrompt = `You are an expert exam paper parser. Your task is to find SPECIFIC questions from an exam document.

CRITICAL INSTRUCTIONS:
1. You MUST find questions numbered: ${targetQuestions.join(", ")}
2. Search for patterns like: "Q${targetQuestions[0]}.", "${targetQuestions[0]}.", "(${targetQuestions[0]})", "Question ${targetQuestions[0]}"
3. Each question has 4 options (A, B, C, D)
4. Extract the EXACT text - do not paraphrase
5. If a question has math/formulas, preserve them exactly

Return format:
{
  "questions": [
    {
      "question_number": 16,
      "question_text": "The full question text...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "difficulty": "Medium",
      "marks": 4
    }
  ]
}`;
        
        userPrompt = `FIND THESE SPECIFIC QUESTIONS: ${targetQuestions.join(", ")}

Look carefully for each question number. Common patterns:
- "Q16." or "16." at start of line
- "(16)" or "16)" 
- "Question 16:"

IMPORTANT: Extract ALL ${targetQuestions.length} questions listed above. Do not skip any.

Document content:
${chunkText}`;
      } else {
        // IMPROVED initial extraction prompt
        systemPrompt = `You are an expert MCQ extractor for ${examName} exam papers.

EXTRACTION RULES:
1. Extract ALL questions from ${rangeStr}
2. Preserve exact question text including formulas, symbols, special characters
3. Extract all 4 options (A, B, C, D) for each question
4. DO NOT determine correct answers - leave blank
5. Look for question patterns: "Q1.", "1.", "(1)", "Question 1"
6. Difficulty: estimate as Low/Medium/Advanced based on complexity
7. Marks: typically 4 for MCQ, 2-4 for integer type

CRITICAL: You MUST extract ALL questions in the range ${rangeStr}. Missing questions is not acceptable.

Return structured JSON with the questions array.`;
        
        userPrompt = `Extract ${rangeStr} from this ${examName} ${year} ${paperType || ""} exam paper.

YOU MUST FIND AND EXTRACT THESE QUESTION NUMBERS: ${expectedRange.join(", ")}

Search the entire content carefully. Questions may use different formats:
- "Q16. Which of the following..."
- "16. Consider the reaction..."
- "(16) A ball is thrown..."

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
              temperature: temperature + (attempt * 0.1), // Increase temp on retries
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
     * Process a single chunk with AGGRESSIVE recovery
     */
    async function processChunkWithRecovery(chunk: ChunkWithRange, fullText: string): Promise<ChunkResult> {
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
      
      // Check extraction rate
      const extractionRate = questionMap.size / expectedRange.length;
      const missing = expectedRange.filter(n => !questionMap.has(n) && answerKeySlice.has(n));
      
      // AGGRESSIVE recovery if less than 80% extracted
      if (missing.length > 0) {
        console.log(`   Chunk ${chunkIndex + 1}: Missing ${missing.length} questions (${Math.round(extractionRate * 100)}% rate), attempting recovery...`);
        
        // More recovery attempts for badly failed chunks
        const maxAttempts = extractionRate < 0.5 ? MAX_CHUNK_RECOVERY_ATTEMPTS : 2;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const currentMissing = expectedRange.filter(n => !questionMap.has(n) && answerKeySlice.has(n));
          if (currentMissing.length === 0) break;
          
          try {
            await delay(300 + attempt * 300);
            
            // For very poor extraction, try with extended context
            let recoveryText = text;
            if (extractionRate < 0.3 && attempt > 0) {
              // Use a broader portion of the full text
              const chunkCenter = Math.floor(fullText.length * (chunkIndex + 0.5) / CHUNK_COUNT);
              const extendedStart = Math.max(0, chunkCenter - 15000);
              const extendedEnd = Math.min(fullText.length, chunkCenter + 15000);
              recoveryText = fullText.slice(extendedStart, extendedEnd);
              console.log(`   Chunk ${chunkIndex + 1}: Using extended context (${recoveryText.length} chars)`);
            }
            
            // Process in smaller batches for recovery
            const batchSize = attempt === 0 ? RECOVERY_BATCH_SIZE : Math.min(5, currentMissing.length);
            const batch = currentMissing.slice(0, batchSize);
            
            const recovered = await callAI(recoveryText, expectedRange, true, batch, 0.2 + attempt * 0.1);
            
            let newlyRecovered = 0;
            for (const q of recovered) {
              if (currentMissing.includes(q.question_number) && !questionMap.has(q.question_number)) {
                questionMap.set(q.question_number, q);
                newlyRecovered++;
              }
            }
            
            totalRecovered += newlyRecovered;
            console.log(`   Chunk ${chunkIndex + 1}: Recovery attempt ${attempt + 1} got ${newlyRecovered}/${batch.length} questions`);
            
            // If recovery is working, continue; if not, try different approach
            if (newlyRecovered === 0 && attempt < maxAttempts - 1) {
              // Try with higher temperature
              continue;
            }
          } catch (err) {
            errors.push(`Chunk ${chunkIndex + 1} recovery ${attempt + 1}: ${err instanceof Error ? err.message : "Unknown"}`);
            // Don't break - try next attempt with different params
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
      delay(i * 200).then(() => processChunkWithRecovery(chunk, extractionText))
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

    // ===== PHASE 2.5: GLOBAL RECOVERY - IMPROVED with higher threshold =====
    const globalMissing = Array.from(answerKey.keys()).filter(n => !questionMap.has(n));
    
    // Increased threshold from 25 to 50
    if (globalMissing.length > 0 && globalMissing.length <= GLOBAL_RECOVERY_THRESHOLD) {
      console.log(`\n===== PHASE 2.5: GLOBAL RECOVERY =====`);
      console.log(`Attempting global recovery for ${globalMissing.length} missing questions`);
      
      // Split missing into batches and try multiple times
      const globalBatchSize = 15;
      let globalNewlyRecovered = 0;
      
      for (let batchStart = 0; batchStart < globalMissing.length; batchStart += globalBatchSize) {
        const batch = globalMissing.slice(batchStart, batchStart + globalBatchSize);
        const stillMissingInBatch = batch.filter(n => !questionMap.has(n));
        
        if (stillMissingInBatch.length === 0) continue;
        
        try {
          await delay(300);
          
          // Try different portions of the text for each batch
          let recoveryText: string;
          if (batchStart === 0) {
            // First batch - use end of document
            recoveryText = extractionText.slice(-50000);
          } else if (batchStart < globalMissing.length / 2) {
            // Middle batches - use full document middle
            const midStart = Math.floor(extractionText.length * 0.2);
            const midEnd = Math.floor(extractionText.length * 0.8);
            recoveryText = extractionText.slice(midStart, midEnd);
          } else {
            // Later batches - use start of document
            recoveryText = extractionText.slice(0, 50000);
          }
          
          console.log(`   Global batch ${Math.floor(batchStart / globalBatchSize) + 1}: Looking for ${stillMissingInBatch.join(", ")}`);
          
          const recovered = await callAI(recoveryText, stillMissingInBatch, true, stillMissingInBatch, 0.2);
          
          for (const q of recovered) {
            if (stillMissingInBatch.includes(q.question_number) && !questionMap.has(q.question_number)) {
              questionMap.set(q.question_number, q);
              globalNewlyRecovered++;
              totalRecovered++;
            }
          }
        } catch (err) {
          console.error(`Global batch recovery failed:`, err);
        }
      }
      
      console.log(`Global recovery: Found ${globalNewlyRecovered} additional questions`);
      
      // Second pass - full document scan for remaining
      const stillMissingAfterGlobal = Array.from(answerKey.keys()).filter(n => !questionMap.has(n));
      if (stillMissingAfterGlobal.length > 0 && stillMissingAfterGlobal.length <= 20) {
        console.log(`\nSecond global pass for ${stillMissingAfterGlobal.length} questions...`);
        try {
          await delay(500);
          const secondRecovered = await callAI(extractionText, stillMissingAfterGlobal, true, stillMissingAfterGlobal, 0.3);
          
          for (const q of secondRecovered) {
            if (stillMissingAfterGlobal.includes(q.question_number) && !questionMap.has(q.question_number)) {
              questionMap.set(q.question_number, q);
              totalRecovered++;
            }
          }
        } catch (err) {
          console.error(`Second global pass failed:`, err);
        }
      }
    } else if (globalMissing.length > GLOBAL_RECOVERY_THRESHOLD) {
      console.log(`\n⚠️ Skipping global recovery: ${globalMissing.length} missing questions exceeds threshold of ${GLOBAL_RECOVERY_THRESHOLD}`);
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
        recoveryAttempts: smartChunks.length,
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
