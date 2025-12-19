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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

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

      if (enrollError || !enrollments?.length) return [];

      const coursesWithSubjects: CourseWithSubjects[] = [];

      for (const enrollment of enrollments) {
        const course = enrollment.courses as any;
        if (!course) continue;

        // Get subjects for this course
        const { data: courseSubjects } = await supabase
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

        const subjects: SubjectWithDetails[] = [];

        for (const cs of courseSubjects || []) {
          const subject = cs.popular_subjects as any;
          if (!subject) continue;

          // Get chapters count for this subject
          const { count: chaptersTotal } = await supabase
            .from('subject_chapters')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id);

          // Get completed chapters for this student
          const { count: chaptersCompleted } = await supabase
            .from('student_progress')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', user.id)
            .eq('is_completed', true)
            .in('chapter_id', 
              (await supabase
                .from('subject_chapters')
                .select('id')
                .eq('subject_id', subject.id)
              ).data?.map(c => c.id) || []
            );

          // Get pending assignments for this subject's chapters
          const { data: subjectChapters } = await supabase
            .from('subject_chapters')
            .select('id')
            .eq('subject_id', subject.id);

          const chapterIds = subjectChapters?.map(c => c.id) || [];
          
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
            chaptersCompleted: chaptersCompleted || 0,
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

      return coursesWithSubjects;
    }
  });
};
