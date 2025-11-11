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
      
      const { data: subject, error } = await supabase
        .from("popular_subjects")
        .select("category_id, categories(id, name)")
        .eq("id", subjectId)
        .single();

      if (error) throw error;
      
      if (subject?.category_id) {
        return [{
          subject_id: subjectId,
          category_id: subject.category_id,
          categories: (subject as any).categories
        }];
      }
      
      return [];
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
      if (categoryIds.length === 0) {
        throw new Error("Please select a category");
      }
      
      const { error } = await supabase
        .from("popular_subjects")
        .update({ category_id: categoryIds[0] })
        .eq("id", subjectId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subject-categories", variables.subjectId] });
      queryClient.invalidateQueries({ queryKey: ["admin-popular-subjects"] });
      toast({ title: "Success", description: "Category updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update category: " + error.message, variant: "destructive" });
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

// Order update hooks
export const useUpdateChapterOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapters,
    }: {
      chapters: Array<{ id: string; sequence_order: number }>;
    }) => {
      const updates = chapters.map((chapter) =>
        supabase
          .from("subject_chapters")
          .update({ sequence_order: chapter.sequence_order })
          .eq("id", chapter.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-chapters"] });
      toast({ title: "Success", description: "Chapter order updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update order: " + error.message, variant: "destructive" });
    },
  });
};

export const useUpdateTopicOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topics,
    }: {
      topics: Array<{ id: string; sequence_order: number }>;
    }) => {
      const updates = topics.map((topic) =>
        supabase
          .from("subject_topics")
          .update({ sequence_order: topic.sequence_order })
          .eq("id", topic.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-topics"] });
      toast({ title: "Success", description: "Topic order updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update order: " + error.message, variant: "destructive" });
    },
  });
};

export const useUpdateSubtopicOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subtopics,
    }: {
      subtopics: Array<{ id: string; sequence_order: number }>;
    }) => {
      const updates = subtopics.map((subtopic) =>
        supabase
          .from("subtopics")
          .update({ sequence_order: subtopic.sequence_order })
          .eq("id", subtopic.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtopics"] });
      toast({ title: "Success", description: "Subtopic order updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update order: " + error.message, variant: "destructive" });
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
          subtopics?: Array<{
            title: string;
            description?: string;
            estimated_duration_minutes?: number;
            sequence_order: number;
          }>;
        }>;
      }>;
    }) => {
      const results = { chapters: 0, topics: 0, subtopics: 0, skipped: 0, errors: [] as string[] };

      // Check existing chapters
      const { data: existingChapters } = await supabase
        .from("subject_chapters")
        .select("chapter_number, title")
        .eq("subject_id", subjectId);

      const existingChapterNumbers = new Set(
        existingChapters?.map((c) => c.chapter_number) || []
      );

      for (const chapter of chapters) {
        try {
          // Skip if chapter already exists
          if (existingChapterNumbers.has(chapter.chapter_number)) {
            results.skipped++;
            results.errors.push(
              `Chapter ${chapter.chapter_number} already exists - skipped`
            );
            continue;
          }

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
            for (const topic of chapter.topics) {
              const { data: topicData, error: topicError } = await supabase
                .from("subject_topics")
                .insert({
                  chapter_id: chapterData.id,
                  topic_number: topic.topic_number,
                  title: topic.title,
                  estimated_duration_minutes: topic.estimated_duration_minutes,
                  content_markdown: topic.content_markdown,
                  sequence_order: topic.topic_number,
                })
                .select()
                .single();

              if (topicError) throw topicError;
              results.topics++;

              // Handle subtopics
              if (topic.subtopics && topic.subtopics.length > 0) {
                const subtopicsToInsert = topic.subtopics.map((subtopic, index) => ({
                  topic_id: topicData.id,
                  title: subtopic.title,
                  description: subtopic.description,
                  estimated_duration_minutes: subtopic.estimated_duration_minutes,
                  sequence_order: subtopic.sequence_order || index + 1,
                }));

                const { error: subtopicsError } = await supabase
                  .from("subtopics")
                  .insert(subtopicsToInsert);

                if (subtopicsError) throw subtopicsError;
                results.subtopics += subtopicsToInsert.length;
              }
            }
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
      queryClient.invalidateQueries({ queryKey: ["subject-topics"] });
      queryClient.invalidateQueries({ queryKey: ["subtopics"] });
      
      const message = `Imported ${results.chapters} chapters, ${results.topics} topics, ${results.subtopics} subtopics` +
        (results.skipped > 0 ? `, skipped ${results.skipped}` : "") +
        (results.errors.length > 0 ? `. Check console for errors.` : "");
      
      toast({
        title: "Import Complete",
        description: message,
      });
      
      if (results.errors.length > 0) {
        console.log("Import errors:", results.errors);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Bulk import failed: " + error.message, variant: "destructive" });
    },
  });
};
