import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UsePaginatedCoursesOptions {
  page: number;
  pageSize: number;
  searchQuery?: string;
  categoryId?: string;
  subcategoryId?: string;
  sortBy?: "newest" | "popular" | "price-low" | "price-high";
}

interface PaginatedResult {
  courses: any[];
  totalCount: number;
  totalPages: number;
}

export const usePaginatedCourses = ({
  page,
  pageSize,
  searchQuery,
  categoryId,
  subcategoryId,
  sortBy = "newest",
}: UsePaginatedCoursesOptions) => {
  return useQuery({
    queryKey: ["paginated-courses", page, pageSize, searchQuery, categoryId, subcategoryId, sortBy],
    queryFn: async (): Promise<PaginatedResult> => {
      const offset = (page - 1) * pageSize;

      // Build the category IDs array if filtering by category
      let categoryIds: string[] = [];
      
      if (subcategoryId) {
        // If subcategory selected, get it and its children (level 3)
        const { data: childCats } = await supabase
          .from("categories")
          .select("id")
          .eq("parent_id", subcategoryId)
          .eq("is_active", true);
        
        categoryIds = [subcategoryId, ...(childCats?.map(c => c.id) || [])];
      } else if (categoryId) {
        // If parent category selected, get all descendants
        const { data: level2Cats } = await supabase
          .from("categories")
          .select("id")
          .eq("parent_id", categoryId)
          .eq("is_active", true);
        
        const level2Ids = level2Cats?.map(c => c.id) || [];
        
        let level3Ids: string[] = [];
        if (level2Ids.length > 0) {
          const { data: level3Cats } = await supabase
            .from("categories")
            .select("id")
            .in("parent_id", level2Ids)
            .eq("is_active", true);
          level3Ids = level3Cats?.map(c => c.id) || [];
        }
        
        categoryIds = [categoryId, ...level2Ids, ...level3Ids];
      }

      // Build query for counting
      let countQuery = supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      // Build query for fetching
      let dataQuery = supabase
        .from("courses")
        .select("*")
        .eq("is_active", true);

      // Apply search filter
      if (searchQuery && searchQuery.trim()) {
        const search = `%${searchQuery.trim()}%`;
        countQuery = countQuery.or(`name.ilike.${search},short_description.ilike.${search},description.ilike.${search}`);
        dataQuery = dataQuery.or(`name.ilike.${search},short_description.ilike.${search},description.ilike.${search}`);
      }

      // Apply category filter if we have category IDs
      if (categoryIds.length > 0) {
        // For category filtering, we need to join with course_categories
        const { data: coursesInCategories } = await supabase
          .from("course_categories")
          .select("course_id")
          .in("category_id", categoryIds);
        
        const courseIdsInCategory = [...new Set(coursesInCategories?.map(cc => cc.course_id) || [])];
        
        if (courseIdsInCategory.length > 0) {
          countQuery = countQuery.in("id", courseIdsInCategory);
          dataQuery = dataQuery.in("id", courseIdsInCategory);
        } else {
          // No courses in selected categories
          return { courses: [], totalCount: 0, totalPages: 0 };
        }
      }

      // Apply sorting
      switch (sortBy) {
        case "popular":
          dataQuery = dataQuery.order("student_count", { ascending: false, nullsFirst: false });
          break;
        case "price-low":
          dataQuery = dataQuery.order("price_inr", { ascending: true, nullsFirst: false });
          break;
        case "price-high":
          dataQuery = dataQuery.order("price_inr", { ascending: false, nullsFirst: false });
          break;
        case "newest":
        default:
          dataQuery = dataQuery.order("created_at", { ascending: false });
      }

      // Apply pagination
      dataQuery = dataQuery.range(offset, offset + pageSize - 1);

      // Execute both queries
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery,
      ]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      const totalCount = countResult.count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        courses: dataResult.data || [],
        totalCount,
        totalPages,
      };
    },
    staleTime: 30000, // Cache for 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
};

// Hook for global search across all courses (for header search)
export const useSearchCourses = (searchQuery: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["search-courses", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        return [];
      }

      const search = `%${searchQuery.trim()}%`;
      const { data, error } = await supabase
        .from("courses")
        .select("id, name, slug, thumbnail_url, price_inr, short_description")
        .eq("is_active", true)
        .or(`name.ilike.${search},short_description.ilike.${search}`)
        .order("student_count", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: searchQuery.trim().length >= 2,
    staleTime: 60000, // Cache search results for 1 minute
  });
};
