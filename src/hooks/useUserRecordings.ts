import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserRecording {
  id: string;
  scheduled_class_id: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  processing_status: string | null;
  available_qualities: string[] | null;
  default_quality: string | null;
  created_at: string | null;
  processed_at: string | null;
  scheduled_class?: {
    id: string;
    scheduled_at: string;
    subject: string | null;
    course_id: string | null;
    course?: { id: string; name: string } | null;
    teacher?: { id: string; full_name: string } | null;
  } | null;
}

export interface UserRecordingFilters {
  courseId?: string;
  subjectSearch?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export const useUserRecordings = (filters?: UserRecordingFilters) => {
  return useQuery({
    queryKey: ['user-recordings', filters],
    queryFn: async () => {
      let query = supabase
        .from('class_recordings')
        .select(`
          id,
          scheduled_class_id,
          duration_seconds,
          file_size_bytes,
          processing_status,
          available_qualities,
          default_quality,
          created_at,
          processed_at,
          scheduled_class:scheduled_classes(
            id,
            scheduled_at,
            course_id,
            subject,
            course:courses(id, name),
            teacher:teacher_profiles(id, full_name)
          )
        `)
        .eq('processing_status', 'ready')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];

      // Filter by course
      if (filters?.courseId) {
        filteredData = filteredData.filter(r => 
          (r.scheduled_class as any)?.course?.id === filters.courseId
        );
      }

      // Filter by subject search
      if (filters?.subjectSearch) {
        const searchLower = filters.subjectSearch.toLowerCase();
        filteredData = filteredData.filter(r => 
          (r.scheduled_class as any)?.subject?.toLowerCase().includes(searchLower)
        );
      }

      // Filter by date range
      if (filters?.dateFrom) {
        filteredData = filteredData.filter(r => {
          const scheduledAt = (r.scheduled_class as any)?.scheduled_at;
          return scheduledAt && new Date(scheduledAt) >= filters.dateFrom!;
        });
      }

      if (filters?.dateTo) {
        filteredData = filteredData.filter(r => {
          const scheduledAt = (r.scheduled_class as any)?.scheduled_at;
          return scheduledAt && new Date(scheduledAt) <= filters.dateTo!;
        });
      }

      // General search
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(r => {
          const subject = (r.scheduled_class as any)?.subject || '';
          const courseName = (r.scheduled_class as any)?.course?.name || '';
          const teacherName = (r.scheduled_class as any)?.teacher?.full_name || '';
          return (
            subject.toLowerCase().includes(searchLower) ||
            courseName.toLowerCase().includes(searchLower) ||
            teacherName.toLowerCase().includes(searchLower)
          );
        });
      }

      return filteredData as unknown as UserRecording[];
    },
  });
};

export const useRecordingSubjects = () => {
  return useQuery({
    queryKey: ['recording-subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_recordings')
        .select(`
          scheduled_class:scheduled_classes(subject)
        `)
        .eq('processing_status', 'ready');

      if (error) throw error;

      // Extract unique subjects
      const subjects = new Set<string>();
      data?.forEach(r => {
        const subject = (r.scheduled_class as any)?.subject;
        if (subject) subjects.add(subject);
      });

      return Array.from(subjects).sort();
    },
  });
};

export const useRecordingCourses = () => {
  return useQuery({
    queryKey: ['recording-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_recordings')
        .select(`
          scheduled_class:scheduled_classes(
            course:courses(id, name)
          )
        `)
        .eq('processing_status', 'ready');

      if (error) throw error;

      // Extract unique courses
      const coursesMap = new Map<string, string>();
      data?.forEach(r => {
        const course = (r.scheduled_class as any)?.course;
        if (course?.id && course?.name) {
          coursesMap.set(course.id, course.name);
        }
      });

      return Array.from(coursesMap.entries()).map(([id, name]) => ({ id, name }));
    },
  });
};
