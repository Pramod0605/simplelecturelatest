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
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          return [];
        }
        
        if (!user) {
          console.log('No user logged in');
          return [];
        }

        console.log('Fetching enrolled courses for user:', user.id);

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

        if (error) {
          console.error('Error fetching enrollments:', error);
          throw error;
        }
        
        console.log('Enrollments found:', enrollments?.length || 0, enrollments);
        
        if (!enrollments || enrollments.length === 0) return [];

        // Get course IDs for bulk queries
        const courseIds = enrollments.map(e => e.course_id);

        // Bulk fetch course categories, chapters, and progress in parallel
        const [categoriesResult, chaptersResult] = await Promise.all([
          supabase
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
            .in('course_id', courseIds),
          supabase
            .from('chapters')
            .select('id, course_id')
            .in('course_id', courseIds)
        ]);

        const courseCategories = categoriesResult.data || [];
        const allChapters = chaptersResult.data || [];

        // Build category mapping
        const categoriesByCourse: Record<string, any> = {};
        courseCategories.forEach(cc => {
          const cat = cc.categories as any;
          if (cat && !categoriesByCourse[cc.course_id]) {
            categoriesByCourse[cc.course_id] = cat;
          }
        });

        // Get parent categories for subcategories
        const parentIds = Object.values(categoriesByCourse)
          .filter((cat: any) => cat.parent_id)
          .map((cat: any) => cat.parent_id);

        // Build chapter IDs list for bulk progress fetch
        const allChapterIds = allChapters.map(c => c.id);

        // Fetch parent categories and student progress in parallel
        const [parentCategoriesResult, progressResult] = await Promise.all([
          parentIds.length > 0
            ? supabase
                .from('categories')
                .select('id, name, slug')
                .in('id', parentIds)
            : Promise.resolve({ data: [] }),
          allChapterIds.length > 0
            ? supabase
                .from('student_progress')
                .select('chapter_id, is_completed')
                .eq('student_id', user.id)
                .in('chapter_id', allChapterIds)
            : Promise.resolve({ data: [] })
        ]);

        // Build parent category map
        const parentMap: Record<string, any> = {};
        (parentCategoriesResult.data || []).forEach(p => {
          parentMap[p.id] = p;
        });

        // Build chapters by course map
        const chaptersByCourse: Record<string, string[]> = {};
        allChapters.forEach(ch => {
          if (!chaptersByCourse[ch.course_id]) {
            chaptersByCourse[ch.course_id] = [];
          }
          chaptersByCourse[ch.course_id].push(ch.id);
        });

        // Build completed chapters set
        const completedChapters = new Set(
          (progressResult.data || [])
            .filter(p => p.is_completed)
            .map(p => p.chapter_id)
        );

        // Calculate progress for each course using in-memory data
        const coursesWithProgress: EnrolledCourse[] = enrollments
          .map((enrollment) => {
            // Handle both object and array response types from Supabase
            const course = Array.isArray(enrollment.courses)
              ? enrollment.courses[0]
              : enrollment.courses;
            
            if (!course) {
              console.warn('No course data for enrollment:', enrollment.course_id);
              return null;
            }

            // Calculate progress from cached data
            const courseChapterIds = chaptersByCourse[course.id] || [];
            let progress = 0;
            if (courseChapterIds.length > 0) {
              const completed = courseChapterIds.filter(id => completedChapters.has(id)).length;
              progress = Math.round((completed / courseChapterIds.length) * 100);
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
          .filter(Boolean) as EnrolledCourse[];

        console.log('Processed enrolled courses:', coursesWithProgress.length);
        return coursesWithProgress;
      } catch (error) {
        console.error('Error in useEnrolledCoursesWithCategories:', error);
        return [];
      }
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
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
