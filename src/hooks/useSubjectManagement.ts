import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Types
export interface SubjectCategory {
  id: string;
  subject_id: string;
  category_id: string;
  created_at: string;
  categories?: {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    level: number;
  };
}

export interface SubjectChapter {
  id: string;
  subject_id: string;
  chapter_number: number;
  title: string;
  description?: string;
  sequence_order: number;
  video_id?: string;
  video_platform?: string;
  notes_markdown?: string;
  pdf_url?: string;
  ai_generated_video_url?: string;
  ai_generated_podcast_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SubjectTopic {
  id: string;
  chapter_id: string;
  topic_number: number;
  title: string;
  estimated_duration_minutes?: number;
  video_id?: string;
  video_platform?: string;
  notes_markdown?: string;
  content_markdown?: string;
  pdf_url?: string;
  ai_generated_video_url?: string;
  ai_generated_podcast_url?: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

// Category hooks
export const useSubjectCategories = (subjectId?: string) => {
  return useQuery({
    queryKey: ["subject-categories", subjectId],
    queryFn: async () => {
      if (!subjectId) return [];
      
      const { data, error } = await supabase
        .from("subject_categories")
        .select("*, categories(*)")
        .eq("subject_id", subjectId);

      if (error) throw error;
      return data as SubjectCategory[];
    },
    enabled: !!subjectId,
  });
};

export const useAllCategoriesHierarchy = () => {
  return useQuery({
    queryKey: ["categories-hierarchy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("level")
        .order("display_order");

      if (error) throw error;
      
      // Build hierarchy display strings
      const categoryMap = new Map(data.map(cat => [cat.id, cat]));
      
      return data.map(category => {
        const path: string[] = [];
        let current = category;
        
        while (current) {
          path.unshift(current.name);
          current = current.parent_id ? categoryMap.get(current.parent_id) : null;
        }
        
        return {
          ...category,
          displayName: path.join(" - "),
          path,
        };
      });
    },
  });
};

export const useUpdateSubjectCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subjectId,
      categoryIds,
    }: {
      subjectId: string;
      categoryIds: string[];
    }) => {
      // Delete existing categories
      await supabase
        .from("subject_categories")
        .delete()
        .eq("subject_id", subjectId);

      // Insert new categories
      if (categoryIds.length > 0) {
        const { error } = await supabase
          .from("subject_categories")
          .insert(
            categoryIds.map(categoryId => ({
              subject_id: subjectId,
              category_id: categoryId,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subject-categories", variables.subjectId] });
      toast({ title: "Success", description: "Subject categories updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update categories: " + error.message, variant: "destructive" });
    },
  });
};

// Chapter hooks
export const useSubjectChapters = (subjectId?: string) => {
  return useQuery({
    queryKey: ["subject-chapters", subjectId],
    queryFn: async () => {
      if (!subjectId) return [];
      
      const { data, error } = await supabase
        .from("subject_chapters")
        .select("*")
        .eq("subject_id", subjectId)
        .order("sequence_order");

      if (error) throw error;
      return data as SubjectChapter[];
    },
    enabled: !!subjectId,
  });
};

export const useCreateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapter: Omit<SubjectChapter, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("subject_chapters")
        .insert(chapter)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subject-chapters", data.subject_id] });
      toast({ title: "Success", description: "Chapter created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to create chapter: " + error.message, variant: "destructive" });
    },
  });
};

export const useUpdateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<SubjectChapter>;
    }) => {
      const { data, error } = await supabase
        .from("subject_chapters")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subject-chapters", data.subject_id] });
      toast({ title: "Success", description: "Chapter updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update chapter: " + error.message, variant: "destructive" });
    },
  });
};

export const useDeleteChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, subjectId }: { id: string; subjectId: string }) => {
      const { error } = await supabase
        .from("subject_chapters")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { subjectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subject-chapters", data.subjectId] });
      toast({ title: "Success", description: "Chapter deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete chapter: " + error.message, variant: "destructive" });
    },
  });
};

// Topic hooks
export const useChapterTopics = (chapterId?: string) => {
  return useQuery({
    queryKey: ["subject-topics", chapterId],
    queryFn: async () => {
      if (!chapterId) return [];
      
      const { data, error } = await supabase
        .from("subject_topics")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("sequence_order");

      if (error) throw error;
      return data as SubjectTopic[];
    },
    enabled: !!chapterId,
  });
};

export const useCreateTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topic: Omit<SubjectTopic, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("subject_topics")
        .insert(topic)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subject-topics", data.chapter_id] });
      toast({ title: "Success", description: "Topic created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to create topic: " + error.message, variant: "destructive" });
    },
  });
};

export const useUpdateTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<SubjectTopic>;
    }) => {
      const { data, error } = await supabase
        .from("subject_topics")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subject-topics", data.chapter_id] });
      toast({ title: "Success", description: "Topic updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update topic: " + error.message, variant: "destructive" });
    },
  });
};

export const useDeleteTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, chapterId }: { id: string; chapterId: string }) => {
      const { error } = await supabase
        .from("subject_topics")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { chapterId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subject-topics", data.chapterId] });
      toast({ title: "Success", description: "Topic deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete topic: " + error.message, variant: "destructive" });
    },
  });
};

// Bulk import hook
export const useBulkImportChapters = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subjectId,
      chapters,
    }: {
      subjectId: string;
      chapters: Array<{
        chapter_number: number;
        title: string;
        description?: string;
        topics?: Array<{
          topic_number: number;
          title: string;
          estimated_duration_minutes?: number;
          content_markdown?: string;
        }>;
      }>;
    }) => {
      const results = { chapters: 0, topics: 0, errors: [] as string[] };

      for (const chapter of chapters) {
        try {
          const { data: chapterData, error: chapterError } = await supabase
            .from("subject_chapters")
            .insert({
              subject_id: subjectId,
              chapter_number: chapter.chapter_number,
              title: chapter.title,
              description: chapter.description,
              sequence_order: chapter.chapter_number,
            })
            .select()
            .single();

          if (chapterError) throw chapterError;
          results.chapters++;

          if (chapter.topics && chapter.topics.length > 0) {
            const topicsToInsert = chapter.topics.map((topic) => ({
              chapter_id: chapterData.id,
              topic_number: topic.topic_number,
              title: topic.title,
              estimated_duration_minutes: topic.estimated_duration_minutes,
              content_markdown: topic.content_markdown,
              sequence_order: topic.topic_number,
            }));

            const { error: topicsError } = await supabase
              .from("subject_topics")
              .insert(topicsToInsert);

            if (topicsError) throw topicsError;
            results.topics += topicsToInsert.length;
          }
        } catch (error) {
          results.errors.push(
            `Chapter ${chapter.chapter_number}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      return results;
    },
    onSuccess: (results, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subject-chapters", variables.subjectId] });
      toast({
        title: "Import Complete",
        description: `Imported ${results.chapters} chapters and ${results.topics} topics` +
          (results.errors.length > 0 ? ` with ${results.errors.length} errors` : "")
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Bulk import failed: " + error.message, variant: "destructive" });
    },
  });
};
