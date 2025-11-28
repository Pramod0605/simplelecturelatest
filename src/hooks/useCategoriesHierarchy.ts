import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  level: number;
  display_order: number;
  subcategories: CategoryHierarchy[];
}

export const useCategoriesHierarchy = () => {
  return useQuery({
    queryKey: ["categories-hierarchy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("level")
        .order("display_order");

      if (error) throw error;

      // Build hierarchy
      const level1Categories: CategoryHierarchy[] = [];
      const categoryMap = new Map<string, CategoryHierarchy>();

      // First pass: create all category objects
      data.forEach((cat) => {
        categoryMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          level: cat.level,
          display_order: cat.display_order || 0,
          subcategories: [],
        });
      });

      // Second pass: build hierarchy
      data.forEach((cat) => {
        const category = categoryMap.get(cat.id);
        if (!category) return;

        if (cat.level === 1) {
          level1Categories.push(category);
        } else if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.subcategories.push(category);
          }
        }
      });

      // Sort subcategories by display_order
      level1Categories.forEach((cat) => {
        cat.subcategories.sort((a, b) => a.display_order - b.display_order);
        cat.subcategories.forEach((subcat) => {
          subcat.subcategories.sort((a, b) => a.display_order - b.display_order);
        });
      });

      return level1Categories.sort((a, b) => a.display_order - b.display_order);
    },
  });
};
