import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parent_id?: string;
  level: number;
  display_order: number;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent_name?: string;
  goal_ids?: string[];
}

export const useAdminCategories = () => {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("level")
        .order("display_order");

      if (error) throw error;

      // Build parent names
      const categoriesWithParents = data.map((cat) => {
        const parent = data.find((p) => p.id === cat.parent_id);
        return {
          ...cat,
          parent_name: parent?.name,
        };
      });

      return categoriesWithParents as Category[];
    },
  });
};

export const useAdminCategory = (id?: string) => {
  return useQuery({
    queryKey: ["admin-category", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch associated goals
      const { data: goals } = await supabase
        .from("category_goals")
        .select("goal_id")
        .eq("category_id", id);

      return {
        ...data,
        goal_ids: goals?.map((g) => g.goal_id) || [],
      } as Category;
    },
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: Omit<Category, "id" | "created_at" | "updated_at">) => {
      const { goal_ids, ...categoryData } = category;

      const { data, error } = await supabase
        .from("categories")
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;

      // Associate goals
      if (goal_ids && goal_ids.length > 0) {
        const goalAssociations = goal_ids.map((goal_id) => ({
          category_id: data.id,
          goal_id,
        }));

        await supabase.from("category_goals").insert(goalAssociations);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<Category> & { id: string }) => {
      const { goal_ids, ...categoryData } = category;

      const { data, error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update goals
      if (goal_ids !== undefined) {
        await supabase.from("category_goals").delete().eq("category_id", id);

        if (goal_ids.length > 0) {
          const goalAssociations = goal_ids.map((goal_id) => ({
            category_id: id,
            goal_id,
          }));

          await supabase.from("category_goals").insert(goalAssociations);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });
};
