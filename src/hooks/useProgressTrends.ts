import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";

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
  subjectName?: string;
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
  const { courseId, subjectName, days = 30 } = options;

  return useQuery({
    queryKey: ["progress-trends", courseId, subjectName, days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const endDate = new Date();
      const startDate = subDays(endDate, days);

      // Get subject IDs linked to the course via course_subjects
      let subjectIds: string[] = [];
      
      if (courseId && courseId !== "all") {
        const { data: courseSubjects } = await supabase
          .from("course_subjects")
          .select("subject_id, popular_subjects!inner(id, name)")
          .eq("course_id", courseId);
        
        if (courseSubjects) {
          subjectIds = courseSubjects.map((cs: any) => cs.subject_id);
        }
      }

      // Get total chapters from subject_chapters (the CORRECT table)
      const { data: allSubjectChapters } = await supabase
        .from("subject_chapters")
        .select("id, subject_id, title, popular_subjects!inner(id, name)");

      // Filter chapters by subject IDs from the course
      let filteredChapters = allSubjectChapters || [];
      if (subjectIds.length > 0) {
        filteredChapters = filteredChapters.filter((c: any) => subjectIds.includes(c.subject_id));
      }
      if (subjectName && subjectName !== "all") {
        filteredChapters = filteredChapters.filter((c: any) => c.popular_subjects?.name === subjectName);
      }

      const chapterIds = filteredChapters.map((c: any) => c.id);
      const totalChapters = filteredChapters.length || 1;

      // Get chapter-level videos (subject_chapters where video_id is not null)
      const chapterVideos = filteredChapters.filter((c: any) => 
        c.video_id && c.video_id.trim() !== ''
      );
      const chapterVideoIds = chapterVideos.map((c: any) => c.video_id);

      // Get topic-level videos from subject_topics
      const { data: allTopics } = await supabase
        .from("subject_topics")
        .select("id, chapter_id, video_id, subject_chapters!inner(id, subject_id, popular_subjects!inner(id, name))");

      // Filter topics by chapter IDs
      let filteredTopics = allTopics || [];
      if (chapterIds.length > 0) {
        filteredTopics = filteredTopics.filter((t: any) => chapterIds.includes(t.chapter_id));
      }
      if (subjectName && subjectName !== "all") {
        filteredTopics = filteredTopics.filter((t: any) => 
          t.subject_chapters?.popular_subjects?.name === subjectName
        );
      }

      // Topic videos (where video_id is not null)
      const topicVideos = filteredTopics.filter((t: any) => 
        t.video_id && t.video_id.trim() !== ''
      );
      const topicVideoIds = topicVideos.map((t: any) => t.video_id);

      // Combined total videos = chapter videos + topic videos
      const allVideoIds = [...new Set([...chapterVideoIds, ...topicVideoIds])];
      const totalVideos = allVideoIds.length || 1;

      // Fetch student progress data in parallel
      const [
        videoProgressResult,
        examsResult,
        assignmentsResult,
      ] = await Promise.all([
        // Video watch progress from ai_video_watch_logs (completion_percentage >= 80 = completed)
        supabase
          .from("ai_video_watch_logs")
          .select("created_at, completion_percentage, subject_id, chapter_id, topic_id, video_title")
          .eq("student_id", user.id)
          .gte("completion_percentage", 80)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),

        // Paper test results (PYQ, proficiency, exams)
        supabase
          .from("paper_test_results")
          .select("submitted_at, percentage, subject_id, popular_subjects!inner(id, name)")
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
      ]);

      // Filter watched videos by subject/chapter IDs for the selected course
      const videos = (videoProgressResult.data || []).filter((v: any) => {
        if (subjectIds.length > 0 && v.subject_id && !subjectIds.includes(v.subject_id)) return false;
        if (chapterIds.length > 0 && v.chapter_id && !chapterIds.includes(v.chapter_id)) return false;
        return true;
      });

      // Filter exams by subject IDs
      const exams = (examsResult.data || []).filter((e: any) => {
        if (subjectIds.length > 0 && !subjectIds.includes(e.subject_id)) return false;
        if (subjectName && subjectName !== "all") {
          return e.popular_subjects?.name === subjectName;
        }
        return true;
      });

      // Filter assignments by course
      const assignments = (assignmentsResult.data || []).filter((a: any) => {
        if (courseId && courseId !== "all" && a.assignments?.course_id !== courseId) return false;
        return true;
      });

      // Generate date range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      // Calculate cumulative progress for each day
      // Note: Chapter completion tracking not yet implemented for subject_chapters
      let cumulativeChapters = 0;
      let cumulativeVideos = 0;
      let allMcqScores: number[] = [];
      let allExamScores: number[] = [];
      let allAssignmentScores: number[] = [];

      const trendData: ProgressTrendPoint[] = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");

        // Videos completed on this date (from ai_video_watch_logs)
        const videosOnDate = videos.filter((v: any) => 
          v.created_at && format(parseISO(v.created_at), "yyyy-MM-dd") === dateStr
        ).length;
        cumulativeVideos += videosOnDate;

        // Exam scores on this date
        const examsOnDate = exams.filter((e: any) => 
          e.submitted_at && format(parseISO(e.submitted_at), "yyyy-MM-dd") === dateStr
        );
        examsOnDate.forEach((e: any) => {
          if (e.percentage !== null) {
            allExamScores.push(e.percentage);
          }
        });

        // Assignment scores on this date
        const assignmentsOnDate = assignments.filter((a: any) => 
          a.submitted_at && format(parseISO(a.submitted_at), "yyyy-MM-dd") === dateStr
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

      // Sample data points to avoid overcrowding
      const sampledData = trendData.filter((_, index) => 
        index % Math.ceil(days / 10) === 0 || index === trendData.length - 1
      );

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
