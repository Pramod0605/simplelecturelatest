import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubjectWithDetails {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  thumbnail_url: string | null;
  chaptersTotal: number;
  chaptersCompleted: number;
  pendingAssignments: number;
}

export interface CourseWithSubjects {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
  subjects: SubjectWithDetails[];
}

export const useDashboardCourseDetails = () => {
  return useQuery({
    queryKey: ['dashboard-course-details'],
    queryFn: async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Error getting user:', userError);
          return [];
        }
        if (!user) {
          console.log('No user logged in');
          return [];
        }

        console.log('Fetching enrollments for user:', user.id);

        // Get enrolled courses
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select(`
            course_id,
            courses:course_id (
              id,
              name,
              slug,
              thumbnail_url
            )
          `)
          .eq('student_id', user.id)
          .eq('is_active', true);

        if (enrollError) {
          console.error('Error fetching enrollments:', enrollError);
          return [];
        }

        console.log('Enrollments found:', enrollments?.length || 0, enrollments);

        if (!enrollments?.length) {
          console.log('No active enrollments found');
          return [];
        }

        const coursesWithSubjects: CourseWithSubjects[] = [];

        for (const enrollment of enrollments) {
          // Handle both object and array response types from Supabase
          const course = Array.isArray(enrollment.courses) 
            ? enrollment.courses[0] 
            : enrollment.courses;
          
          if (!course) {
            console.warn('No course data for enrollment:', enrollment.course_id);
            continue;
          }

          console.log('Processing course:', course.name, course.id);

          // Get subjects for this course
          const { data: courseSubjects, error: subjectsError } = await supabase
            .from('course_subjects')
            .select(`
              subject_id,
              display_order,
              popular_subjects:subject_id (
                id,
                name,
                description,
                icon,
                thumbnail_url
              )
            `)
            .eq('course_id', course.id)
            .order('display_order');

          if (subjectsError) {
            console.error('Error fetching subjects for course:', course.id, subjectsError);
          }

          console.log('Subjects found for course:', course.name, courseSubjects?.length || 0);

          const subjects: SubjectWithDetails[] = [];

          for (const cs of courseSubjects || []) {
            // Handle both object and array response types
            const subject = Array.isArray(cs.popular_subjects)
              ? cs.popular_subjects[0]
              : cs.popular_subjects;
            
            if (!subject) {
              console.warn('No subject data for course_subject:', cs.subject_id);
              continue;
            }

            // Get chapters count for this subject
            const { count: chaptersTotal } = await supabase
              .from('subject_chapters')
              .select('*', { count: 'exact', head: true })
              .eq('subject_id', subject.id);

            // Get completed chapters for this student
            const { data: subjectChapters } = await supabase
              .from('subject_chapters')
              .select('id')
              .eq('subject_id', subject.id);

            const chapterIds = subjectChapters?.map(c => c.id) || [];
            
            let chaptersCompleted = 0;
            if (chapterIds.length > 0) {
              const { count } = await supabase
                .from('student_progress')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', user.id)
                .eq('is_completed', true)
                .in('chapter_id', chapterIds);
              chaptersCompleted = count || 0;
            }

            // Get pending assignments for this subject's chapters
            let pendingAssignments = 0;
            if (chapterIds.length > 0) {
              // Get assignments for these chapters
              const { data: assignments } = await supabase
                .from('assignments')
                .select('id')
                .eq('course_id', course.id)
                .in('chapter_id', chapterIds)
                .eq('is_active', true);

              const assignmentIds = assignments?.map(a => a.id) || [];

              if (assignmentIds.length > 0) {
                // Get submitted assignments
                const { data: submissions } = await supabase
                  .from('assignment_submissions')
                  .select('assignment_id')
                  .eq('student_id', user.id)
                  .in('assignment_id', assignmentIds);

                const submittedIds = new Set(submissions?.map(s => s.assignment_id) || []);
                pendingAssignments = assignmentIds.filter(id => !submittedIds.has(id)).length;
              }
            }

            subjects.push({
              id: subject.id,
              name: subject.name,
              description: subject.description,
              icon: subject.icon,
              thumbnail_url: subject.thumbnail_url,
              chaptersTotal: chaptersTotal || 0,
              chaptersCompleted,
              pendingAssignments
            });
          }

          coursesWithSubjects.push({
            id: course.id,
            name: course.name,
            slug: course.slug,
            thumbnail_url: course.thumbnail_url,
            subjects
          });
        }

        console.log('Final courses with subjects:', coursesWithSubjects.length);
        return coursesWithSubjects;
      } catch (error) {
        console.error('Error in useDashboardCourseDetails:', error);
        return [];
      }
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
  });
};
