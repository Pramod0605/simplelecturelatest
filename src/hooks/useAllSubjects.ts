import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAllSubjects = () => {
  return useQuery({
    queryKey: ["all-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popular_subjects")
        .select(`
          id,
          name,
          category_id,
          categories(id, name)
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
};
