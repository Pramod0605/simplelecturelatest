import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults for all queries
      staleTime: 1000 * 60 * 5, // 5 minutes default
      gcTime: 1000 * 60 * 30, // 30 minutes in cache
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Prefetch strategies for common data
export const prefetchPrograms = async () => {
  await queryClient.prefetchQuery({
    queryKey: ["programs", "list"],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("programs")
        .select("*")
        .eq("is_active", true);
      return data;
    },
  });
};

export const prefetchCourses = async (programId: string) => {
  await queryClient.prefetchQuery({
    queryKey: ["courses", "list", { filters: programId }],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("program_id", programId)
        .eq("is_active", true);
      return data;
    },
  });
};
