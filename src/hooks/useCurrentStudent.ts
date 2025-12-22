import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  enrollment_date: string;
  last_active: string;
  status: "active" | "inactive" | "at_risk";
  courses: Array<{
    id: string;
    name: string;
    subjects: string[];
    progress: number;
    enrolled_at: string;
  }>;
  total_progress: number;
  tests_taken: number;
  avg_test_score: number;
  ai_queries: number;
  areas_of_improvement: string[];
  followups_pending: number;
  at_risk: boolean;
  live_classes: {
    total_scheduled: number;
    attended: number;
    attendance_percentage: number;
    missed: number;
    upcoming: number;
    recent_classes: Array<{
      id: string;
      subject: string;
      topic: string;
      date: string;
      attended: boolean;
      duration_minutes: number;
    }>;
  };
  ai_video_usage: {
    total_videos: number;
    watched_count: number;
    total_watch_time_minutes: number;
    completion_rate: number;
    recent_videos: Array<{
      title: string;
      subject: string;
      duration: number;
      watched_percentage: number;
      date: string;
    }>;
  };
  podcast_usage: {
    total_listened: number;
    total_time_minutes: number;
    favorite_topics: string[];
    recent_podcasts: Array<{
      title: string;
      subject: string;
      duration: number;
      date: string;
    }>;
  };
  mcq_practice: {
    total_attempted: number;
    total_correct: number;
    accuracy_percentage: number;
    by_subject: Record<string, { attempted: number; correct: number; accuracy: number }>;
    recent_sessions: Array<{
      subject: string;
      questions: number;
      correct: number;
      date: string;
    }>;
  };
  doubt_clearing: {
    total_doubts: number;
    resolved: number;
    pending: number;
    avg_resolution_time_minutes: number;
    by_subject: Record<string, number>;
    recent_doubts: Array<{
      question: string;
      subject: string;
      status: string;
      date: string;
    }>;
  };
  activity_score: number;
  activity_breakdown: Record<string, number>;
  timetable: Array<{
    day: number;
    subject: string;
    topic: string;
    start_time: string;
    end_time: string;
    instructor: string;
    type: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    priority: string;
  }>;
}

export const useCurrentStudent = () => {
  return useQuery({
    queryKey: ["current-student"],
    queryFn: async (): Promise<StudentData> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Fetch all data in parallel for maximum speed
      const [
        profileResult,
        enrollmentsResult,
        studentProgressResult,
        attendanceResult,
        doubtLogsResult,
        dptSubmissionsResult,
        assignmentSubmissionsResult
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('enrollments').select(`
          id, enrolled_at, is_active, course_id, batch_id,
          courses (id, name, description, course_subjects (subject_id, popular_subjects (id, name))),
          batches (id, name)
        `).eq('student_id', user.id).eq('is_active', true),
        supabase.from('student_progress').select('*').eq('student_id', user.id),
        supabase.from('class_attendance').select('id, status, marked_at, scheduled_class_id')
          .eq('student_id', user.id).order('marked_at', { ascending: false }).limit(20),
        supabase.from('doubt_logs').select('*').eq('student_id', user.id)
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('dpt_submissions').select('*').eq('student_id', user.id)
          .order('submitted_at', { ascending: false }),
        supabase.from('assignment_submissions').select('*').eq('student_id', user.id)
          .order('submitted_at', { ascending: false })
      ]);

      const profile = profileResult.data;
      const enrollments = enrollmentsResult.data;
      const studentProgress = studentProgressResult.data;
      const attendance = attendanceResult.data;
      const doubtLogs = doubtLogsResult.data;
      const dptSubmissions = dptSubmissionsResult.data;
      const assignmentSubmissions = assignmentSubmissionsResult.data;

      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
        throw new Error("Failed to fetch profile");
      }

      // Fetch timetable only if we have batch IDs
      const batchIds = enrollments?.map(e => e.batch_id).filter(Boolean) || [];
      let timetableData: any[] = [];
      
      if (batchIds.length > 0) {
        const { data: timetable } = await supabase
          .from('instructor_timetables')
          .select('id, day_of_week, start_time, end_time, is_active, subject_id, chapter_id, instructor_id')
          .in('batch_id', batchIds)
          .eq('is_active', true);
        timetableData = timetable || [];
      }

      // Process enrollments into courses
      const courses = (enrollments || []).map((enrollment: any) => {
        const course = Array.isArray(enrollment.courses) 
          ? enrollment.courses[0] 
          : enrollment.courses;
        
        if (!course) return null;

        const subjects = course.course_subjects?.map((cs: any) => {
          const ps = Array.isArray(cs.popular_subjects) 
            ? cs.popular_subjects[0] 
            : cs.popular_subjects;
          return ps?.name;
        }).filter(Boolean) || [];

        // Calculate progress from student_progress
        const courseProgress = studentProgress?.filter((p: any) => {
          // Match by any chapter belonging to this course's subjects
          return true; // Will refine when we have proper progress data
        }) || [];
        
        const completedCount = courseProgress.filter((p: any) => p.is_completed).length;
        const totalCount = courseProgress.length || 1;
        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return {
          id: course.id,
          name: course.name,
          subjects,
          progress,
          enrolled_at: enrollment.enrolled_at
        };
      }).filter(Boolean);

      // Calculate overall stats
      const totalProgress = courses.length > 0 
        ? Math.round(courses.reduce((sum: number, c: any) => sum + c.progress, 0) / courses.length)
        : 0;

      // Process test data
      const allTests = [...(dptSubmissions || []), ...(assignmentSubmissions || [])];
      const testsTaken = allTests.length;
      const avgTestScore = testsTaken > 0 
        ? Math.round(allTests.reduce((sum, t: any) => sum + (t.score || t.percentage || 0), 0) / testsTaken)
        : 0;

      // Process attendance data
      const attendanceRecords = attendance || [];
      const attendedClasses = attendanceRecords.filter((a: any) => a.status === 'present').length;
      const totalScheduled = attendanceRecords.length;
      const attendancePercentage = totalScheduled > 0 
        ? Math.round((attendedClasses / totalScheduled) * 100)
        : 0;

      // Process recent classes (simplified without nested joins)
      const recentClasses = attendanceRecords.slice(0, 5).map((a: any) => ({
        id: a.id,
        subject: 'Class',
        topic: 'Session',
        date: a.marked_at,
        attended: a.status === 'present',
        duration_minutes: 60
      }));

      // Process doubt logs
      const aiQueries = doubtLogs?.length || 0;
      const doubtsBySubject: Record<string, number> = {};
      const recentDoubts = (doubtLogs || []).slice(0, 5).map((d: any) => {
        // Increment subject count (we don't have subject info directly, so default)
        doubtsBySubject['General'] = (doubtsBySubject['General'] || 0) + 1;
        return {
          question: d.question?.substring(0, 100) || 'Question',
          subject: 'General',
          status: d.answer ? 'resolved' : 'pending',
          date: d.created_at
        };
      });

      // Process timetable (simplified without nested joins)
      const formattedTimetable = timetableData.map((t: any) => ({
        day: t.day_of_week,
        subject: 'Subject',
        topic: 'Topic',
        start_time: t.start_time,
        end_time: t.end_time,
        instructor: 'Instructor',
        type: 'live_class'
      }));

      // Build the student data object with defaults for empty data
      const studentData: StudentData = {
        id: user.id,
        full_name: profile?.full_name || user.email?.split('@')[0] || 'Student',
        email: user.email || '',
        phone: profile?.phone_number || 'Not provided',
        avatar_url: profile?.avatar_url || null,
        enrollment_date: enrollments?.[0]?.enrolled_at || new Date().toISOString(),
        last_active: new Date().toISOString(),
        status: 'active',
        courses,
        total_progress: totalProgress,
        tests_taken: testsTaken,
        avg_test_score: avgTestScore,
        ai_queries: aiQueries,
        areas_of_improvement: [],
        followups_pending: 0,
        at_risk: false,
        live_classes: {
          total_scheduled: totalScheduled,
          attended: attendedClasses,
          attendance_percentage: attendancePercentage,
          missed: totalScheduled - attendedClasses,
          upcoming: 0,
          recent_classes: recentClasses
        },
        // Default empty AI video usage (no table exists for this yet)
        ai_video_usage: {
          total_videos: 0,
          watched_count: 0,
          total_watch_time_minutes: 0,
          completion_rate: 0,
          recent_videos: []
        },
        // Default empty podcast usage (no table exists for this yet)
        podcast_usage: {
          total_listened: 0,
          total_time_minutes: 0,
          favorite_topics: [],
          recent_podcasts: []
        },
        // MCQ practice data from DPT submissions
        mcq_practice: {
          total_attempted: dptSubmissions?.reduce((sum: number, d: any) => sum + (d.total_questions || 0), 0) || 0,
          total_correct: dptSubmissions?.reduce((sum: number, d: any) => sum + (d.score || 0), 0) || 0,
          accuracy_percentage: avgTestScore,
          by_subject: {},
          recent_sessions: (dptSubmissions || []).slice(0, 5).map((d: any) => ({
            subject: 'General',
            questions: d.total_questions || 0,
            correct: d.score || 0,
            date: d.test_date || d.submitted_at
          }))
        },
        doubt_clearing: {
          total_doubts: aiQueries,
          resolved: (doubtLogs || []).filter((d: any) => d.answer).length,
          pending: (doubtLogs || []).filter((d: any) => !d.answer).length,
          avg_resolution_time_minutes: 15,
          by_subject: doubtsBySubject,
          recent_doubts: recentDoubts
        },
        activity_score: Math.min(100, Math.round(
          (totalProgress * 0.3) + 
          (attendancePercentage * 0.3) + 
          (avgTestScore * 0.4)
        )),
        activity_breakdown: {
          live_class_participation: attendancePercentage,
          ai_video_engagement: 0,
          podcast_listening: 0,
          mcq_practice: avgTestScore,
          doubt_clearing: aiQueries > 0 ? 100 : 0
        },
        timetable: formattedTimetable,
        notifications: []
      };

      return studentData;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};
