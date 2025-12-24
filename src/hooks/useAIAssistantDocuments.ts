import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AIAssistantDocument {
  id: string;
  subject_id: string;
  display_name: string | null;
  source_type: string;
  source_url: string | null;
  file_name: string | null;
  status: string | null;
  content_preview: string | null;
  created_at: string | null;
  created_by: string | null;
}

export function useAIAssistantDocuments(subjectId: string) {
  return useQuery({
    queryKey: ["ai-assistant-documents", subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_assistant_documents")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AIAssistantDocument[];
    },
    enabled: !!subjectId,
  });
}

export function useAddAIAssistantDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      subjectId,
      displayName,
      sourceType,
      sourceUrl,
      fileName,
      contentPreview,
    }: {
      subjectId: string;
      displayName?: string;
      sourceType: "pdf" | "json" | "url";
      sourceUrl?: string;
      fileName?: string;
      contentPreview?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("ai_assistant_documents")
        .insert({
          subject_id: subjectId,
          display_name: displayName || fileName || "Untitled Document",
          source_type: sourceType,
          source_url: sourceUrl,
          file_name: fileName,
          content_preview: contentPreview?.substring(0, 500),
          status: "completed",
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ai-assistant-documents", variables.subjectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save document",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAIAssistantDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ documentId, subjectId }: { documentId: string; subjectId: string }) => {
      const { error } = await supabase
        .from("ai_assistant_documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
      return { subjectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-assistant-documents", data.subjectId] });
      toast({
        title: "Document Deleted",
        description: "Document removed from AI assistant",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
