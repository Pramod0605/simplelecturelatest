import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EnrolledCourse {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
  short_description: string | null;
  duration_months: number | null;
  price_inr: number | null;
  enrolled_at: string;
  progress: number;
  categoryId: string | null;
  categoryName: string | null;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
}

export const useEnrolledCoursesWithCategories = () => {
  return useQuery({
    queryKey: ['enrolled-courses-with-categories'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      // Fetch enrollments with course details
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_at,
          course_id,
          courses (
            id,
            name,
            slug,
            thumbnail_url,
            short_description,
            duration_months,
            price_inr
          )
        `)
        .eq('student_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      if (!enrollments || enrollments.length === 0) return [];

      // Get course IDs for category lookup
      const courseIds = enrollments.map(e => e.course_id);

      // Fetch course categories
      const { data: courseCategories } = await supabase
        .from('course_categories')
        .select(`
          course_id,
          category_id,
          categories (
            id,
            name,
            slug,
            parent_id,
            level
          )
        `)
        .in('course_id', courseIds);

      // Build category mapping
      const categoriesByCourse: Record<string, any> = {};
      courseCategories?.forEach(cc => {
        const cat = cc.categories as any;
        if (cat && !categoriesByCourse[cc.course_id]) {
          categoriesByCourse[cc.course_id] = cat;
        }
      });

      // Get parent categories for subcategories
      const parentIds = Object.values(categoriesByCourse)
        .filter((cat: any) => cat.parent_id)
        .map((cat: any) => cat.parent_id);

      const { data: parentCategories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .in('id', parentIds);

      const parentMap: Record<string, any> = {};
      parentCategories?.forEach(p => {
        parentMap[p.id] = p;
      });

      // Calculate progress for each course
      const coursesWithProgress: EnrolledCourse[] = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = enrollment.courses as any;
          if (!course) return null;

          // Get chapters for this course
          const { data: chapters } = await supabase
            .from('chapters')
            .select('id')
            .eq('course_id', course.id);

          const chapterIds = chapters?.map(c => c.id) || [];
          
          // Get student progress
          let progress = 0;
          if (chapterIds.length > 0) {
            const { data: progressData } = await supabase
              .from('student_progress')
              .select('is_completed')
              .eq('student_id', user.id)
              .in('chapter_id', chapterIds);

            const completed = progressData?.filter(p => p.is_completed).length || 0;
            progress = chapterIds.length > 0 ? Math.round((completed / chapterIds.length) * 100) : 0;
          }

          const category = categoriesByCourse[course.id];
          const parentCategory = category?.parent_id ? parentMap[category.parent_id] : null;

          return {
            id: course.id,
            name: course.name,
            slug: course.slug,
            thumbnail_url: course.thumbnail_url,
            short_description: course.short_description,
            duration_months: course.duration_months,
            price_inr: course.price_inr,
            enrolled_at: enrollment.enrolled_at,
            progress,
            categoryId: category?.id || null,
            categoryName: category?.name || null,
            parentCategoryId: parentCategory?.id || category?.id || null,
            parentCategoryName: parentCategory?.name || category?.name || null,
          };
        })
      );

      return coursesWithProgress.filter(Boolean) as EnrolledCourse[];
    },
  });
};

// Hook to get user's enrolled course IDs for quick lookup
export const useEnrolledCourseIds = () => {
  return useQuery({
    queryKey: ['enrolled-course-ids'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return new Set<string>();

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('is_active', true);

      return new Set(enrollments?.map(e => e.course_id) || []);
    },
    staleTime: 60000, // Cache for 1 minute
  });
};
