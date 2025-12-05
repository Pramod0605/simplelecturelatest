import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCoursesByHierarchy = (
  parentCategoryId?: string,
  subCategoryId?: string,
  subSubCategoryId?: string
) => {
  return useQuery({
    queryKey: ["courses-by-hierarchy", parentCategoryId, subCategoryId, subSubCategoryId],
    queryFn: async () => {
      // If sub-sub-category is selected, filter only by that
      if (subSubCategoryId) {
        const { data, error } = await supabase
          .from("courses")
          .select(`
            *,
            course_categories!inner(category_id)
          `)
          .eq("course_categories.category_id", subSubCategoryId)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      }

      // If sub-category is selected, get courses from sub-category and its children (level 3)
      if (subCategoryId) {
        // First get all level 3 children of this sub-category
        const { data: childCategories, error: childError } = await supabase
          .from("categories")
          .select("id")
          .eq("parent_id", subCategoryId)
          .eq("is_active", true);

        if (childError) throw childError;

        const categoryIds = [subCategoryId, ...(childCategories?.map(c => c.id) || [])];

        const { data, error } = await supabase
          .from("courses")
          .select(`
            *,
            course_categories!inner(category_id)
          `)
          .in("course_categories.category_id", categoryIds)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Remove duplicates (course might be in multiple categories)
        const uniqueCourses = data?.reduce((acc, course) => {
          if (!acc.find(c => c.id === course.id)) {
            acc.push(course);
          }
          return acc;
        }, [] as typeof data) || [];

        return uniqueCourses;
      }

      // If parent category is selected, get courses from parent + all level 2 + all level 3 descendants
      if (parentCategoryId) {
        // Get all level 2 children
        const { data: level2Categories, error: level2Error } = await supabase
          .from("categories")
          .select("id")
          .eq("parent_id", parentCategoryId)
          .eq("is_active", true);

        if (level2Error) throw level2Error;

        const level2Ids = level2Categories?.map(c => c.id) || [];

        // Get all level 3 grandchildren
        let level3Ids: string[] = [];
        if (level2Ids.length > 0) {
          const { data: level3Categories, error: level3Error } = await supabase
            .from("categories")
            .select("id")
            .in("parent_id", level2Ids)
            .eq("is_active", true);

          if (level3Error) throw level3Error;
          level3Ids = level3Categories?.map(c => c.id) || [];
        }

        const allCategoryIds = [parentCategoryId, ...level2Ids, ...level3Ids];

        const { data, error } = await supabase
          .from("courses")
          .select(`
            *,
            course_categories!inner(category_id)
          `)
          .in("course_categories.category_id", allCategoryIds)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Remove duplicates
        const uniqueCourses = data?.reduce((acc, course) => {
          if (!acc.find(c => c.id === course.id)) {
            acc.push(course);
          }
          return acc;
        }, [] as typeof data) || [];

        return uniqueCourses;
      }

      // No category selected - return all active courses (Most Popular)
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_active", true)
        .order("student_count", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });
};
