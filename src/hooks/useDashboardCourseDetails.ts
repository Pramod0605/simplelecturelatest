import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAuthUser } from './useCurrentAuthUser';
import { useStudentCourseIds } from './useStudentEnrollments';

export interface SubjectWithDetails {
  id: string;
  name: string;
  description: string | null;
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
  const { data: user } = useCurrentAuthUser();
  const { courseIds, isLoading: enrollmentsLoading } = useStudentCourseIds();

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['dashboard-course-details', user?.id, courseIds],
    queryFn: async () => {
      if (!user || courseIds.length === 0) return [];

      // Batch 1: Get all courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name, slug, thumbnail_url')
        .in('id', courseIds);

      if (!courses?.length) return [];

      // Batch 2: Get all course subjects at once
      const { data: courseSubjects } = await supabase
        .from('course_subjects')
        .select(`
          course_id,
          subject_id,
          display_order,
          popular_subjects:subject_id (
            id,
            name,
            description,
            thumbnail_url
          )
        `)
        .in('course_id', courseIds)
        .order('display_order');

      const allSubjectIds = [...new Set(courseSubjects?.map(cs => cs.subject_id) || [])];
      
      if (allSubjectIds.length === 0) {
        return courses.map(course => ({
          id: course.id,
          name: course.name,
          slug: course.slug,
          thumbnail_url: course.thumbnail_url,
          subjects: [],
        }));
      }

      // Batch 3: Get all chapters for all subjects at once
      const { data: allChapters } = await supabase
        .from('subject_chapters')
        .select('id, subject_id')
        .in('subject_id', allSubjectIds);

      const chaptersBySubject = new Map<string, string[]>();
      allChapters?.forEach(ch => {
        const existing = chaptersBySubject.get(ch.subject_id) || [];
        existing.push(ch.id);
        chaptersBySubject.set(ch.subject_id, existing);
      });

      const allChapterIds = allChapters?.map(c => c.id) || [];

      // Batch 4: Get all student progress at once
      let completedChaptersSet = new Set<string>();
      if (allChapterIds.length > 0) {
        const { data: progress } = await supabase
          .from('student_progress')
          .select('chapter_id')
          .eq('student_id', user.id)
          .eq('is_completed', true)
          .in('chapter_id', allChapterIds);

        completedChaptersSet = new Set(progress?.map(p => p.chapter_id) || []);
      }

      // Batch 5: Get all assignments at once
      const { data: allAssignments } = await supabase
        .from('assignments')
        .select('id, chapter_id, course_id')
        .in('course_id', courseIds)
        .eq('is_active', true);

      const assignmentIds = allAssignments?.map(a => a.id) || [];

      // Batch 6: Get all submissions at once
      let submittedAssignmentIds = new Set<string>();
      if (assignmentIds.length > 0) {
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('assignment_id')
          .eq('student_id', user.id)
          .in('assignment_id', assignmentIds);

        submittedAssignmentIds = new Set(submissions?.map(s => s.assignment_id) || []);
      }

      // Process all data in memory
      const coursesWithSubjects: CourseWithSubjects[] = courses.map(course => {
        const subjects = (courseSubjects || [])
          .filter(cs => cs.course_id === course.id)
          .map(cs => {
            const subject = Array.isArray(cs.popular_subjects)
              ? cs.popular_subjects[0]
              : cs.popular_subjects;

            if (!subject) return null;

            const subjectChapterIds = chaptersBySubject.get(subject.id) || [];
            const chaptersTotal = subjectChapterIds.length;
            const chaptersCompleted = subjectChapterIds.filter(id => completedChaptersSet.has(id)).length;

            // Count pending assignments for this subject's chapters
            const subjectAssignments = (allAssignments || []).filter(
              a => a.course_id === course.id && a.chapter_id && subjectChapterIds.includes(a.chapter_id)
            );
            const pendingAssignments = subjectAssignments.filter(
              a => !submittedAssignmentIds.has(a.id)
            ).length;

            return {
              id: subject.id,
              name: subject.name,
              description: subject.description,
              thumbnail_url: subject.thumbnail_url,
              chaptersTotal,
              chaptersCompleted,
              pendingAssignments,
            } as SubjectWithDetails;
          })
          .filter(Boolean) as SubjectWithDetails[];

        return {
          id: course.id,
          name: course.name,
          slug: course.slug,
          thumbnail_url: course.thumbnail_url,
          subjects,
        };
      });

      return coursesWithSubjects;
    },
    enabled: !!user && courseIds.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    data: data || [],
    isLoading: enrollmentsLoading || queryLoading,
  };
};
