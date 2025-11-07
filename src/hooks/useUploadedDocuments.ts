import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUploadedDocuments = (filters: {
  categoryId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ["uploaded-documents", filters],
    queryFn: async () => {
      let query = supabase
        .from("uploaded_question_documents")
        .select(`
          *,
          categories(name),
          popular_subjects(name),
          subject_chapters(title),
          subject_topics(title),
          subtopics(title)
        `);

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }
      if (filters.chapterId) {
        query = query.eq('chapter_id', filters.chapterId);
      }
      if (filters.topicId) {
        query = query.eq('topic_id', filters.topicId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => {
      const hasProcessingDocs = query.state.data?.some(
        (doc: any) => doc.status === 'processing' || doc.status === 'pending'
      );
      return hasProcessingDocs ? 3000 : false;
    },
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionsFile,
      solutionsFile,
      categoryId,
      subjectId,
      chapterId,
      topicId,
      subtopicId,
    }: {
      questionsFile: File;
      solutionsFile: File;
      categoryId: string;
      subjectId: string;
      chapterId: string;
      topicId: string;
      subtopicId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload QUESTIONS PDF
      const questionsExt = questionsFile.name.split('.').pop();
      const questionsPath = `${user.id}/${Date.now()}_questions.${questionsExt}`;

      const { error: questionsUploadError } = await supabase.storage
        .from('uploaded-question-documents')
        .upload(questionsPath, questionsFile);

      if (questionsUploadError) throw questionsUploadError;

      // Upload SOLUTIONS PDF
      const solutionsExt = solutionsFile.name.split('.').pop();
      const solutionsPath = `${user.id}/${Date.now()}_solutions.${solutionsExt}`;

      const { error: solutionsUploadError } = await supabase.storage
        .from('uploaded-question-documents')
        .upload(solutionsPath, solutionsFile);

      if (solutionsUploadError) throw solutionsUploadError;

      // Get public URLs
      const { data: { publicUrl: questionsUrl } } = supabase.storage
        .from('uploaded-question-documents')
        .getPublicUrl(questionsPath);

      const { data: { publicUrl: solutionsUrl } } = supabase.storage
        .from('uploaded-question-documents')
        .getPublicUrl(solutionsPath);

      // Create document record with BOTH URLs
      const { data, error } = await supabase
        .from('uploaded_question_documents')
        .insert({
          category_id: categoryId,
          subject_id: subjectId,
          chapter_id: chapterId,
          topic_id: topicId,
          subtopic_id: subtopicId,
          uploaded_by: user.id,
          file_name: `${questionsFile.name} + ${solutionsFile.name}`,
          file_url: questionsUrl, // Use questions URL as primary for backward compatibility
          questions_file_name: questionsFile.name,
          questions_file_url: questionsUrl,
          solutions_file_name: solutionsFile.name,
          solutions_file_url: solutionsUrl,
          file_type: 'pdf',
          file_size_bytes: questionsFile.size + solutionsFile.size,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Dual PDFs uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["uploaded-documents"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to upload documents", { description: error.message });
    },
  });
};

export const useProcessDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId }: { documentId: string }) => {
      const { data, error } = await supabase.functions.invoke('process-uploaded-document', {
        body: { documentId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Document processing started");
      queryClient.invalidateQueries({ queryKey: ["uploaded-documents"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to process document", { description: error.message });
    },
  });
};

export const useExtractQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId }: { documentId: string }) => {
      const { data, error } = await supabase.functions.invoke('process-educational-pdfs', {
        body: { documentId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["uploaded-documents"] });
      queryClient.invalidateQueries({ queryKey: ["pending-questions"] });
      queryClient.invalidateQueries({ queryKey: ["processing-jobs"] });
      
      if (data?.replitJobId) {
        toast.success('Processing started with Replit service!', {
          description: `Job ID: ${data.replitJobId}. Polling every 2 minutes...`
        });
      } else if (data?.questionsExtracted) {
        toast.success(`Extracted ${data.questionsExtracted} questions`);
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to extract questions", { description: error.message });
    },
  });
};
