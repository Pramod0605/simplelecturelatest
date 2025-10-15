import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Holiday {
  id: string;
  date: string;
  name: string;
  description: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export const useHolidays = () => {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      return data as Holiday[];
    },
  });
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holiday: Omit<Holiday, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("holidays")
        .insert(holiday)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add holiday");
    },
  });
};

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...holiday }: Partial<Holiday> & { id: string }) => {
      const { data, error } = await supabase
        .from("holidays")
        .update(holiday)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update holiday");
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("holidays")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete holiday");
    },
  });
};
