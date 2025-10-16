import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useInstructorTimetable = (instructorId?: string) => {
  return useQuery({
    queryKey: ['instructor-timetable', instructorId],
    queryFn: async () => {
      let query = supabase
        .from('instructor_timetables')
        .select(`
          *,
          instructor:teacher_profiles(id, full_name),
          subject:popular_subjects(id, name),
          batch:batches(id, name)
        `)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (instructorId) {
        query = query.eq('instructor_id', instructorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: instructorId !== undefined,
  });
};

export const useCreateTimetableEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('instructor_timetables')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-timetable'] });
      toast.success('Timetable entry created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create timetable entry');
    },
  });
};

export const useUpdateTimetableEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('instructor_timetables')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-timetable'] });
      toast.success('Timetable entry updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update timetable entry');
    },
  });
};

export const useDeleteTimetableEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instructor_timetables')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-timetable'] });
      toast.success('Timetable entry deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete timetable entry');
    },
  });
};

export const useCreateLiveClassFromTimetable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('scheduled_classes')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-classes'] });
      queryClient.invalidateQueries({ queryKey: ['live-classes'] });
      toast.success('Live class created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create live class');
    },
  });
};
