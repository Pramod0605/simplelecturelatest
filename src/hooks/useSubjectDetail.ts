import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSubjectDetail = (subjectSlug?: string) => {
  return useQuery({
    queryKey: ["subject-detail", subjectSlug],
    queryFn: async () => {
      if (!subjectSlug) return null;

      const { data, error } = await supabase
        .from("popular_subjects")
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq("slug", subjectSlug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!subjectSlug,
  });
};

export const useSubjectChapterTopics = (subjectId?: string) => {
  return useQuery({
    queryKey: ["subject-chapters-topics", subjectId],
    queryFn: async (): Promise<any[]> => {
      if (!subjectId) return [];

      // @ts-ignore - Bypass deep type recursion issue
      const { data: chapters, error: chaptersError } = await supabase
        .from("subject_chapters")
        .select("*")
        .eq("subject_id", subjectId)
        .order("sequence_order");

      if (chaptersError) throw chaptersError;
      if (!chapters) return [];

      const results = [];
      for (const chapter of chapters) {
        // @ts-ignore - Bypass deep type recursion issue
        const { data: topics, error: topicsError } = await supabase
          .from("subject_topics")
          .select("*")
          .eq("chapter_id", chapter.id)
          .order("sequence_order");

        if (topicsError) throw topicsError;

        results.push({
          ...chapter,
          subject_topics: topics || [],
        });
      }

      return results;
    },
    enabled: !!subjectId,
  });
};

export const useCheckSubjectEnrollment = (subjectId?: string) => {
  return useQuery({
    queryKey: ["subject-enrollment", subjectId],
    queryFn: async () => {
      if (!subjectId) return { isEnrolled: false, courses: [] };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isEnrolled: false, courses: [] };

      // Get courses that have this subject
      const { data: courseSubjects, error: csError } = await supabase
        .from("course_subjects")
        .select(`
          course_id,
          courses (
            id,
            name,
            slug
          )
        `)
        .eq("subject_id", subjectId);

      if (csError) throw csError;

      if (!courseSubjects || courseSubjects.length === 0) {
        return { isEnrolled: false, courses: [] };
      }

      const courseIds = courseSubjects.map((cs: any) => cs.course_id);

      // Check if user is enrolled in any of these courses
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("course_id, is_active")
        .eq("student_id", user.id)
        .in("course_id", courseIds)
        .eq("is_active", true);

      if (enrollError) throw enrollError;

      const isEnrolled = enrollments && enrollments.length > 0;
      const courses = courseSubjects
        .filter((cs: any) => 
          enrollments?.some((e: any) => e.course_id === cs.course_id)
        )
        .map((cs: any) => cs.courses);

      return { isEnrolled, courses };
    },
    enabled: !!subjectId,
  });
};
