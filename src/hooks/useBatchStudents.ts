import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBatchStudents = (batchId?: string) => {
  return useQuery({
    queryKey: ['batch-students', batchId],
    queryFn: async () => {
      if (!batchId) return [];

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          enrolled_at,
          is_active,
          batch_id,
          profiles:student_id (
            id,
            full_name,
            avatar_url,
            phone_number
          )
        `)
        .eq('batch_id', batchId)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!batchId,
  });
};

export const useStudentBatchInfo = () => {
  return useQuery({
    queryKey: ['student-batch-info'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          batch_id,
          enrolled_at,
          courses:course_id (
            id,
            name,
            thumbnail_url
          ),
          batches:batch_id (
            id,
            name,
            start_date,
            end_date,
            current_students,
            max_students
          )
        `)
        .eq('student_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });
};