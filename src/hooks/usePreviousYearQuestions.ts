import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ExtractedQuestion {
  question_text: string;
  question_type: "mcq" | "subjective" | "true_false" | "integer";
  question_format: "single_choice" | "multiple_choice" | "true_false" | "subjective" | "integer";
  options: Record<string, { text: string }>;
  correct_answer: string;
  explanation?: string;
  difficulty: "Low" | "Medium" | "Intermediate" | "Advanced";
  marks?: number;
  question_number?: number;
  is_important?: boolean;
}

interface BulkInsertParams {
  questions: ExtractedQuestion[];
  paperId: string;
  topicId: string;
  subjectId: string;
  chapterId: string;
}

export const useBulkInsertPreviousYearQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questions, paperId, topicId }: BulkInsertParams) => {
      // Normalize difficulty to match DB constraint: 'Low', 'Medium', 'Intermediate', 'Advanced'
      const normalizeDifficulty = (diff: string): string => {
        const d = (diff || "medium").toLowerCase();
        if (d.includes("easy") || d.includes("simple") || d === "low") return "Low";
        if (d.includes("hard") || d.includes("difficult") || d === "advanced") return "Advanced";
        if (d.includes("intermediate")) return "Intermediate";
        return "Medium";
      };

      const formattedQuestions = questions.map((q, index) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        question_format: q.question_format,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        difficulty: normalizeDifficulty(q.difficulty),
        marks: q.marks || 1,
        topic_id: topicId,
        previous_year_paper_id: paperId,
        is_verified: false,
        is_ai_generated: true,
        is_important: q.is_important || false,
      }));

      // Insert in batches of 50
      const batchSize = 50;
      let insertedCount = 0;

      for (let i = 0; i < formattedQuestions.length; i += batchSize) {
        const batch = formattedQuestions.slice(i, i + batchSize);
        const { error } = await supabase.from("questions").insert(batch);

        if (error) throw error;
        insertedCount += batch.length;
      }

      return { insertedCount, paperId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subject-questions"] });
      toast({
        title: "Questions Saved",
        description: `Successfully saved ${data.insertedCount} questions`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to save questions: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Helper function to extract questions from parsed PDF JSON
export function extractQuestionsFromParsedJson(
  parsedContent: any
): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];

  if (!parsedContent) return questions;

  // Handle different possible formats from the parser
  // Format 1: Direct array of questions
  if (Array.isArray(parsedContent)) {
    parsedContent.forEach((item, index) => {
      const q = parseQuestionItem(item, index + 1);
      if (q) questions.push(q);
    });
  }
  // Format 2: Object with questions array
  else if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
    parsedContent.questions.forEach((item: any, index: number) => {
      const q = parseQuestionItem(item, index + 1);
      if (q) questions.push(q);
    });
  }
  // Format 3: Object with children containing questions
  else if (parsedContent.children && Array.isArray(parsedContent.children)) {
    let qNum = 1;
    parsedContent.children.forEach((child: any) => {
      if (child.type === "question" || child.question_text || child.text) {
        const q = parseQuestionItem(child, qNum);
        if (q) {
          questions.push(q);
          qNum++;
        }
      }
    });
  }

  return questions;
}

function parseQuestionItem(item: any, defaultNumber: number): ExtractedQuestion | null {
  if (!item) return null;

  const questionText = item.question_text || item.question || item.text || "";
  if (!questionText.trim()) return null;

  // Parse options - handle multiple formats
  let options: Record<string, { text: string }> = {};
  
  if (item.options) {
    if (Array.isArray(item.options)) {
      // Array format: ["Option A", "Option B", ...]
      const keys = ["A", "B", "C", "D", "E", "F"];
      item.options.forEach((opt: any, i: number) => {
        if (i < keys.length) {
          options[keys[i]] = { text: typeof opt === "string" ? opt : opt.text || String(opt) };
        }
      });
    } else if (typeof item.options === "object") {
      // Object format: { A: "text", B: "text", ... } or { A: { text: "..." }, ... }
      Object.entries(item.options).forEach(([key, value]) => {
        if (typeof value === "string") {
          options[key] = { text: value };
        } else if (typeof value === "object" && value !== null) {
          options[key] = { text: (value as any).text || String(value) };
        }
      });
    }
  }

  // If no options found, try to extract from choice_a, choice_b, etc.
  if (Object.keys(options).length === 0) {
    ["A", "B", "C", "D", "E"].forEach((key) => {
      const choiceKey = `choice_${key.toLowerCase()}`;
      const optKey = `option_${key.toLowerCase()}`;
      const value = item[choiceKey] || item[optKey] || item[key] || item[key.toLowerCase()];
      if (value) {
        options[key] = { text: typeof value === "string" ? value : String(value) };
      }
    });
  }

  // Parse correct answer first (need it to determine question type)
  let correctAnswer = item.correct_answer || item.answer || item.correct || "";
  if (typeof correctAnswer !== "string") {
    correctAnswer = String(correctAnswer);
  }
  // Clean up the answer
  const cleanedAnswer = correctAnswer.replace(/[()]/g, "").trim();
  
  // Determine question type - check if it's integer based on answer format or empty options
  const hasOptions = Object.keys(options).length > 0;
  const isIntegerAnswer = /^-?\d+\.?\d*$/.test(cleanedAnswer) && cleanedAnswer.length > 1;
  
  const questionType = isIntegerAnswer ? "integer" : hasOptions ? "mcq" : "subjective";
  const questionFormat = isIntegerAnswer ? "integer" : hasOptions ? "single_choice" : "subjective";

  // For MCQ, normalize to just the first letter; for integer keep full value
  const finalAnswer = isIntegerAnswer ? cleanedAnswer : cleanedAnswer.toUpperCase().charAt(0);

  // Parse difficulty
  let difficulty: ExtractedQuestion["difficulty"] = "Medium";
  const diffStr = (item.difficulty || item.level || "").toLowerCase();
  if (diffStr.includes("easy") || diffStr.includes("low")) {
    difficulty = "Low";
  } else if (diffStr.includes("hard") || diffStr.includes("advanced")) {
    difficulty = "Advanced";
  } else if (diffStr.includes("intermediate")) {
    difficulty = "Intermediate";
  }

  return {
    question_text: questionText,
    question_type: questionType,
    question_format: questionFormat,
    options,
    correct_answer: finalAnswer,
    explanation: item.explanation || item.solution || undefined,
    difficulty,
    marks: item.marks || item.mark || 1,
    question_number: item.question_number || item.number || defaultNumber,
  };
}
