import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryWithSubjects {
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
  parent_name?: string;
  display_name: string; // "Subcategory - Parent" or just "Category"
}

export const useCategoriesWithSubjects = () => {
  return useQuery({
    queryKey: ["categories-with-subjects"],
    queryFn: async () => {
      // Get all categories that have subjects
      const { data: categoriesWithSubjects, error: catError } = await supabase
        .from("categories")
        .select(`
          *,
          popular_subjects!inner(id)
        `)
        .eq("is_active", true)
        .order("level")
        .order("display_order");

      if (catError) throw catError;

      // Get unique categories (since join might create duplicates)
      const uniqueCategories = categoriesWithSubjects.reduce((acc, cat) => {
        if (!acc.find(c => c.id === cat.id)) {
          acc.push(cat);
        }
        return acc;
      }, [] as any[]);

      // Build parent names and display names
      const categoriesWithDisplay = uniqueCategories.map((cat) => {
        const parent = uniqueCategories.find((p) => p.id === cat.parent_id);
        const display_name = parent 
          ? `${cat.name} - ${parent.name}` 
          : cat.name;

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          description: cat.description,
          parent_id: cat.parent_id,
          level: cat.level,
          display_order: cat.display_order,
          is_popular: cat.is_popular,
          is_active: cat.is_active,
          parent_name: parent?.name,
          display_name,
        } as CategoryWithSubjects;
      });

      return categoriesWithDisplay;
    },
  });
};
