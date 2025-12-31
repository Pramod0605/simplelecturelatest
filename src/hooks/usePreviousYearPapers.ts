import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PreviousYearPaper {
  id: string;
  subject_id: string;
  chapter_id?: string;
  topic_id?: string;
  year: number;
  exam_name: string;
  paper_type?: string;
  pdf_url?: string;
  total_questions: number;
  document_type?: "mcq" | "practice" | "proficiency";
  paper_category?: "previous_year" | "proficiency" | "exam";
  created_at: string;
}

export const usePreviousYearPapers = (subjectId?: string) => {
  return useQuery({
    queryKey: ["previous-year-papers", subjectId],
    queryFn: async () => {
      if (!subjectId) return [];
      
      const { data, error } = await supabase
        .from("subject_previous_year_papers")
        .select("*")
        .eq("subject_id", subjectId)
        .order("year", { ascending: false });

      if (error) throw error;
      return data as PreviousYearPaper[];
    },
    enabled: !!subjectId,
  });
};

export const useCreatePreviousYearPaper = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paper: Omit<PreviousYearPaper, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("subject_previous_year_papers")
        .insert(paper)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["previous-year-papers", data.subject_id] });
      toast({ title: "Success", description: "Previous year paper added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to add paper: " + error.message, variant: "destructive" });
    },
  });
};

export const useUpdatePreviousYearPaper = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PreviousYearPaper>;
    }) => {
      const { data, error } = await supabase
        .from("subject_previous_year_papers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["previous-year-papers", data.subject_id] });
      toast({ title: "Success", description: "Paper updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update paper: " + error.message, variant: "destructive" });
    },
  });
};

export const useDeletePreviousYearPaper = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, subjectId }: { id: string; subjectId: string }) => {
      const { error } = await supabase
        .from("subject_previous_year_papers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { subjectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["previous-year-papers", data.subjectId] });
      toast({ title: "Success", description: "Paper deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete paper: " + error.message, variant: "destructive" });
    },
  });
};

export const useUploadPaperPDF = () => {
  return useMutation({
    mutationFn: async ({ file, paperId }: { file: File; paperId: string }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${paperId}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("previous-year-papers")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("previous-year-papers")
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to upload PDF: " + error.message, variant: "destructive" });
    },
  });
};
