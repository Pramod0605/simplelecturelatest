import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type DifficultyLevel = 'all' | 'Low' | 'Medium' | 'Intermediate' | 'Advanced';

export interface MCQQuestion {
  id: string;
  question_text: string;
  options: { key: string; text: string }[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  question_image_url?: string;
  marks: number;
}

// Transform JSONB options {A: {text: "..."}} to array format
const transformOptions = (dbOptions: Json | null): { key: string; text: string }[] => {
  if (!dbOptions || typeof dbOptions !== 'object' || Array.isArray(dbOptions)) {
    return [];
  }
  
  const optionsRecord = dbOptions as Record<string, Json>;
  
  return Object.entries(optionsRecord)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      let text = '';
      if (typeof value === 'object' && value !== null && 'text' in value) {
        text = String((value as { text: string }).text);
      } else if (typeof value === 'string') {
        text = value;
      } else {
        text = String(value);
      }
      return { key, text };
    });
};

// Transform DB question to component format
const transformQuestion = (dbQuestion: {
  id: string;
  question_text: string;
  options: Json;
  correct_answer: string;
  explanation: string | null;
  difficulty: string | null;
  question_image_url: string | null;
  marks: number | null;
}): MCQQuestion => {
  return {
    id: dbQuestion.id,
    question_text: dbQuestion.question_text,
    options: transformOptions(dbQuestion.options),
    correct_answer: dbQuestion.correct_answer,
    explanation: dbQuestion.explanation || "No explanation available.",
    difficulty: dbQuestion.difficulty || "Medium",
    question_image_url: dbQuestion.question_image_url || undefined,
    marks: dbQuestion.marks || 1
  };
};

export const useMCQQuestions = (topicId: string) => {
  return useQuery({
    queryKey: ["mcq-questions", topicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("topic_id", topicId)
        .in("question_format", ["single_choice", "multiple_choice"])
        .order("created_at");

      if (error) throw error;
      
      return (data || []).map(transformQuestion);
    },
    enabled: !!topicId
  });
};

// Get question counts by difficulty for the setup screen
export const useMCQQuestionCounts = (topicId: string) => {
  return useQuery({
    queryKey: ["mcq-question-counts", topicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("difficulty")
        .eq("topic_id", topicId)
        .in("question_format", ["single_choice", "multiple_choice"]);

      if (error) throw error;

      const counts = {
        all: data?.length || 0,
        Low: 0,
        Medium: 0,
        Intermediate: 0,
        Advanced: 0
      };

      data?.forEach((q) => {
        const diff = q.difficulty as keyof typeof counts;
        if (diff && counts[diff] !== undefined) {
          counts[diff]++;
        }
      });

      return counts;
    },
    enabled: !!topicId
  });
};
