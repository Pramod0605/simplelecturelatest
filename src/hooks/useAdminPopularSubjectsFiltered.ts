import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SubjectFilters {
  categoryId?: string;
  courseId?: string;
  searchTerm?: string;
}

export const useAdminPopularSubjectsFiltered = (filters: SubjectFilters) => {
  return useQuery({
    queryKey: ["admin-popular-subjects-filtered", filters],
    queryFn: async () => {
      // Fetch subjects with category join
      let query = supabase
        .from("popular_subjects")
        .select(`
          *,
          categories!inner(id, name)
        `)
        .order("display_order");

      // Apply category filter
      if (filters.categoryId && filters.categoryId !== "all") {
        query = query.eq("category_id", filters.categoryId);
      }

      // Apply subject name search
      if (filters.searchTerm) {
        query = query.ilike("name", `%${filters.searchTerm}%`);
      }

      const { data: subjects, error } = await query;
      if (error) throw error;

      // Fetch course mappings for all subjects
      const subjectIds = subjects?.map(s => s.id) || [];
      
      if (subjectIds.length === 0) {
        return [];
      }

      const { data: courseMappings } = await supabase
        .from("course_subjects")
        .select(`
          subject_id,
          courses(id, name)
        `)
        .in("subject_id", subjectIds);

      // Merge course data with subjects
      const subjectsWithCourses = subjects?.map(subject => ({
        ...subject,
        category_name: subject.categories?.name,
        courses: courseMappings
          ?.filter(cm => cm.subject_id === subject.id)
          ?.map(cm => cm.courses)
          ?.filter(Boolean) || []
      }));

      // Apply course filter (if selected)
      if (filters.courseId && filters.courseId !== "all") {
        return subjectsWithCourses?.filter(s => 
          s.courses.some((c: any) => c?.id === filters.courseId)
        );
      }

      return subjectsWithCourses;
    },
  });
};
