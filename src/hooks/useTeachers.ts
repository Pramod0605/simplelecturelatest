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

      // Step 1: Get enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const courseIds = enrollments?.map(e => e.course_id) || [];
      if (courseIds.length === 0) return [];

      // Step 2: Get subject IDs from enrolled courses
      const { data: courseSubjects, error: csError } = await supabase
        .from('course_subjects')
        .select('subject_id')
        .in('course_id', courseIds);

      if (csError) {
        console.error('Error fetching course subjects:', csError);
        return [];
      }

      const subjectIds = [...new Set(courseSubjects?.map(cs => cs.subject_id) || [])];
      if (subjectIds.length === 0) return [];

      // Step 3: Get instructor assignments for those subjects
      const { data: instructorSubjects, error: isError } = await supabase
        .from('instructor_subjects')
        .select(`
          instructor_id,
          subject_id,
          popular_subjects!inner(name)
        `)
        .in('subject_id', subjectIds);

      if (isError) {
        console.error('Error fetching instructor subjects:', isError);
        return [];
      }

      const instructorIds = [...new Set(
        instructorSubjects?.map(is => is.instructor_id).filter(Boolean) || []
      )] as string[];
      
      if (instructorIds.length === 0) return [];

      // Step 4: Get instructor profiles
      const { data: teacherProfiles, error: tpError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .in('id', instructorIds);

      if (tpError) {
        console.error('Error fetching teacher profiles:', tpError);
        return [];
      }

      // Step 5: Map instructors with their assigned subjects
      const teachersWithSubjects: Teacher[] = (teacherProfiles || []).map(teacher => {
        const subjects = instructorSubjects
          ?.filter(is => is.instructor_id === teacher.id)
          .map(is => (is.popular_subjects as { name: string })?.name)
          .filter(Boolean) as string[];

        return {
          ...teacher,
          subjects: [...new Set(subjects)],
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
