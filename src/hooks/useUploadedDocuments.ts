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
      file,
      categoryId,
      subjectId,
      chapterId,
      topicId,
      subtopicId,
    }: {
      file: File;
      categoryId: string;
      subjectId: string;
      chapterId: string;
      topicId: string;
      subtopicId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploaded-question-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploaded-question-documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from('uploaded_question_documents')
        .insert({
          category_id: categoryId,
          subject_id: subjectId,
          chapter_id: chapterId,
          topic_id: topicId,
          subtopic_id: subtopicId,
          uploaded_by: user.id,
          file_name: file.name,
          file_type: fileExt === 'pdf' ? 'pdf' : fileExt === 'docx' ? 'word' : fileExt === 'json' ? 'json' : 'image',
          file_url: publicUrl,
          file_size_bytes: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["uploaded-documents"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to upload document", { description: error.message });
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
      const { data, error } = await supabase.functions.invoke('extract-questions-from-document', {
        body: { documentId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["uploaded-documents"] });
      queryClient.invalidateQueries({ queryKey: ["pending-questions"] });
      queryClient.invalidateQueries({ queryKey: ["processing-jobs"] });
      
      toast.success(`Extracted ${data.questionsExtracted} questions`);
    },
    onError: (error: Error) => {
      toast.error("Failed to extract questions", { description: error.message });
    },
  });
};
