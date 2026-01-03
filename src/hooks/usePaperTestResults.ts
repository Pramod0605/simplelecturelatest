import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PaperTestResult {
  id: string;
  student_id: string;
  paper_id: string;
  subject_id: string | null;
  paper_category: "previous_year" | "proficiency" | "exam";
  score: number | null;
  total_questions: number;
  percentage: number | null;
  time_taken_seconds: number | null;
  answers: Record<string, string>;
  grading_status: "pending" | "graded" | "ai_graded";
  submitted_at: string;
  graded_at: string | null;
  created_at: string;
  paper?: {
    exam_name: string;
    year: number;
    paper_type: string | null;
  };
}

export const usePaperTestResults = (subjectId?: string | null) => {
  return useQuery({
    queryKey: ["paper-test-results", subjectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("paper_test_results")
        .select(`
          *,
          paper:subject_previous_year_papers(exam_name, year, paper_type)
        `)
        .eq("student_id", user.id)
        .order("submitted_at", { ascending: false });

      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PaperTestResult[];
    },
  });
};

export const useSubmitPaperTestResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: {
      paper_id: string;
      subject_id: string | null;
      paper_category: "previous_year" | "proficiency" | "exam";
      score: number | null;
      total_questions: number;
      percentage: number | null;
      time_taken_seconds: number | null;
      answers: Record<string, string>;
      grading_status: "pending" | "graded" | "ai_graded";
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("paper_test_results")
        .insert({
          ...result,
          student_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["paper-test-results"] });
      toast({ 
        title: "Test Submitted", 
        description: "Your answers have been saved. View results in the My Results tab." 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: "Failed to save test results: " + error.message, 
        variant: "destructive" 
      });
    },
  });
};

export const useUpdatePaperTestResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PaperTestResult>;
    }) => {
      const { data, error } = await supabase
        .from("paper_test_results")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paper-test-results"] });
    },
    onError: (error: Error) => {
      console.error("Failed to update test result:", error);
    },
  });
};
