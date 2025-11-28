import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useExploreByGoalPublic = () => {
  return useQuery({
    queryKey: ["explore-by-goal-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("explore_by_goal")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });
};

export const useCoursesByGoal = (goalSlug?: string, categoryId?: string) => {
  return useQuery({
    queryKey: ["courses-by-goal", goalSlug, categoryId],
    queryFn: async () => {
      if (!goalSlug) return null;

      // First get the goal
      const { data: goal, error: goalError } = await supabase
        .from("explore_by_goal")
        .select("id, name, description")
        .eq("slug", goalSlug)
        .eq("is_active", true)
        .single();

      if (goalError) throw goalError;

      // Then get courses mapped to this goal
      let query = supabase
        .from("course_goals")
        .select(`
          courses (
            id,
            name,
            slug,
            thumbnail_url,
            short_description,
            price_inr,
            original_price_inr,
            duration_months,
            student_count,
            rating,
            is_active,
            course_categories!inner (
              category_id
            ),
            course_subjects (
              id
            )
          )
        `)
        .eq("goal_id", goal.id);

      const { data: coursesData, error: coursesError } = await query;

      if (coursesError) throw coursesError;

      // Filter by category if provided
      let courses = coursesData
        ?.map((cg: any) => cg.courses)
        .filter((c: any) => c?.is_active);

      if (categoryId && categoryId !== "all") {
        courses = courses?.filter((course: any) =>
          course.course_categories?.some((cc: any) => cc.category_id === categoryId)
        );
      }

      return { goal, courses: courses || [] };
    },
    enabled: !!goalSlug,
  });
};
