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

function safeJsonParse(input: unknown): unknown | null {
  if (typeof input !== "string") return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function looksLikeBase64(s: string) {
  return s.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(s);
}

function looksLikeUrl(s: string) {
  return /^https?:\/\//i.test(s) || /^data:/i.test(s);
}

function shouldKeepText(s: string) {
  const t = s.trim();
  if (t.length < 3) return false;
  // Avoid runaway payloads, but keep longer blocks that clearly contain questions.
  if (t.length > 30_000) return false;
  if (looksLikeUrl(t)) return false;
  if (looksLikeBase64(t)) return false;
  // Keep lines/blocks that look like questions/options/answers
  return /\?|\bQ\s*\d+\b|\bAns\b|\([A-D]\)|\bA\.|\bB\.|\bC\.|\bD\.|\bOption\b|<\s*b\s*>\s*Q\d+\s*\.|<\s*ol\b|<\s*li\b/i.test(t) || t.length >= 12;
}

function collectText(node: unknown, out: string[], depth = 0) {
  if (depth > 12) return;
  if (typeof node === "string") {
    const t = node.trim();
    if (!shouldKeepText(t)) return;

    // If we get a big HTML block (common in Marker output), keep both head+tail.
    if (t.length > 6000) {
      out.push(t.slice(0, 6000));
      out.push(t.slice(-6000));
      return;
    }

    out.push(t);
    return;
  }
  if (typeof node !== "object" || node === null) return;

  if (Array.isArray(node)) {
    for (const item of node) collectText(item, out, depth + 1);
    return;
  }

  const obj = node as Record<string, unknown>;
  // Prioritize common text keys
  const priorityKeys = ["html", "text", "content", "value", "title", "raw_text", "plain_text"];
  for (const k of priorityKeys) {
    const v = obj[k];
    if (typeof v === "string") {
      const t = v.trim();
      if (shouldKeepText(t)) out.push(t.length > 6000 ? t.slice(0, 6000) : t);
    }
  }
  for (const v of Object.values(obj)) collectText(v, out, depth + 1);
}

function buildExtractionText(contentJson: unknown) {
  const parsed = safeJsonParse(contentJson);
  const root = parsed ?? contentJson;

  const lines: string[] = [];
  collectText(root, lines);

  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const l of lines) {
    const key = l.replace(/\s+/g, " ").trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(l);
  }

  const joined = uniq.join("\n");

  // Include start + end so we capture both questions and answer key
  const head = joined.slice(0, 120_000);
  const tail = joined.length > 180_000 ? joined.slice(-80_000) : "";

  return tail
    ? `${head}\n\n--- END OF DOCUMENT (answer key often here) ---\n${tail}`
    : head;
}

function normalizeQuestions(raw: any[]): ExtractedQuestion[] {
  const normalized = raw
    .map((q, index) => {
      let options: Record<string, ExtractedOption> = {};

      if (Array.isArray(q.options)) {
        const keys = ["A", "B", "C", "D"];
        q.options.forEach((opt: any, i: number) => {
          if (i < 4) {
            options[keys[i]] = {
              text: typeof opt === "string" ? opt : opt?.text || String(opt),
            };
          }
        });
      } else if (q.options && typeof q.options === "object") {
        Object.entries(q.options).forEach(([key, val]: [string, any]) => {
          const normalizedKey = key.toUpperCase().replace(/[()]/g, "").trim();
          if (["A", "B", "C", "D"].includes(normalizedKey)) {
            options[normalizedKey] = {
              text: typeof val === "string" ? val : val?.text || String(val),
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

      return {
        question_number: Number(q.question_number ?? index + 1),
        question_text: String(q.question_text ?? q.question ?? ""),
        options,
        correct_answer: correctAnswer,
        explanation: String(q.explanation ?? ""),
        difficulty: (q.difficulty === "easy" || q.difficulty === "hard" ? q.difficulty : "medium"),
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

async function callGatewayWithTool({
  apiKey,
  examName,
  year,
  paperType,
  extractionText,
}: {
  apiKey: string;
  examName: string;
  year: number;
  paperType?: string;
  extractionText: string;
}): Promise<{ questions: any[]; usedTool: boolean; rawPreview: string }> {
  const system =
    "You extract MCQs from exam papers. Never answer academic questions; just extract MCQs. Return structured output via the provided tool call.";

  const user = `EXAM CONTEXT: ${examName} ${year} ${paperType || ""}\n\n` +
    "Extract ALL multiple-choice questions (MCQs) you can find. " +
    "For each question, return options in the same order they appear (usually 4 options). " +
    "If an answer key exists, match it. If unsure about an answer, leave correct_answer as an empty string.\n\n" +
    "Content (condensed from parsed PDF):\n" +
    extractionText;

  const body: any = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: 6000,
    tools: [
      {
        type: "function",
        function: {
          name: "extract_mcqs",
          description: "Extract MCQs with options and answers from exam text.",
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
                      type: "array",
                      description: "Options in order as they appear (usually 4 items)",
                      minItems: 2,
                      maxItems: 6,
                      items: { type: "string" },
                    },
                    correct_answer: {
                      type: "string",
                      description: "A, B, C, D or 1, 2, 3, 4 or empty string if unknown",
                    },
                    explanation: { type: "string" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    marks: { type: "number" },
                  },
                  required: [
                    "question_number",
                    "question_text",
                    "options",
                    "correct_answer",
                    "explanation",
                    "difficulty",
                    "marks",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "extract_mcqs" } },
  };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  const rawPreview = text.slice(0, 500);

  if (!resp.ok) {
    throw { status: resp.status, bodyText: text };
  }

  const data = JSON.parse(text);
  const toolArgs = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments as
    | string
    | Record<string, unknown>
    | undefined;

  if (toolArgs) {
    const args = typeof toolArgs === "string" ? JSON.parse(toolArgs) : toolArgs;
    const questions = Array.isArray((args as any)?.questions) ? (args as any).questions : [];
    return { questions, usedTool: true, rawPreview };
  }

  // Fallback: sometimes providers return plain JSON content
  const content = data?.choices?.[0]?.message?.content as string | undefined;
  if (content) {
    try {
      const parsed = JSON.parse(content);
      return { questions: Array.isArray(parsed) ? parsed : [parsed], usedTool: false, rawPreview };
    } catch {
      return { questions: [], usedTool: false, rawPreview };
    }
  }

  return { questions: [], usedTool: false, rawPreview };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentJson, examName, year, paperType } = await req.json();

    if (!contentJson) {
      const res: ExtractResponse = {
        success: false,
        questions: [],
        questionsCount: 0,
        error: "Missing required field: contentJson",
        errorCode: "BAD_REQUEST",
      };
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("=== Starting MCQ Extraction (tool-calling) ===");
    console.log("Exam:", examName, "Year:", year, "Type:", paperType);

    const extractionText = buildExtractionText(contentJson);
    console.log("Condensed content length:", extractionText.length);

    // Sanity check: if text is too short, likely a scanned PDF with no OCR
    const MIN_TEXT_LENGTH = 1500;
    if (extractionText.length < MIN_TEXT_LENGTH) {
      console.warn("Extraction text too short, likely scanned/image PDF");
      const res: ExtractResponse = {
        success: false,
        questions: [],
        questionsCount: 0,
        error: `PDF text extraction is too small (${extractionText.length} chars). This may be a scanned PDF. Try enabling OCR or uploading a text-based PDF.`,
        errorCode: "TEXT_TOO_SHORT",
      };
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let rawQuestions: any[] = [];
    let usedTool = false;

    try {
      const result = await callGatewayWithTool({
        apiKey: LOVABLE_API_KEY,
        examName,
        year,
        paperType,
        extractionText,
      });
      rawQuestions = result.questions;
      usedTool = result.usedTool;
      console.log("Gateway response preview:", JSON.stringify(result.rawPreview));
    } catch (err: any) {
      const status = Number(err?.status || 0);
      const bodyText = String(err?.bodyText || "");
      console.error("AI gateway error:", status, bodyText.slice(0, 500));

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

      // Always return 200 so supabase.functions.invoke doesn't throw
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = normalizeQuestions(rawQuestions);

    const res: ExtractResponse = {
      success: normalized.length > 0,
      questions: normalized,
      questionsCount: normalized.length,
      partial: !usedTool && normalized.length > 0,
      error: normalized.length === 0 ? "No MCQs could be extracted from this PDF." : undefined,
      errorCode: normalized.length === 0 ? "NO_QUESTIONS" : undefined,
    };

    console.log(`Extracted ${normalized.length} questions`);

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
