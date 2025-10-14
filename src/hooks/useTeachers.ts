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

// Mock data for preview
const mockTeachers: Teacher[] = [
  {
    id: 'teacher-1',
    full_name: 'Dr. Rajesh Kumar',
    email: 'rajesh@simplelecture.com',
    phone_number: '+91-9876543210',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
    specialization: ['Physics'],
    bio: 'Experienced Physics educator with 15+ years of teaching excellence',
    subjects: ['Physics'],
  },
  {
    id: 'teacher-2',
    full_name: 'Prof. Priya Sharma',
    email: 'priya@simplelecture.com',
    phone_number: '+91-9876543211',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    specialization: ['Chemistry'],
    bio: 'Chemistry expert specializing in organic chemistry',
    subjects: ['Chemistry'],
  },
  {
    id: 'teacher-3',
    full_name: 'Mr. Amit Singh',
    email: 'amit@simplelecture.com',
    phone_number: '+91-9876543212',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit',
    specialization: ['Computer Science'],
    bio: 'Computer Science professional with industry experience',
    subjects: ['Computer Science'],
  },
  {
    id: 'teacher-4',
    full_name: 'Ms. Neha Patel',
    email: 'neha@simplelecture.com',
    phone_number: '+91-9876543213',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neha',
    specialization: ['English'],
    bio: 'English language and literature specialist',
    subjects: ['English'],
  },
  {
    id: 'teacher-5',
    full_name: 'Dr. Suresh Reddy',
    email: 'suresh@simplelecture.com',
    phone_number: '+91-9876543214',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suresh',
    specialization: ['Mathematics'],
    bio: 'Mathematics professor with advanced calculus expertise',
    subjects: ['Mathematics'],
  },
  {
    id: 'teacher-6',
    full_name: 'Prof. Anita Desai',
    email: 'anita@simplelecture.com',
    phone_number: '+91-9876543215',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anita',
    specialization: ['Chemistry'],
    bio: 'Chemistry lab specialist and researcher',
    subjects: ['Chemistry'],
  },
  {
    id: 'teacher-7',
    full_name: 'Dr. Vikram Malhotra',
    email: 'vikram@simplelecture.com',
    phone_number: '+91-9876543216',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram',
    specialization: ['Biology'],
    bio: 'Biology and life sciences expert',
    subjects: ['Biology'],
  },
  {
    id: 'teacher-8',
    full_name: 'Mr. Arjun Kapoor',
    email: 'arjun@simplelecture.com',
    phone_number: '+91-9876543217',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
    specialization: ['Physics'],
    bio: 'Physics lab instructor specializing in mechanics',
    subjects: ['Physics'],
  },
  {
    id: 'teacher-9',
    full_name: 'Ms. Kavita Iyer',
    email: 'kavita@simplelecture.com',
    phone_number: '+91-9876543218',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kavita',
    specialization: ['Mathematics'],
    bio: 'Mathematics tutor focused on problem solving',
    subjects: ['Mathematics'],
  },
  {
    id: 'teacher-10',
    full_name: 'Prof. Sanjay Gupta',
    email: 'sanjay@simplelecture.com',
    phone_number: '+91-9876543219',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sanjay',
    specialization: ['Computer Science'],
    bio: 'Computer Science and programming expert',
    subjects: ['Computer Science'],
  },
];

export const useTeachers = () => {
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['student-teachers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Return mock data if no user (for preview)
      if (!user) return mockTeachers;

      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const courseIds = enrollments?.map(e => e.course_id) || [];

      if (courseIds.length === 0) return mockTeachers;

      // Get course teachers
      const { data: courseTeachers, error: ctError } = await supabase
        .from('course_teachers')
        .select('teacher_id, subject')
        .in('course_id', courseIds);

      if (ctError) {
        console.error('Error fetching course teachers:', ctError);
        return mockTeachers;
      }

      const teacherIds = [...new Set(courseTeachers?.map(ct => ct.teacher_id) || [])];

      if (teacherIds.length === 0) return mockTeachers;

      // Get teacher profiles
      const { data: teacherProfiles, error: tpError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .in('id', teacherIds);

      if (tpError) {
        console.error('Error fetching teacher profiles:', tpError);
        return mockTeachers;
      }

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

      return teachersWithSubjects.length > 0 ? teachersWithSubjects : mockTeachers;
    },
  });

  return {
    teachers: teachers || [],
    isLoading,
  };
};
