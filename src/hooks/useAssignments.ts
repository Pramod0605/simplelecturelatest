import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAuthUser } from './useCurrentAuthUser';
import { useStudentCourseIds } from './useStudentEnrollments';

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  total_marks: number;
  passing_marks: number;
  course_id: string;
  course_name?: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  submitted_at?: string;
}

const emptyStats = { pending: 0, submitted: 0, graded: 0 };

export const useAssignments = () => {
  const { data: user } = useCurrentAuthUser();
  const { courseIds, isLoading: enrollmentsLoading } = useStudentCourseIds();

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['student-assignments', user?.id, courseIds],
    queryFn: async () => {
      if (!user || courseIds.length === 0) {
        return { assignments: [], stats: emptyStats };
      }

      // Get course names
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name')
        .in('id', courseIds);

      const courseMap = new Map(courses?.map(c => [c.id, c.name]) || []);

      // Get assignments for enrolled courses
      const { data: assignments, error: assignError } = await supabase
        .from('assignments')
        .select('*')
        .in('course_id', courseIds)
        .eq('is_active', true)
        .order('due_date', { ascending: true });

      if (assignError) {
        console.error('Error fetching assignments:', assignError);
        return { assignments: [], stats: emptyStats };
      }

      const assignmentIds = assignments?.map(a => a.id) || [];
      
      if (assignmentIds.length === 0) {
        return { assignments: [], stats: emptyStats };
      }

      // Get submissions
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds);

      const submissionsMap = new Map(submissions?.map(s => [s.assignment_id, s]) || []);

      const processedAssignments: Assignment[] = (assignments || []).map(assignment => {
        const submission = submissionsMap.get(assignment.id);

        let status: 'pending' | 'submitted' | 'graded' = 'pending';
        if (submission) {
          status = submission.graded_at ? 'graded' : 'submitted';
        }

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          total_marks: assignment.total_marks,
          passing_marks: assignment.passing_marks,
          course_id: assignment.course_id,
          course_name: courseMap.get(assignment.course_id),
          status,
          score: submission?.score,
          submitted_at: submission?.submitted_at,
        };
      });

      const stats = {
        pending: processedAssignments.filter(a => a.status === 'pending').length,
        submitted: processedAssignments.filter(a => a.status === 'submitted').length,
        graded: processedAssignments.filter(a => a.status === 'graded').length,
      };

      return { assignments: processedAssignments, stats };
    },
    enabled: !!user && courseIds.length > 0,
  });

  return {
    assignments: data?.assignments || [],
    stats: data?.stats || emptyStats,
    isLoading: enrollmentsLoading || queryLoading,
  };
};
