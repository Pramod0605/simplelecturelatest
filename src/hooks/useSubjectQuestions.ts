import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SubjectQuestion {
  id: string;
  question_text: string;
  question_type: string;
  question_format: string;
  options?: Record<string, any>;
  correct_answer: string;
  explanation?: string;
  marks: number;
  difficulty: string;
  topic_id?: string;
  subtopic_id?: string;
  is_verified: boolean;
  is_ai_generated: boolean;
  question_image_url?: string;
  option_images?: Record<string, string>;
  contains_formula: boolean;
  formula_type?: string;
  previous_year_paper_id?: string;
  created_at: string;
}

export const useSubjectQuestions = (filters?: {
  subjectId?: string;
  categoryId?: string;
  topicId?: string;
  chapterId?: string;
  difficulty?: string;
  isVerified?: boolean;
  isAiGenerated?: boolean;
}) => {
  return useQuery({
    queryKey: ["subject-questions", filters],
    queryFn: async () => {
      let query = supabase
        .from("questions")
        .select(`
          *,
          subject_topics!inner(
            id,
            title,
            chapter_id,
            subject_chapters!inner(
              id,
              title,
              subject_id,
              popular_subjects!inner(
                id,
                name,
                category_id,
                categories!inner(
                  id,
                  name
                )
              )
            )
          )
        `);

      // Filter by subject
      if (filters?.subjectId) {
        query = query.eq('subject_topics.subject_chapters.subject_id', filters.subjectId);
      }

      // Filter by category
      if (filters?.categoryId) {
        query = query.eq('subject_topics.subject_chapters.popular_subjects.category_id', filters.categoryId);
      }

      // Filter by topic
      if (filters?.topicId) {
        query = query.eq("topic_id", filters.topicId);
      }

      // Filter by chapter
      if (filters?.chapterId) {
        query = query.eq("subject_topics.chapter_id", filters.chapterId);
      }

      if (filters?.difficulty) {
        query = query.eq("difficulty", filters.difficulty);
      }

      if (filters?.isVerified !== undefined) {
        query = query.eq("is_verified", filters.isVerified);
      }

      if (filters?.isAiGenerated !== undefined) {
        query = query.eq("is_ai_generated", filters.isAiGenerated);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as SubjectQuestion[];
    },
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Omit<SubjectQuestion, "id" | "created_at">) => {
      const normalizeType = (qf?: string, qt?: string) => {
        const allowed = ["mcq", "subjective", "true_false"] as const;
        if (qt && (allowed as readonly string[]).includes(qt)) return qt;
        if (qf === "true_false") return "true_false";
        if (qf === "single_choice" || qf === "multiple_choice") return "mcq";
        return "subjective";
      };

      const payload = {
        ...question,
        question_type: normalizeType(question.question_format, question.question_type),
      };

      const { data, error } = await supabase
        .from("questions")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-questions"] });
      toast({ title: "Success", description: "Question created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to create question: " + error.message, variant: "destructive" });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<SubjectQuestion>;
    }) => {
      const { data, error} = await supabase
        .from("questions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-questions"] });
      toast({ title: "Success", description: "Question updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update question: " + error.message, variant: "destructive" });
    },
  });
};

export const useBulkVerifyQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("questions")
        .update({ is_verified: true })
        .in("id", ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["subject-questions"] });
      toast({ title: "Success", description: `${count} questions verified successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to verify questions: " + error.message, variant: "destructive" });
    },
  });
};

export const useBulkDeleteQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("questions")
        .delete()
        .in("id", ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["subject-questions"] });
      toast({ title: "Success", description: `${count} questions deleted successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete questions: " + error.message, variant: "destructive" });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-questions"] });
      toast({ title: "Success", description: "Question deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete question: " + error.message, variant: "destructive" });
    },
  });
};

export const useUploadQuestionImage = () => {
  return useMutation({
    mutationFn: async ({ file, questionId }: { file: File; questionId: string }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${questionId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("question-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("question-images")
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to upload image: " + error.message, variant: "destructive" });
    },
  });
};

export const useBulkImportQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questions,
    }: {
      questions: Array<Omit<SubjectQuestion, "id" | "created_at">>;
    }) => {
      const results = { success: 0, errors: [] as string[] };

      // Process in batches of 100
      for (let i = 0; i < questions.length; i += 100) {
        const batch = questions.slice(i, i + 100);
        
        const normalizeBatchType = (qf?: string, qt?: string) => {
          const allowed = ["mcq", "subjective", "true_false"] as const;
          if (qt && (allowed as readonly string[]).includes(qt)) return qt;
          if (qf === "true_false") return "true_false";
          if (qf === "single_choice" || qf === "multiple_choice") return "mcq";
          return "subjective";
        };

        try {
          const normalizedBatch = batch.map((q) => ({
            ...q,
            question_type: normalizeBatchType(q.question_format, (q as any).question_type),
          }));

          const { error } = await supabase.from("questions").insert(normalizedBatch);
          if (error) throw error;
          results.success += normalizedBatch.length;

        } catch (error) {
          results.errors.push(
            `Batch ${Math.floor(i / 100) + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["subject-questions"] });
      toast({
        title: "Import Complete",
        description: `Imported ${results.success} questions` +
          (results.errors.length > 0 ? ` with ${results.errors.length} batch errors` : "")
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Bulk import failed: " + error.message, variant: "destructive" });
    },
  });
};
