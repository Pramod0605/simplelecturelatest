import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fix LaTeX escaping issues in JSON response
function fixLatexEscaping(text: string): string {
  // Common LaTeX patterns that need double escaping for JSON
  const latexPatterns = [
    'frac', 'sqrt', 'times', 'div', 'pm', 'mp', 'cdot', 'ldots', 'cdots',
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'pi', 'sigma', 'omega',
    'Delta', 'Gamma', 'Lambda', 'Omega', 'Phi', 'Pi', 'Sigma', 'Theta',
    'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'lim', 'sum', 'prod', 'int',
    'left', 'right', 'begin', 'end', 'text', 'mathrm', 'mathbf', 'mathit',
    'leq', 'geq', 'neq', 'approx', 'equiv', 'propto',
    'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow',
    'infty', 'partial', 'nabla', 'prime',
    'over', 'under', 'hat', 'bar', 'vec', 'dot',
    'circ', 'degree', 'angle', 'perp', 'parallel',
    'quad', 'qquad', 'hspace', 'vspace',
    'boxed', 'cancel', 'bcancel',
  ];
  
  let fixed = text;
  
  // Fix single backslashes before LaTeX commands (but not already escaped)
  for (const pattern of latexPatterns) {
    // Match \pattern that's not \\pattern
    const regex = new RegExp(`(?<!\\\\)\\\\${pattern}`, 'g');
    fixed = fixed.replace(regex, `\\\\${pattern}`);
  }
  
  // Fix common escape sequences
  fixed = fixed.replace(/(?<!\\)\\n(?!ew|abla|eq|u)/g, '\\\\n');
  fixed = fixed.replace(/(?<!\\)\\t(?!ext|imes|an|heta)/g, '\\\\t');
  fixed = fixed.replace(/(?<!\\)\\r(?!ight|arrow)/g, '\\\\r');
  
  // Fix curly braces in LaTeX
  fixed = fixed.replace(/\\{/g, '\\\\{');
  fixed = fixed.replace(/\\}/g, '\\\\}');
  
  return fixed;
}

// Extract JSON array from text using regex fallback
function extractJsonArray(text: string): any[] | null {
  // Try to find JSON array boundaries
  const startIdx = text.indexOf('[');
  const endIdx = text.lastIndexOf(']');
  
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }
  
  const jsonStr = text.substring(startIdx, endIdx + 1);
  
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try with LaTeX fixing
    try {
      return JSON.parse(fixLatexEscaping(jsonStr));
    } catch {
      return null;
    }
  }
}

// Extract individual questions using regex when full JSON parsing fails
function extractQuestionsWithRegex(text: string): any[] {
  const questions: any[] = [];
  
  // Pattern to find question objects
  const questionRegex = /\{[^{}]*"question_text"\s*:\s*"[^"]*(?:\\"[^"]*)*"[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
  const matches = text.matchAll(questionRegex);
  
  for (const match of matches) {
    try {
      // Try to parse each match
      let jsonStr = match[0];
      // Ensure proper closing
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      
      if (openBraces > closeBraces) {
        jsonStr += '}'.repeat(openBraces - closeBraces);
      }
      
      const q = JSON.parse(jsonStr);
      if (q.question_text) {
        questions.push(q);
      }
    } catch {
      // Try with fixed LaTeX
      try {
        const fixed = fixLatexEscaping(match[0]);
        const q = JSON.parse(fixed);
        if (q.question_text) {
          questions.push(q);
        }
      } catch {
        // Skip this question
      }
    }
  }
  
  return questions;
}

// Split content into chunks for large documents
function chunkContent(content: string, maxSize: number = 50000): string[] {
  if (content.length <= maxSize) {
    return [content];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  const lines = content.split('\n');
  
  for (const line of lines) {
    if ((currentChunk.length + line.length + 1) > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

async function extractFromChunk(
  chunk: string,
  examName: string,
  year: number,
  paperType: string,
  apiKey: string,
  chunkIndex: number,
  totalChunks: number
): Promise<any[]> {
  const chunkContext = totalChunks > 1 
    ? `\n\nNote: This is part ${chunkIndex + 1} of ${totalChunks} of the document.` 
    : '';

  const extractionPrompt = `You are an expert at extracting Multiple Choice Questions (MCQs) from exam papers.

Analyze this content and extract ALL multiple choice questions with their correct answers.${chunkContext}

CRITICAL JSON FORMATTING RULES:
1. Return ONLY a valid JSON array - no markdown, no explanation
2. For LaTeX math: use DOUBLE backslashes (e.g., "\\\\frac{1}{2}", "\\\\sqrt{x}")
3. Escape quotes inside strings with backslash
4. Every question MUST have all required fields

GUIDELINES:
1. Extract EVERY MCQ you find
2. Match questions to answers from answer keys if present
3. Normalize options to A, B, C, D format
4. Determine difficulty: easy (basic recall), medium (single concept), hard (multi-step)

Required JSON format for each question:
{
  "question_number": 1,
  "question_text": "Complete question text",
  "options": {
    "A": { "text": "First option" },
    "B": { "text": "Second option" },
    "C": { "text": "Third option" },
    "D": { "text": "Fourth option" }
  },
  "correct_answer": "A",
  "explanation": "Explanation or empty string",
  "difficulty": "medium",
  "marks": 4
}

EXAM: ${examName} ${year} ${paperType || ""}

Content:
${chunk}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { 
          role: "system", 
          content: "You are an MCQ extraction expert. Return ONLY valid JSON arrays. For LaTeX, always use double backslashes (\\\\). No markdown formatting, no explanatory text - just the JSON array." 
        },
        { role: "user", content: extractionPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Chunk ${chunkIndex + 1} API error:`, response.status, errorText);
    throw { status: response.status, message: errorText };
  }

  const data = await response.json();
  const llmResponse = data.choices?.[0]?.message?.content || "[]";
  
  console.log(`Chunk ${chunkIndex + 1} response length:`, llmResponse.length);
  
  return parseQuestions(llmResponse);
}

function parseQuestions(llmResponse: string): any[] {
  // Clean the response - remove markdown code blocks
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
  
  // Attempt 1: Direct parse
  try {
    const parsed = JSON.parse(cleanedResponse);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.log("Direct parse failed, trying fixes...");
  }
  
  // Attempt 2: Extract JSON array
  const extracted = extractJsonArray(cleanedResponse);
  if (extracted && extracted.length > 0) {
    console.log("Extracted JSON array successfully");
    return extracted;
  }
  
  // Attempt 3: Fix LaTeX and parse
  try {
    const fixed = fixLatexEscaping(cleanedResponse);
    const parsed = JSON.parse(fixed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.log("LaTeX fix parse failed, trying regex extraction...");
  }
  
  // Attempt 4: Regex extraction
  const regexExtracted = extractQuestionsWithRegex(cleanedResponse);
  if (regexExtracted.length > 0) {
    console.log(`Regex extracted ${regexExtracted.length} questions`);
    return regexExtracted;
  }
  
  console.log("All parsing methods failed");
  return [];
}

function normalizeQuestions(extractedQuestions: any[]): any[] {
  return extractedQuestions.map((q, index) => {
    // Normalize options format
    let options: Record<string, { text: string }> = {};
    
    if (Array.isArray(q.options)) {
      const keys = ["A", "B", "C", "D"];
      q.options.forEach((opt: any, i: number) => {
        if (i < 4) {
          options[keys[i]] = { text: typeof opt === "string" ? opt : opt.text || String(opt) };
        }
      });
    } else if (typeof q.options === "object" && q.options) {
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
    let correctAnswer = q.correct_answer || q.answer || "";
    if (correctAnswer) {
      correctAnswer = String(correctAnswer).toUpperCase().replace(/[()]/g, "").trim();
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
  }).filter(q => q.question_text && q.question_text.trim().length > 0);
}

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

    // Convert JSON content to string
    const jsonString = typeof contentJson === "string" 
      ? contentJson 
      : JSON.stringify(contentJson, null, 2);

    console.log("=== Starting MCQ Extraction ===");
    console.log("Exam:", examName, "Year:", year, "Type:", paperType);
    console.log("Content length:", jsonString.length, "characters");

    // Split into chunks for large documents
    const chunks = chunkContent(jsonString, 50000);
    console.log(`Processing ${chunks.length} chunk(s)`);

    let allQuestions: any[] = [];
    let errors: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
        const chunkQuestions = await extractFromChunk(
          chunks[i],
          examName,
          year,
          paperType,
          LOVABLE_API_KEY,
          i,
          chunks.length
        );
        console.log(`Chunk ${i + 1} extracted ${chunkQuestions.length} questions`);
        allQuestions.push(...chunkQuestions);
      } catch (err: any) {
        console.error(`Error processing chunk ${i + 1}:`, err);
        
        if (err.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: "Rate limit exceeded, please try again later",
              questions: normalizeQuestions(allQuestions),
              questionsCount: allQuestions.length,
              partial: true
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (err.status === 402) {
          return new Response(
            JSON.stringify({ 
              error: "API credits exhausted, please add credits",
              questions: normalizeQuestions(allQuestions),
              questionsCount: allQuestions.length,
              partial: true
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        errors.push(`Chunk ${i + 1}: ${err.message || 'Unknown error'}`);
      }
    }

    // Normalize all questions
    const normalizedQuestions = normalizeQuestions(allQuestions);
    
    // Remove duplicates based on question number
    const uniqueQuestions = normalizedQuestions.reduce((acc, q) => {
      const existingIdx = acc.findIndex((existing: any) => existing.question_number === q.question_number);
      if (existingIdx === -1) {
        acc.push(q);
      }
      return acc;
    }, [] as any[]);

    // Sort by question number
    uniqueQuestions.sort((a: any, b: any) => a.question_number - b.question_number);

    console.log(`=== Extraction Complete ===`);
    console.log(`Total extracted: ${uniqueQuestions.length} unique questions`);
    if (errors.length > 0) {
      console.log(`Errors encountered: ${errors.join('; ')}`);
    }

    return new Response(
      JSON.stringify({ 
        success: uniqueQuestions.length > 0, 
        questions: uniqueQuestions,
        questionsCount: uniqueQuestions.length,
        chunksProcessed: chunks.length,
        errors: errors.length > 0 ? errors : undefined
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
