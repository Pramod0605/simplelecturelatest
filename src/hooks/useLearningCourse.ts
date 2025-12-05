import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLearningCourse = (courseId?: string) => {
  return useQuery({
    queryKey: ["learning-course", courseId],
    queryFn: async () => {
      if (!courseId) return null;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { course: null, subjects: [], isEnrolled: false, error: "not_authenticated" };
      }

      // Check enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (enrollmentError) {
        console.error("Enrollment check error:", enrollmentError);
      }

      if (!enrollment) {
        return { course: null, subjects: [], isEnrolled: false, error: "not_enrolled" };
      }

      // Fetch course details
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, name, slug, thumbnail_url")
        .eq("id", courseId)
        .single();

      if (courseError || !course) {
        return { course: null, subjects: [], isEnrolled: false, error: "course_not_found" };
      }

      // Fetch course subjects
      const { data: courseSubjects, error: subjectsError } = await supabase
        .from("course_subjects")
        .select(`
          id,
          display_order,
          subject:popular_subjects(id, name, slug, thumbnail_url)
        `)
        .eq("course_id", courseId)
        .order("display_order");

      if (subjectsError) {
        console.error("Subjects fetch error:", subjectsError);
      }

      const subjects = (courseSubjects || [])
        .filter(cs => cs.subject)
        .map(cs => ({
          id: cs.subject.id,
          name: cs.subject.name,
          slug: cs.subject.slug,
          thumbnail_url: cs.subject.thumbnail_url,
        }));

      return { course, subjects, isEnrolled: true, error: null };
    },
    enabled: !!courseId,
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

      // Fetch topics for each chapter
      const chaptersWithTopics = await Promise.all(
        (chapters || []).map(async (chapter) => {
          const { data: topics } = await supabase
            .from("subject_topics")
            .select("id, title, topic_number, estimated_duration, content_markdown")
            .eq("chapter_id", chapter.id)
            .order("topic_number");

          return {
            ...chapter,
            topics: topics || [],
            progress: 0, // TODO: Calculate from student_progress
          };
        })
      );

      return chaptersWithTopics;
    },
    enabled: !!subjectId,
  });
};
