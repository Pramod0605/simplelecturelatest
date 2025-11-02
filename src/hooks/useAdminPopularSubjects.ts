import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PopularSubject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAdminPopularSubjects = () => {
  return useQuery({
    queryKey: ["admin-popular-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popular_subjects")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as PopularSubject[];
    },
  });
};

export const useAdminSubject = (id?: string) => {
  return useQuery({
    queryKey: ["admin-subject", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("popular_subjects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as PopularSubject;
    },
    enabled: !!id,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subject: Omit<PopularSubject, "id" | "created_at" | "updated_at"> & { category_id: string }) => {
      const { data, error } = await supabase
        .from("popular_subjects")
        .insert(subject)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-popular-subjects"] });
      toast({
        title: "Success",
        description: "Subject created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subject",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...subject }: Partial<PopularSubject> & { id: string }) => {
      const { data, error } = await supabase
        .from("popular_subjects")
        .update(subject)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-popular-subjects"] });
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subject",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("popular_subjects").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-popular-subjects"] });
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject",
        variant: "destructive",
      });
    },
  });
};
