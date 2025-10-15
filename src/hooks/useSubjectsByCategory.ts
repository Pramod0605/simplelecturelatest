import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSubjectsByCategory = (categoryId?: string) => {
  return useQuery({
    queryKey: ["subjects-by-category", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];

      const { data, error } = await supabase
        .from("popular_subjects")
        .select(`
          *,
          subject_categories!inner(category_id)
        `)
        .eq("subject_categories.category_id", categoryId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });
};