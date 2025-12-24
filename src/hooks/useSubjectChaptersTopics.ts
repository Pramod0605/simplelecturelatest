import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubjectChapter {
  id: string;
  chapter_number: number;
  title: string;
  subject_id: string;
}

export interface SubjectTopic {
  id: string;
  topic_number: number;
  title: string;
  chapter_id: string;
}

export const useSubjectChapters = (subjectId?: string) => {
  return useQuery({
    queryKey: ["subject-chapters", subjectId],
    queryFn: async () => {
      if (!subjectId) return [];

      const { data, error } = await supabase
        .from("subject_chapters")
        .select("id, chapter_number, title, subject_id")
        .eq("subject_id", subjectId)
        .order("chapter_number", { ascending: true });

      if (error) throw error;
      return data as SubjectChapter[];
    },
    enabled: !!subjectId,
  });
};

export const useChapterTopics = (chapterId?: string) => {
  return useQuery({
    queryKey: ["chapter-topics", chapterId],
    queryFn: async () => {
      if (!chapterId) return [];

      const { data, error } = await supabase
        .from("subject_topics")
        .select("id, topic_number, title, chapter_id")
        .eq("chapter_id", chapterId)
        .order("topic_number", { ascending: true });

      if (error) throw error;
      return data as SubjectTopic[];
    },
    enabled: !!chapterId,
  });
};
