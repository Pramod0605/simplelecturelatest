import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";

interface ChapterProgress {
  id: string;
  title: string;
  subjectName: string;
  progress: number;
  videos: { completed: number; total: number };
  mcqs: { completed: number; total: number };
  exams: { completed: number; total: number };
  assignments: { completed: number; total: number };
}

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

      // Get all chapters from subject_chapters with video_id
      const { data: allSubjectChapters } = await supabase
        .from("subject_chapters")
        .select("id, subject_id, title, video_id, popular_subjects!inner(id, name)");

      // Filter chapters by subject IDs from the course
      let filteredChapters = allSubjectChapters || [];
      if (subjectIds.length > 0) {
        filteredChapters = filteredChapters.filter((c: any) => subjectIds.includes(c.subject_id));
      }
      if (subjectName && subjectName !== "all") {
        filteredChapters = filteredChapters.filter((c: any) => c.popular_subjects?.name === subjectName);
      }

      const chapterIds = filteredChapters.map((c: any) => c.id);

      // Get all topics for filtered chapters
      const { data: allTopics } = await supabase
        .from("subject_topics")
        .select("id, chapter_id, video_id");

      const filteredTopics = (allTopics || []).filter((t: any) => chapterIds.includes(t.chapter_id));
      const topicIds = filteredTopics.map((t: any) => t.id);

      // Get MCQs (questions) for chapters and topics
      const { data: allQuestions } = await supabase
        .from("questions")
        .select("id, chapter_id, topic_id");

      // Get assignments for chapters
      const { data: allAssignments } = await supabase
        .from("assignments")
        .select("id, chapter_id, topic_id");

      // Fetch student progress data in parallel
      const [
        videoProgressResult,
        assignmentSubmissionsResult,
        paperTestResultsResult,
      ] = await Promise.all([
        // Video watch progress from ai_video_watch_logs
        supabase
          .from("ai_video_watch_logs")
          .select("created_at, completion_percentage, subject_id, chapter_id, topic_id, video_title")
          .eq("student_id", user.id)
          .gte("completion_percentage", 80),

        // Assignment submissions
        supabase
          .from("assignment_submissions")
          .select("id, assignment_id, percentage, submitted_at")
          .eq("student_id", user.id),

        // Paper test results for MCQ/exam tracking
        supabase
          .from("paper_test_results")
          .select("id, subject_id, questions, answers, score, total_questions, submitted_at")
          .eq("student_id", user.id),
      ]);

      const watchedVideoLogs = videoProgressResult.data || [];
      const assignmentSubmissions = assignmentSubmissionsResult.data || [];
      const paperTestResults = paperTestResultsResult.data || [];

      // Calculate per-chapter progress
      const chapterProgressList: ChapterProgress[] = filteredChapters.map((chapter: any) => {
        const chapterId = chapter.id;
        const chapterTopics = filteredTopics.filter((t: any) => t.chapter_id === chapterId);
        const chapterTopicIds = chapterTopics.map((t: any) => t.id);

        // Videos for this chapter (chapter-level + topic-level)
        const chapterHasVideo = chapter.video_id && chapter.video_id.trim() !== '';
        const topicVideosCount = chapterTopics.filter((t: any) => t.video_id && t.video_id.trim() !== '').length;
        const totalVideos = (chapterHasVideo ? 1 : 0) + topicVideosCount;

        // Watched videos for this chapter
        const watchedVideosForChapter = watchedVideoLogs.filter((v: any) => 
          v.chapter_id === chapterId || chapterTopicIds.includes(v.topic_id)
        );
        // Count unique videos watched (by video_title to avoid duplicates)
        const uniqueWatchedVideos = new Set(watchedVideosForChapter.map((v: any) => v.video_title));
        const completedVideos = Math.min(uniqueWatchedVideos.size, totalVideos);

        // MCQs for this chapter (from questions table)
        const chapterQuestions = (allQuestions || []).filter((q: any) => 
          q.chapter_id === chapterId || chapterTopicIds.includes(q.topic_id)
        );
        const totalMcqs = chapterQuestions.length;

        // MCQs completed - check paper_test_results for this subject
        const subjectId = chapter.subject_id;
        const subjectPaperTests = paperTestResults.filter((p: any) => p.subject_id === subjectId);
        const mcqsAttempted = subjectPaperTests.reduce((sum: number, p: any) => sum + (p.total_questions || 0), 0);
        const completedMcqs = Math.min(mcqsAttempted, totalMcqs);

        // Exams - using paper_test_results as exams (each test is like an exam)
        const totalExams = subjectPaperTests.length > 0 ? 1 : 0; // Consider as 1 exam per subject with tests
        const completedExams = subjectPaperTests.length > 0 ? 1 : 0;

        // Assignments for this chapter
        const chapterAssignments = (allAssignments || []).filter((a: any) => 
          a.chapter_id === chapterId || chapterTopicIds.includes(a.topic_id)
        );
        const totalAssignments = chapterAssignments.length;
        const chapterAssignmentIds = chapterAssignments.map((a: any) => a.id);
        const completedAssignments = assignmentSubmissions.filter((s: any) => 
          chapterAssignmentIds.includes(s.assignment_id)
        ).length;

        // Calculate chapter progress as average of component percentages
        const components: number[] = [];
        
        if (totalVideos > 0) {
          components.push((completedVideos / totalVideos) * 100);
        }
        if (totalMcqs > 0) {
          components.push((completedMcqs / totalMcqs) * 100);
        }
        if (totalExams > 0) {
          components.push((completedExams / totalExams) * 100);
        }
        if (totalAssignments > 0) {
          components.push((completedAssignments / totalAssignments) * 100);
        }

        const chapterProgress = components.length > 0 
          ? components.reduce((a, b) => a + b, 0) / components.length 
          : 0;

        return {
          id: chapterId,
          title: chapter.title,
          subjectName: chapter.popular_subjects?.name || "Unknown",
          progress: Math.round(chapterProgress * 10) / 10,
          videos: { completed: completedVideos, total: totalVideos },
          mcqs: { completed: completedMcqs, total: totalMcqs },
          exams: { completed: completedExams, total: totalExams },
          assignments: { completed: completedAssignments, total: totalAssignments },
        };
      });

      // Calculate overall progress as average of chapter progress
      const chaptersWithContent = chapterProgressList.filter(c => 
        c.videos.total > 0 || c.mcqs.total > 0 || c.exams.total > 0 || c.assignments.total > 0
      );
      
      const overallProgress = chaptersWithContent.length > 0
        ? chaptersWithContent.reduce((sum, c) => sum + c.progress, 0) / chaptersWithContent.length
        : 0;

      // Calculate totals
      const totalChapters = filteredChapters.length;
      const completedChapters = chapterProgressList.filter(c => c.progress >= 100).length;
      
      const totalVideos = chapterProgressList.reduce((sum, c) => sum + c.videos.total, 0);
      const completedVideos = chapterProgressList.reduce((sum, c) => sum + c.videos.completed, 0);
      
      const totalMcqs = chapterProgressList.reduce((sum, c) => sum + c.mcqs.total, 0);
      const completedMcqs = chapterProgressList.reduce((sum, c) => sum + c.mcqs.completed, 0);
      
      const totalExams = chapterProgressList.reduce((sum, c) => sum + c.exams.total, 0);
      const completedExams = chapterProgressList.reduce((sum, c) => sum + c.exams.completed, 0);
      
      const totalAssignments = chapterProgressList.reduce((sum, c) => sum + c.assignments.total, 0);
      const completedAssignments = chapterProgressList.reduce((sum, c) => sum + c.assignments.completed, 0);

      // Generate trend data (simplified - based on overall progress over time)
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      // For trend, we'll calculate cumulative progress based on when videos were watched
      const trendData: ProgressTrendPoint[] = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        
        // Count videos watched up to this date
        const videosWatchedByDate = watchedVideoLogs.filter((v: any) => {
          if (!v.created_at) return false;
          const watchDate = format(parseISO(v.created_at), "yyyy-MM-dd");
          return watchDate <= dateStr && (
            chapterIds.includes(v.chapter_id) || 
            topicIds.includes(v.topic_id) ||
            subjectIds.includes(v.subject_id)
          );
        });
        
        const uniqueVideosWatched = new Set(videosWatchedByDate.map((v: any) => v.video_title)).size;
        const videoProgress = totalVideos > 0 ? (uniqueVideosWatched / totalVideos) * 100 : 0;

        // Count MCQs attempted up to this date
        const mcqsByDate = paperTestResults.filter((p: any) => {
          if (!p.submitted_at) return false;
          return format(parseISO(p.submitted_at), "yyyy-MM-dd") <= dateStr && 
            subjectIds.includes(p.subject_id);
        }).reduce((sum: number, p: any) => sum + (p.total_questions || 0), 0);
        const mcqProgress = totalMcqs > 0 ? Math.min((mcqsByDate / totalMcqs) * 100, 100) : 0;

        // Count exams (paper tests) completed up to this date
        const examsByDate = paperTestResults.filter((p: any) => {
          if (!p.submitted_at) return false;
          return format(parseISO(p.submitted_at), "yyyy-MM-dd") <= dateStr &&
            subjectIds.includes(p.subject_id);
        }).length;
        const examProgress = totalExams > 0 ? (Math.min(examsByDate, totalExams) / totalExams) * 100 : 0;

        // Count assignments completed up to this date
        const assignmentsByDate = assignmentSubmissions.filter((a: any) => {
          if (!a.submitted_at) return false;
          return format(parseISO(a.submitted_at), "yyyy-MM-dd") <= dateStr;
        }).length;
        const assignmentProgress = totalAssignments > 0 ? (assignmentsByDate / totalAssignments) * 100 : 0;

        // Calculate overall progress for this date
        const progressComponents: number[] = [];
        if (totalVideos > 0) progressComponents.push(videoProgress);
        if (totalMcqs > 0) progressComponents.push(mcqProgress);
        if (totalExams > 0) progressComponents.push(examProgress);
        if (totalAssignments > 0) progressComponents.push(assignmentProgress);
        
        const dayProgress = progressComponents.length > 0
          ? progressComponents.reduce((a, b) => a + b, 0) / progressComponents.length
          : 0;

        return {
          date: dateStr,
          displayDate: format(date, "MMM d"),
          progress: Math.round(Math.min(dayProgress, 100) * 10) / 10,
          breakdown: {
            chapters: Math.round((completedChapters / Math.max(totalChapters, 1)) * 100 * 10) / 10,
            videos: Math.round(Math.min(videoProgress, 100) * 10) / 10,
            mcqs: Math.round(Math.min(mcqProgress, 100) * 10) / 10,
            exams: Math.round(Math.min(examProgress, 100) * 10) / 10,
            assignments: Math.round(Math.min(assignmentProgress, 100) * 10) / 10,
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
        currentProgress: Math.round(overallProgress * 10) / 10,
        breakdown: latestProgress?.breakdown || {
          chapters: 0,
          videos: 0,
          mcqs: 0,
          exams: 0,
          assignments: 0,
        },
        totals: {
          chaptersCompleted: completedChapters,
          totalChapters,
          videosWatched: completedVideos,
          totalVideos,
          mcqsCompleted: completedMcqs,
          totalMcqs,
          examsCompleted: completedExams,
          totalExams,
          assignmentsCompleted: completedAssignments,
          totalAssignments,
          testsAttempted: paperTestResults.length,
        },
        chapterDetails: chapterProgressList,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
