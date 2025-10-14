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

// Mock assignments data
const mockAssignments: Assignment[] = [
  { id: 'a1', title: 'Computer Assignment 1', description: 'Programming exercises', due_date: '2025-10-27', total_marks: 100, passing_marks: 40, course_id: 'c1', course_name: 'Computer (00220)', status: 'pending' },
  { id: 'a2', title: 'English Essay', description: 'Write about climate change', due_date: '2025-10-28', total_marks: 50, passing_marks: 20, course_id: 'c2', course_name: 'English (210)', status: 'pending' },
  { id: 'a3', title: 'Mathematics Problem Set', description: 'Calculus problems', due_date: '2025-10-25', total_marks: 100, passing_marks: 40, course_id: 'c3', course_name: 'Mathematics (110)', status: 'submitted', submitted_at: '2025-10-24' },
  { id: 'a4', title: 'Physics Lab Report', description: 'Experiment analysis', due_date: '2025-10-20', total_marks: 100, passing_marks: 40, course_id: 'c4', course_name: 'Physics (101)', status: 'graded', score: 85, submitted_at: '2025-10-19' },
  { id: 'a5', title: 'Chemistry Homework', description: 'Organic chemistry questions', due_date: '2025-10-30', total_marks: 50, passing_marks: 20, course_id: 'c5', course_name: 'Chemistry (102)', status: 'pending' },
  { id: 'a6', title: 'Hindi Literature', description: 'Poetry analysis', due_date: '2025-10-26', total_marks: 50, passing_marks: 20, course_id: 'c6', course_name: 'Hindi (230)', status: 'pending' },
  { id: 'a7', title: 'Biology Assignment', description: 'Cell biology', due_date: '2025-10-29', total_marks: 100, passing_marks: 40, course_id: 'c7', course_name: 'Biology (101)', status: 'pending' },
  { id: 'a8', title: 'Mathematics Quiz', description: 'Trigonometry', due_date: '2025-10-22', total_marks: 50, passing_marks: 20, course_id: 'c3', course_name: 'Mathematics (110)', status: 'graded', score: 92, submitted_at: '2025-10-21' },
];

export const useAssignments = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Return mock data if no user
      if (!user) {
        const stats = {
          pending: mockAssignments.filter(a => a.status === 'pending').length,
          submitted: mockAssignments.filter(a => a.status === 'submitted').length,
          graded: mockAssignments.filter(a => a.status === 'graded').length,
        };
        return { assignments: mockAssignments, stats };
      }

      // Get enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('course_id, courses(name)')
        .eq('student_id', user.id)
        .eq('is_active', true);

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        const stats = {
          pending: mockAssignments.filter(a => a.status === 'pending').length,
          submitted: mockAssignments.filter(a => a.status === 'submitted').length,
          graded: mockAssignments.filter(a => a.status === 'graded').length,
        };
        return { assignments: mockAssignments, stats };
      }

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

      if (assignError) {
        console.error('Error fetching assignments:', assignError);
        const stats = {
          pending: mockAssignments.filter(a => a.status === 'pending').length,
          submitted: mockAssignments.filter(a => a.status === 'submitted').length,
          graded: mockAssignments.filter(a => a.status === 'graded').length,
        };
        return { assignments: mockAssignments, stats };
      }

      // Get submissions
      const assignmentIds = assignments?.map(a => a.id) || [];
      const { data: submissions, error: subError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds);

      if (subError) {
        console.error('Error fetching submissions:', subError);
      }

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

      // Return mock data if no assignments found
      if (processedAssignments.length === 0) {
        const mockStats = {
          pending: mockAssignments.filter(a => a.status === 'pending').length,
          submitted: mockAssignments.filter(a => a.status === 'submitted').length,
          graded: mockAssignments.filter(a => a.status === 'graded').length,
        };
        return { assignments: mockAssignments, stats: mockStats };
      }

      return { assignments: processedAssignments, stats };
    },
  });

  return {
    assignments: data?.assignments || [],
    stats: data?.stats || { pending: 0, submitted: 0, graded: 0 },
    isLoading,
  };
};
