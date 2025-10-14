import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Teacher {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  specialization: string[] | null;
  bio: string | null;
  subjects: string[];
}

export const useTeachers = () => {
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['student-teachers'],
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

      // Get course teachers
      const { data: courseTeachers, error: ctError } = await supabase
        .from('course_teachers')
        .select('teacher_id, subject')
        .in('course_id', courseIds);

      if (ctError) throw ctError;

      const teacherIds = [...new Set(courseTeachers?.map(ct => ct.teacher_id) || [])];

      if (teacherIds.length === 0) return [];

      // Get teacher profiles
      const { data: teacherProfiles, error: tpError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .in('id', teacherIds);

      if (tpError) throw tpError;

      // Map teachers with their subjects
      const teachersWithSubjects: Teacher[] = (teacherProfiles || []).map(teacher => {
        const subjects = courseTeachers
          ?.filter(ct => ct.teacher_id === teacher.id)
          .map(ct => ct.subject)
          .filter(Boolean) as string[];

        return {
          ...teacher,
          subjects: [...new Set(subjects)], // Remove duplicates
        };
      });

      return teachersWithSubjects;
    },
  });

  return {
    teachers: teachers || [],
    isLoading,
  };
};
