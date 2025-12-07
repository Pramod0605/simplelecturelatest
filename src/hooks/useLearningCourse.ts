import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

// Hook to wait for auth state to be ready
export const useAuthReady = () => {
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setIsReady(true);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isReady, userId };
};

export const useLearningCourse = (courseId?: string) => {
  const { isReady, userId } = useAuthReady();

  return useQuery({
    queryKey: ["learning-course", courseId, userId],
    queryFn: async () => {
      if (!courseId) return null;

      // Use cached session instead of making network request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { course: null, subjects: [], isEnrolled: false, error: "not_authenticated" };
      }

      // Check enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (enrollmentError) {
        console.error("Enrollment check error:", enrollmentError);
      }

      if (!enrollment) {
        return { course: null, subjects: [], isEnrolled: false, error: "not_enrolled" };
      }

      // Fetch course details and subjects in parallel
      const [courseResult, subjectsResult] = await Promise.all([
        supabase
          .from("courses")
          .select("id, name, slug, thumbnail_url")
          .eq("id", courseId)
          .single(),
        supabase
          .from("course_subjects")
          .select(`
            id,
            display_order,
            subject:popular_subjects(id, name, slug, thumbnail_url)
          `)
          .eq("course_id", courseId)
          .order("display_order")
      ]);

      if (courseResult.error || !courseResult.data) {
        return { course: null, subjects: [], isEnrolled: false, error: "course_not_found" };
      }

      const subjects = (subjectsResult.data || [])
        .filter(cs => cs.subject)
        .map(cs => ({
          id: cs.subject.id,
          name: cs.subject.name,
          slug: cs.subject.slug,
          thumbnail_url: cs.subject.thumbnail_url,
        }));

      return { course: courseResult.data, subjects, isEnrolled: true, error: null };
    },
    enabled: !!courseId && isReady,
    staleTime: 60000, // Cache for 1 minute
  });
};

export const useSubjectChapters = (subjectId?: string) => {
  return useQuery({
    queryKey: ["subject-chapters-learning", subjectId],
    queryFn: async () => {
      if (!subjectId) return [];

      const { data: chapters, error } = await supabase
        .from("subject_chapters")
        .select(`
          id,
          title,
          chapter_number,
          description
        `)
        .eq("subject_id", subjectId)
        .order("chapter_number");

      if (error) {
        console.error("Chapters fetch error:", error);
        return [];
      }

      // Fetch all topics for all chapters in one query
      const chapterIds = (chapters || []).map(c => c.id);
      
      if (chapterIds.length === 0) return [];

      const { data: allTopics } = await supabase
        .from("subject_topics")
        .select("id, title, topic_number, estimated_duration_minutes, content_markdown, chapter_id")
        .in("chapter_id", chapterIds)
        .order("topic_number");

      // Group topics by chapter
      const topicsByChapter: Record<string, any[]> = {};
      (allTopics || []).forEach(topic => {
        if (!topicsByChapter[topic.chapter_id]) {
          topicsByChapter[topic.chapter_id] = [];
        }
        topicsByChapter[topic.chapter_id].push(topic);
      });

      return (chapters || []).map(chapter => ({
        ...chapter,
        topics: topicsByChapter[chapter.id] || [],
        progress: 0,
      }));
    },
    enabled: !!subjectId,
    staleTime: 60000, // Cache for 1 minute
  });
};
