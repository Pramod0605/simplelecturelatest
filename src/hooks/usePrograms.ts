import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const programKeys = {
  all: ["programs"] as const,
  lists: () => [...programKeys.all, "list"] as const,
  list: (filters: string) => [...programKeys.lists(), { filters }] as const,
  details: () => [...programKeys.all, "detail"] as const,
  detail: (id: string) => [...programKeys.details(), id] as const,
};

export const usePrograms = (category?: string) => {
  return useQuery({
    queryKey: category ? programKeys.list(category) : programKeys.lists(),
    queryFn: async () => {
      let query = supabase
        .from("programs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });
};

export const useProgram = (programId: string) => {
  return useQuery({
    queryKey: programKeys.detail(programId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select(`
          *,
          courses(
            *,
            chapters(count)
          )
        `)
        .eq("id", programId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!programId,
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });
};
