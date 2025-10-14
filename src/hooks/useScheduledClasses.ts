import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduledClass {
  id: string;
  subject: string;
  room_number: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  notes: string | null;
  is_cancelled: boolean;
  teacher: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export const useScheduledClasses = () => {
  const { data: classes, isLoading } = useQuery({
    queryKey: ['scheduled-classes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const courseIds = enrollments?.map(e => e.course_id) || [];

      if (courseIds.length === 0) return [];

      // Get upcoming classes
      const now = new Date().toISOString();
      const { data: classesData, error } = await supabase
        .from('scheduled_classes')
        .select('*')
        .in('course_id', courseIds)
        .gte('scheduled_at', now)
        .eq('is_cancelled', false)
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (error) throw error;

      if (!classesData || classesData.length === 0) return [];

      // Get teacher profiles separately
      const teacherIds = [...new Set(classesData.map(c => c.teacher_id).filter(Boolean))] as string[];
      
      let teacherProfiles: any[] = [];
      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from('teacher_profiles')
          .select('id, full_name, avatar_url')
          .in('id', teacherIds);
        
        teacherProfiles = teachers || [];
      }

      // Map teachers to classes
      const classesWithTeachers = classesData.map(classItem => {
        const teacher = teacherProfiles.find(t => t.id === classItem.teacher_id);
        return {
          ...classItem,
          teacher: teacher || null,
        };
      });

      return classesWithTeachers;
    },
  });

  return {
    classes: classes || [],
    isLoading,
  };
};
