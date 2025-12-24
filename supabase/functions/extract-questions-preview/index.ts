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
    
    if (qNum < 1 || qNum > 300) continue;
    
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
    
    if (qNum >= 1 && qNum <= 300 && /^[A-D]$/.test(answer)) {
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
      
      if (qNum >= 1 && qNum <= 300 && /^[A-D]$/.test(answer) && !answerMap.has(qNum)) {
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
      
      if (qNum >= 1 && qNum <= 300 && !answerMap.has(qNum)) {
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
      
      if (qNum >= 1 && qNum <= 300 && !answerMap.has(qNum)) {
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
4. IMPORTANT: JSON escaping: any backslash must be doubled (\\).
5. Extract all options A, B, C, D (and E if present)
6. If a question has an image reference, note it in the question text

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

    // Use tool-calling so the model returns structured data (avoids invalid JSON escapes from LaTeX like \\underline)
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
            tools,
            tool_choice,
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
        const message = data.choices?.[0]?.message;
        const toolArgs = message?.tool_calls?.[0]?.function?.arguments as string | undefined;
        const content = (message?.content as string | undefined) || "";

        if (toolArgs) {
          console.log(`Chunk ${i + 1} - Tool args length: ${toolArgs.length}`);
        } else {
          console.log(`Chunk ${i + 1} - LLM response length: ${content.length}`);
        }

        // Parse JSON from response
        let parsed: any = null;

        // Preferred: tool calling output
        if (toolArgs) {
          try {
            parsed = JSON.parse(toolArgs);
          } catch (e) {
            console.error(`Chunk ${i + 1} - Tool args JSON parse error:`, e);
            errors.push(`Chunk ${i + 1}: Failed to parse tool output`);
          }
        }

        // Fallback: parse from message.content
        if (!parsed) {
          try {
          // Clean up response - remove markdown code blocks if present
          let jsonText = content.trim();
          if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          }
          
          // Try to find JSON object or array in response
          const objectMatch = jsonText.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            let jsonStr = objectMatch[0];
            
            // Sanitize JSON to fix common escape issues from LLM responses
            // Fix invalid escape sequences: \x, \', and especially invalid unicode escapes like \underline (\u + non-hex)
            jsonStr = jsonStr
              // Fix invalid \u escapes that are common in LaTeX commands (e.g. \underline, \uparrow)
              // Keep real unicode escapes like \u00B0 intact
              .replace(/\\u(?![0-9a-fA-F]{4})/g, "u")
              // Fix invalid escapes like \p, \d, \s, etc. - remove the backslash
              .replace(/\\([^"\\\/bfnrtu])/g, "$1")
              // Fix unescaped control characters
              .replace(/[\x00-\x1F\x7F]/g, (char: string) => {
                if (char === "\n") return "\\n";
                if (char === "\r") return "\\r";
                if (char === "\t") return "\\t";
                return ""; // Remove other control characters
              });

            try {
              parsed = JSON.parse(jsonStr);
            } catch (firstParseErr) {
              // Second attempt: more aggressive cleanup
              console.log(`Chunk ${i + 1} - First parse failed, trying aggressive cleanup...`);

              // Remove all backslashes before non-standard escape chars (and invalid \u escapes)
              jsonStr = objectMatch[0]
                .replace(/\\u(?![0-9a-fA-F]{4})/g, "u")
                .replace(/\\(?!["\\/bfnrtu])/g, "")
                .replace(/[\x00-\x1F\x7F]/g, "");

              try {
                parsed = JSON.parse(jsonStr);
                console.log(`Chunk ${i + 1} - Aggressive cleanup succeeded`);
              } catch (secondParseErr) {
                // Third attempt: extract questions array directly with regex
                console.log(`Chunk ${i + 1} - Second parse failed, trying regex extraction...`);

                const questionsMatch = jsonText.match(/"questions"\s*:\s*\[/);
                if (questionsMatch) {
                  // Find the matching closing bracket
                  const startIdx = jsonText.indexOf("[", questionsMatch.index);
                  let bracketCount = 0;
                  let endIdx = startIdx;

                  for (let j = startIdx; j < jsonText.length; j++) {
                    if (jsonText[j] === "[") bracketCount++;
                    else if (jsonText[j] === "]") {
                      bracketCount--;
                      if (bracketCount === 0) {
                        endIdx = j + 1;
                        break;
                      }
                    }
                  }

                  if (endIdx > startIdx) {
                    const arrStr = jsonText
                      .slice(startIdx, endIdx)
                      .replace(/\\u(?![0-9a-fA-F]{4})/g, "u")
                      .replace(/\\(?!["\\/bfnrtu])/g, "")
                      .replace(/[\x00-\x1F\x7F]/g, "");
                    try {
                      const arr = JSON.parse(arrStr);
                      if (Array.isArray(arr)) {
                        parsed = { questions: arr };
                        console.log(
                          `Chunk ${i + 1} - Regex extraction succeeded with ${arr.length} questions`,
                        );
                      }
                    } catch (e) {
                      // Give up on this chunk
                    }
                  }
                }
                
                if (!parsed) {
                  throw secondParseErr;
                }
              }
            }
          }
          } catch (parseErr) {
            console.error(`Chunk ${i + 1} - JSON parse error:`, parseErr);
            errors.push(`Chunk ${i + 1}: Failed to parse response`);
          }
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
    console.log(`MCQ answers: ${Array.from(questionMap.values()).filter(q => q.question_type === "mcq").length}`);
    console.log(`Integer answers: ${Array.from(questionMap.values()).filter(q => q.question_type === "integer").length}`);
    
    if (missingAnswers.length > 0 && missingAnswers.length <= 30) {
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
