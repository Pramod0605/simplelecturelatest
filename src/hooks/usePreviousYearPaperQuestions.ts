import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PaperQuestion {
  id: string;
  question_text: string;
  question_type: "mcq" | "subjective" | "true_false" | "integer";
  question_format: "single_choice" | "multiple_choice" | "true_false" | "subjective" | "integer";
  options: Record<string, { text: string }>;
  correct_answer: string;
  explanation?: string | null;
  difficulty: string;
  marks: number;
  is_verified: boolean;
  is_important?: boolean;
}

export const usePreviousYearPaperQuestions = (paperId: string | null) => {
  return useQuery({
    queryKey: ["previous-year-paper-questions", paperId],
    queryFn: async () => {
      if (!paperId) return [];

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("previous_year_paper_id", paperId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Transform to match expected format
      return (data || []).map((q): PaperQuestion => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type as PaperQuestion["question_type"],
        question_format: q.question_format as PaperQuestion["question_format"],
        options: q.options as Record<string, { text: string }>,
        correct_answer: q.correct_answer || "",
        explanation: q.explanation,
        difficulty: q.difficulty || "Medium",
        marks: q.marks || 1,
        is_verified: q.is_verified || false,
        is_important: q.is_important || false,
      }));
    },
    enabled: !!paperId,
  });
};

// Fetch papers for a subject, optionally filtered by topic
export const usePreviousYearPapersForSubject = (subjectId: string | null, topicId?: string | null) => {
  return useQuery({
    queryKey: ["previous-year-papers-subject", subjectId, topicId],
    queryFn: async () => {
      if (!subjectId) return [];

      let query = supabase
        .from("subject_previous_year_papers")
        .select("*")
        .eq("subject_id", subjectId);

      // If topicId is provided, filter by topic OR show papers without topic_id (for backward compatibility)
      if (topicId) {
        query = query.or(`topic_id.eq.${topicId},topic_id.is.null`);
      }

      const { data, error } = await query.order("year", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!subjectId,
  });
};
