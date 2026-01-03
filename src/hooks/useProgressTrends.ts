import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, parseISO, eachDayOfInterval } from "date-fns";

interface ProgressBreakdown {
  chapters: number;
  videos: number;
  mcqs: number;
  exams: number;
  assignments: number;
}

interface ProgressTrendPoint {
  date: string;
  displayDate: string;
  progress: number;
  breakdown: ProgressBreakdown;
}

interface UseProgressTrendsOptions {
  courseId?: string;
  subjectId?: string;
  days?: number;
}

// Weights for progress calculation
const WEIGHTS = {
  chapters: 0.35,
  videos: 0.25,
  mcqs: 0.15,
  exams: 0.15,
  assignments: 0.10,
};

export const useProgressTrends = (options: UseProgressTrendsOptions = {}) => {
  const { courseId, subjectId, days = 30 } = options;

  return useQuery({
    queryKey: ["progress-trends", courseId, subjectId, days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const endDate = new Date();
      const startDate = subDays(endDate, days);

      // Fetch all data in parallel
      const [
        chaptersResult,
        videosResult,
        mcqsResult,
        examsResult,
        assignmentsResult,
        totalChaptersResult,
        totalVideosResult,
      ] = await Promise.all([
        // Chapter completions with dates
        supabase
          .from("student_progress")
          .select("completed_at, chapter_id, is_completed, chapters!inner(course_id, subject_id)")
          .eq("student_id", user.id)
          .eq("is_completed", true)
          .gte("completed_at", startDate.toISOString())
          .lte("completed_at", endDate.toISOString()),

        // Video watch progress
        supabase
          .from("video_watch_progress")
          .select("last_watched_at, completed, topic_videos!inner(topic_id, topics!inner(chapter_id, chapters!inner(course_id, subject_id)))")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("last_watched_at", startDate.toISOString())
          .lte("last_watched_at", endDate.toISOString()),

        // MCQ test submissions
        supabase
          .from("test_submissions")
          .select("submitted_at, score, total_questions, topics!inner(chapter_id, chapters!inner(course_id, subject_id))")
          .eq("student_id", user.id)
          .gte("submitted_at", startDate.toISOString())
          .lte("submitted_at", endDate.toISOString()),

        // Paper test results (PYQ, proficiency, exams)
        supabase
          .from("paper_test_results")
          .select("submitted_at, percentage, subject_id, subjects!inner(course_id)")
          .eq("student_id", user.id)
          .gte("submitted_at", startDate.toISOString())
          .lte("submitted_at", endDate.toISOString()),

        // Assignment submissions
        supabase
          .from("assignment_submissions")
          .select("submitted_at, percentage, assignments!inner(course_id)")
          .eq("student_id", user.id)
          .gte("submitted_at", startDate.toISOString())
          .lte("submitted_at", endDate.toISOString()),

        // Total chapters for calculating percentage
        supabase
          .from("chapters")
          .select("id, course_id, subject_id"),

        // Total videos for calculating percentage
        supabase
          .from("topic_videos")
          .select("id, topic_id, topics!inner(chapter_id, chapters!inner(course_id, subject_id))"),
      ]);

      // Apply filters
      const filterByCourseAndSubject = (item: any, courseKey: string, subjectKey: string) => {
        if (courseId && courseId !== "all" && item[courseKey] !== courseId) return false;
        if (subjectId && subjectId !== "all" && item[subjectKey] !== subjectId) return false;
        return true;
      };

      // Filter chapters
      const chapters = (chaptersResult.data || []).filter((c: any) => 
        filterByCourseAndSubject(c.chapters, "course_id", "subject_id")
      );

      // Filter videos
      const videos = (videosResult.data || []).filter((v: any) => 
        filterByCourseAndSubject(v.topic_videos?.topics?.chapters, "course_id", "subject_id")
      );

      // Filter MCQs
      const mcqs = (mcqsResult.data || []).filter((m: any) => 
        filterByCourseAndSubject(m.topics?.chapters, "course_id", "subject_id")
      );

      // Filter exams
      const exams = (examsResult.data || []).filter((e: any) => {
        if (courseId && courseId !== "all" && e.subjects?.course_id !== courseId) return false;
        if (subjectId && subjectId !== "all" && e.subject_id !== subjectId) return false;
        return true;
      });

      // Filter assignments
      const assignments = (assignmentsResult.data || []).filter((a: any) => {
        if (courseId && courseId !== "all" && a.assignments?.course_id !== courseId) return false;
        return true;
      });

      // Get totals for percentage calculation
      const totalChapters = (totalChaptersResult.data || []).filter((c: any) => 
        filterByCourseAndSubject(c, "course_id", "subject_id")
      ).length || 1;

      const totalVideos = (totalVideosResult.data || []).filter((v: any) => 
        filterByCourseAndSubject(v.topics?.chapters, "course_id", "subject_id")
      ).length || 1;

      // Generate date range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      // Calculate cumulative progress for each day
      let cumulativeChapters = 0;
      let cumulativeVideos = 0;
      let allMcqScores: number[] = [];
      let allExamScores: number[] = [];
      let allAssignmentScores: number[] = [];

      const trendData: ProgressTrendPoint[] = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");

        // Count chapters completed on or before this date
        const chaptersOnDate = chapters.filter((c: any) => 
          format(parseISO(c.completed_at), "yyyy-MM-dd") === dateStr
        ).length;
        cumulativeChapters += chaptersOnDate;

        // Count videos completed on or before this date
        const videosOnDate = videos.filter((v: any) => 
          format(parseISO(v.last_watched_at), "yyyy-MM-dd") === dateStr
        ).length;
        cumulativeVideos += videosOnDate;

        // MCQ scores on this date
        const mcqsOnDate = mcqs.filter((m: any) => 
          format(parseISO(m.submitted_at), "yyyy-MM-dd") === dateStr
        );
        mcqsOnDate.forEach((m: any) => {
          if (m.total_questions > 0) {
            allMcqScores.push((m.score / m.total_questions) * 100);
          }
        });

        // Exam scores on this date
        const examsOnDate = exams.filter((e: any) => 
          format(parseISO(e.submitted_at), "yyyy-MM-dd") === dateStr
        );
        examsOnDate.forEach((e: any) => {
          if (e.percentage !== null) {
            allExamScores.push(e.percentage);
          }
        });

        // Assignment scores on this date
        const assignmentsOnDate = assignments.filter((a: any) => 
          format(parseISO(a.submitted_at), "yyyy-MM-dd") === dateStr
        );
        assignmentsOnDate.forEach((a: any) => {
          if (a.percentage !== null) {
            allAssignmentScores.push(a.percentage);
          }
        });

        // Calculate percentages
        const chapterProgress = (cumulativeChapters / totalChapters) * 100;
        const videoProgress = (cumulativeVideos / totalVideos) * 100;
        const mcqProgress = allMcqScores.length > 0 
          ? allMcqScores.reduce((a, b) => a + b, 0) / allMcqScores.length 
          : 0;
        const examProgress = allExamScores.length > 0 
          ? allExamScores.reduce((a, b) => a + b, 0) / allExamScores.length 
          : 0;
        const assignmentProgress = allAssignmentScores.length > 0 
          ? allAssignmentScores.reduce((a, b) => a + b, 0) / allAssignmentScores.length 
          : 0;

        // Calculate weighted progress
        const weightedProgress = 
          (Math.min(chapterProgress, 100) * WEIGHTS.chapters) +
          (Math.min(videoProgress, 100) * WEIGHTS.videos) +
          (mcqProgress * WEIGHTS.mcqs) +
          (examProgress * WEIGHTS.exams) +
          (assignmentProgress * WEIGHTS.assignments);

        return {
          date: dateStr,
          displayDate: format(date, "MMM d"),
          progress: Math.round(weightedProgress * 10) / 10,
          breakdown: {
            chapters: Math.round(Math.min(chapterProgress, 100) * 10) / 10,
            videos: Math.round(Math.min(videoProgress, 100) * 10) / 10,
            mcqs: Math.round(mcqProgress * 10) / 10,
            exams: Math.round(examProgress * 10) / 10,
            assignments: Math.round(assignmentProgress * 10) / 10,
          },
        };
      });

      // Sample data points to avoid overcrowding (show ~10 points for 30 days)
      const sampledData = trendData.filter((_, index) => 
        index % Math.ceil(days / 10) === 0 || index === trendData.length - 1
      );

      // Get current overall progress
      const latestProgress = trendData[trendData.length - 1];

      return {
        trendData: sampledData,
        currentProgress: latestProgress?.progress || 0,
        breakdown: latestProgress?.breakdown || {
          chapters: 0,
          videos: 0,
          mcqs: 0,
          exams: 0,
          assignments: 0,
        },
        totals: {
          chaptersCompleted: cumulativeChapters,
          totalChapters,
          videosWatched: cumulativeVideos,
          totalVideos,
          testsAttempted: allMcqScores.length + allExamScores.length,
          assignmentsSubmitted: allAssignmentScores.length,
        },
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
