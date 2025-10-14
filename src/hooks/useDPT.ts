import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';

export interface DPTSubmission {
  id: string;
  test_date: string;
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  submitted_at: string;
}

export const useDPT = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dpt-submissions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch last 30 days of DPT submissions
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data: submissions, error } = await supabase
        .from('dpt_submissions')
        .select('*')
        .eq('student_id', user.id)
        .gte('test_date', thirtyDaysAgo)
        .order('test_date', { ascending: false });

      if (error) throw error;

      // Calculate streak
      let streak = 0;
      const today = format(new Date(), 'yyyy-MM-dd');
      const submissionDates = new Set((submissions || []).map(s => s.test_date));
      
      let checkDate = new Date();
      while (submissionDates.has(format(checkDate, 'yyyy-MM-dd'))) {
        streak++;
        checkDate = subDays(checkDate, 1);
      }

      // Calculate average score
      const totalScore = submissions?.reduce((acc, s) => acc + (s.score || 0), 0) || 0;
      const averageScore = submissions?.length ? Math.round(totalScore / submissions.length) : 0;

      // Calculate completion rate (days with submission in last 30 days)
      const completionRate = submissions?.length ? Math.round((submissions.length / 30) * 100) : 0;

      // Check if today's DPT is completed
      const todayCompleted = submissionDates.has(today);

      // Prepare weekly data for graph (last 7 days)
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const daySubmission = submissions?.find(s => s.test_date === date);
        const dayName = format(subDays(new Date(), i), 'EEE');
        
        weeklyData.push({
          day: dayName,
          date,
          score: daySubmission?.score || 0,
          completed: !!daySubmission,
        });
      }

      return {
        submissions: submissions || [],
        streak,
        averageScore,
        completionRate,
        todayCompleted,
        weeklyData,
        totalTests: submissions?.length || 0,
      };
    },
  });

  return {
    submissions: data?.submissions || [],
    streak: data?.streak || 0,
    averageScore: data?.averageScore || 0,
    completionRate: data?.completionRate || 0,
    todayCompleted: data?.todayCompleted || false,
    weeklyData: data?.weeklyData || [],
    totalTests: data?.totalTests || 0,
    isLoading,
  };
};
