import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useAssignments = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { assignments: [], stats: { pending: 0, submitted: 0, graded: 0 } };

      // Get enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('course_id, courses(name)')
        .eq('student_id', user.id)
        .eq('is_active', true);

      if (enrollError) throw enrollError;

      const courseIds = enrollments?.map(e => e.course_id) || [];

      if (courseIds.length === 0) {
        return { assignments: [], stats: { pending: 0, submitted: 0, graded: 0 } };
      }

      // Get assignments for enrolled courses
      const { data: assignments, error: assignError } = await supabase
        .from('assignments')
        .select('*')
        .in('course_id', courseIds)
        .eq('is_active', true)
        .order('due_date', { ascending: true });

      if (assignError) throw assignError;

      // Get submissions
      const assignmentIds = assignments?.map(a => a.id) || [];
      const { data: submissions, error: subError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds);

      if (subError) throw subError;

      const submissionsMap = new Map(submissions?.map(s => [s.assignment_id, s]) || []);

      const processedAssignments: Assignment[] = (assignments || []).map(assignment => {
        const submission = submissionsMap.get(assignment.id);
        const courseName = enrollments?.find(e => e.course_id === assignment.course_id)?.courses?.name;

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
          course_name: courseName,
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
  });

  return {
    assignments: data?.assignments || [],
    stats: data?.stats || { pending: 0, submitted: 0, graded: 0 },
    isLoading,
  };
};
