import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubjectWithProgress {
  id: string;
  courseId: string;
  courseName: string;
  subjectName: string;
  subjectCode: string;
  thumbnail: string;
  instructorName: string;
  instructorAvatar: string;
  lastUpdated: Date;
  progress: number;
  chaptersCompleted: number;
  totalChapters: number;
  lastAccessed: Date | null;
}

export const useMyCourses = () => {
  return useQuery({
    queryKey: ['my-courses-detailed'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Return mock data for preview
        return generateMockCourseData();
      }

      // Fetch enrollments with course details
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses (
            id,
            name,
            subjects,
            thumbnail_url
          )
        `)
        .eq('student_id', user.id)
        .eq('is_active', true);

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const courseSubjects: SubjectWithProgress[] = [];

      for (const enrollment of enrollments) {
        const course = enrollment.courses;
        if (!course) continue;

        // Fetch chapters for this course
        const { data: chapters } = await supabase
          .from('chapters')
          .select('id, title, subject')
          .eq('course_id', course.id);

        const subjects = course.subjects as string[] || [];
        
        for (const subject of subjects) {
          const subjectChapters = chapters?.filter(ch => ch.subject === subject) || [];
          const totalChapters = subjectChapters.length;

          // Fetch progress for this subject
          const { data: progress } = await supabase
            .from('student_progress')
            .select('chapter_id, is_completed, updated_at')
            .eq('student_id', user.id)
            .in('chapter_id', subjectChapters.map(ch => ch.id));

          const completedChapters = progress?.filter(p => p.is_completed).length || 0;
          const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
          
          const lastAccessedDate = progress && progress.length > 0
            ? new Date(Math.max(...progress.map(p => new Date(p.updated_at).getTime())))
            : null;

          // Get instructor for this subject
          const { data: courseTeacher } = await supabase
            .from('course_teachers')
            .select('teacher_id, teacher_profiles(full_name, avatar_url)')
            .eq('course_id', course.id)
            .eq('subject', subject)
            .maybeSingle();

          const instructor = courseTeacher?.teacher_profiles as any;

          courseSubjects.push({
            id: `${course.id}-${subject}`,
            courseId: course.id,
            courseName: course.name,
            subjectName: subject,
            subjectCode: getSubjectCode(subject),
            thumbnail: getSubjectThumbnail(subject),
            instructorName: instructor?.full_name || 'SimpleLecture Team',
            instructorAvatar: instructor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${subject}`,
            lastUpdated: new Date(),
            progress: progressPercentage,
            chaptersCompleted: completedChapters,
            totalChapters,
            lastAccessed: lastAccessedDate,
          });
        }
      }

      return courseSubjects;
    },
  });
};

// Helper function to generate subject codes
const getSubjectCode = (subject: string): string => {
  const codes: Record<string, string> = {
    'Physics': 'PHY-101',
    'Chemistry': 'CHE-102',
    'Mathematics': 'MTH-110',
    'Biology': 'BIO-101',
    'English': 'ENG-210',
    'Hindi': 'HIN-230',
    'Computer Science': 'CSC-220',
    'Environmental Science': 'ENV-301',
  };
  return codes[subject] || `${subject.substring(0, 3).toUpperCase()}-000`;
};

// Helper function to get subject thumbnails
const getSubjectThumbnail = (subject: string): string => {
  const thumbnails: Record<string, string> = {
    'Physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400',
    'Chemistry': 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400',
    'Mathematics': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
    'Biology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400',
    'English': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    'Hindi': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    'Computer Science': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    'Environmental Science': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
  };
  return thumbnails[subject] || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400';
};

// Mock data for preview/testing
const generateMockCourseData = (): SubjectWithProgress[] => {
  return [
    {
      id: '1-Physics',
      courseId: '1',
      courseName: 'JEE Advanced Course',
      subjectName: 'Physics',
      subjectCode: 'PHY-101',
      thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400',
      instructorName: 'Dr. Rajesh Kumar',
      instructorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
      lastUpdated: new Date(),
      progress: 40,
      chaptersCompleted: 8,
      totalChapters: 20,
      lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '1-Chemistry',
      courseId: '1',
      courseName: 'JEE Advanced Course',
      subjectName: 'Chemistry',
      subjectCode: 'CHE-102',
      thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400',
      instructorName: 'Prof. Priya Sharma',
      instructorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
      lastUpdated: new Date(),
      progress: 60,
      chaptersCompleted: 12,
      totalChapters: 20,
      lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: '1-Mathematics',
      courseId: '1',
      courseName: 'JEE Advanced Course',
      subjectName: 'Mathematics',
      subjectCode: 'MTH-110',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
      instructorName: 'Dr. Suresh Reddy',
      instructorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suresh',
      lastUpdated: new Date(),
      progress: 75,
      chaptersCompleted: 15,
      totalChapters: 20,
      lastAccessed: new Date(),
    },
    {
      id: '2-Biology',
      courseId: '2',
      courseName: 'NEET Preparation',
      subjectName: 'Biology',
      subjectCode: 'BIO-101',
      thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400',
      instructorName: 'Dr. Vikram Malhotra',
      instructorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram',
      lastUpdated: new Date(),
      progress: 55,
      chaptersCompleted: 11,
      totalChapters: 20,
      lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];
};