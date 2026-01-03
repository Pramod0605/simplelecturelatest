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
  proficiencyTests: { completed: number; total: number };
  assignments: { completed: number; total: number };
}

interface ProgressBreakdown {
  chapters: number;
  videos: number;
  mcqs: number;
  exams: number;
  proficiencyTests: number;
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

      // Get all chapters from subject_chapters (including ai_generated_video_url for Classes tab videos)
      const { data: allSubjectChapters } = await supabase
        .from("subject_chapters")
        .select("id, subject_id, title, video_id, ai_generated_video_url, popular_subjects!inner(id, name)");

      // Filter chapters by subject IDs from the course
      let filteredChapters = allSubjectChapters || [];
      if (subjectIds.length > 0) {
        filteredChapters = filteredChapters.filter((c: any) => subjectIds.includes(c.subject_id));
      }
      if (subjectName && subjectName !== "all") {
        filteredChapters = filteredChapters.filter((c: any) => c.popular_subjects?.name === subjectName);
      }

      const chapterIds = filteredChapters.map((c: any) => c.id);

      // Get all topics for filtered chapters (including ai_generated_video_url for Classes tab videos)
      const { data: allTopics } = await supabase
        .from("subject_topics")
        .select("id, chapter_id, video_id, ai_generated_video_url");

      const filteredTopics = (allTopics || []).filter((t: any) => chapterIds.includes(t.chapter_id));
      const topicIds = filteredTopics.map((t: any) => t.id);

      // Get topic_videos (additional multi-language videos shown in Classes tab)
      const { data: allTopicVideos } = await supabase
        .from("topic_videos")
        .select("id, topic_id, video_name, is_active")
        .eq("is_active", true);

      // Fetch all real data in parallel
      const [
        questionsResult,
        assignmentsResult,
        proficiencyPapersResult,
        examPapersResult,
        videoLogsResult,
        assignmentSubmissionsResult,
        examTestResultsResult,
        proficiencyTestResultsResult,
        attendanceResult,
      ] = await Promise.all([
        // MCQs (questions) for chapters and topics
        supabase.from("questions").select("id, chapter_id, topic_id"),
        
        // Assignments for chapters
        supabase.from("assignments").select("id, chapter_id, topic_id"),
        
        // Proficiency papers (for total proficiency tests)
        supabase
          .from("subject_previous_year_papers")
          .select("id, subject_id, paper_category")
          .eq("paper_category", "proficiency"),
        
        // Exam papers (for total exams) - includes exam and previous_year
        supabase
          .from("subject_previous_year_papers")
          .select("id, subject_id, paper_category")
          .in("paper_category", ["exam", "previous_year"]),
        
        // Student's video watch logs (completed >= 80%)
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
        
        // Exam test results (paper_category = 'exam' or 'previous_year')
        supabase
          .from("paper_test_results")
          .select("id, subject_id, paper_id, paper_category, questions, answers, score, total_questions, submitted_at")
          .eq("student_id", user.id)
          .in("paper_category", ["exam", "previous_year"]),
        
        // Proficiency test results
        supabase
          .from("paper_test_results")
          .select("id, subject_id, paper_category, paper_id, submitted_at")
          .eq("student_id", user.id)
          .eq("paper_category", "proficiency"),
        
        // Class attendance
        supabase
          .from("class_attendance")
          .select("id, status, scheduled_class_id")
          .eq("student_id", user.id),
      ]);

      const allQuestions = questionsResult.data || [];
      const allAssignments = assignmentsResult.data || [];
      const proficiencyPapers = proficiencyPapersResult.data || [];
      const examPapers = examPapersResult.data || [];
      const watchedVideoLogs = videoLogsResult.data || [];
      const assignmentSubmissions = assignmentSubmissionsResult.data || [];
      const examTestResults = examTestResultsResult.data || [];
      const proficiencyTestResults = proficiencyTestResultsResult.data || [];
      const attendanceData = attendanceResult.data || [];

      // Calculate attendance stats
      const totalClasses = attendanceData.length;
      const presentClasses = attendanceData.filter((a: any) => a.status === 'present' || a.status === 'late').length;
      const attendancePercentage = totalClasses > 0 
        ? Math.round((presentClasses / totalClasses) * 100 * 10) / 10 
        : 0;
      
      // Filter topic_videos to only those in our filtered topics
      const topicVideos = (allTopicVideos || []).filter((tv: any) => topicIds.includes(tv.topic_id));

      // Calculate per-chapter progress using REAL data
      const chapterProgressList: ChapterProgress[] = filteredChapters.map((chapter: any) => {
        const chapterId = chapter.id;
        const subjectId = chapter.subject_id;
        const chapterTopics = filteredTopics.filter((t: any) => t.chapter_id === chapterId);
        const chapterTopicIds = chapterTopics.map((t: any) => t.id);

        // VIDEOS: Count from same sources as Classes tab (RecordedVideos.tsx)
        // 1. Chapter-level AI video
        const chapterHasAIVideo = chapter.ai_generated_video_url ? 1 : 0;
        // 2. Topic-level direct videos (video_id)
        const topicDirectVideos = chapterTopics.filter((t: any) => t.video_id).length;
        // 3. Topic-level AI videos (ai_generated_video_url)
        const topicAIVideos = chapterTopics.filter((t: any) => t.ai_generated_video_url).length;
        // 4. Additional videos from topic_videos table
        const additionalVideos = topicVideos.filter((tv: any) => chapterTopicIds.includes(tv.topic_id)).length;
        
        // Total = all video sources combined (matching Classes tab)
        const totalVideos = chapterHasAIVideo + topicDirectVideos + topicAIVideos + additionalVideos;
        
        // Completed = student's watch logs for this chapter (allow duplicates as requested)
        const watchedVideosForChapter = watchedVideoLogs.filter((v: any) => 
          v.chapter_id === chapterId || chapterTopicIds.includes(v.topic_id)
        );
        const completedVideos = watchedVideosForChapter.length; // Allow duplicates

        // MCQs: Real count from questions table
        const chapterQuestions = allQuestions.filter((q: any) => 
          q.chapter_id === chapterId || chapterTopicIds.includes(q.topic_id)
        );
        const totalMcqs = chapterQuestions.length;
        
        // MCQs completed = sum of scores from exam test results for this subject
        const subjectExamTests = examTestResults.filter((p: any) => p.subject_id === subjectId);
        const completedMcqs = Math.min(
          subjectExamTests.reduce((sum: number, p: any) => sum + (p.score || 0), 0),
          totalMcqs
        );

        // EXAMS: Real count from subject_previous_year_papers
        const subjectExamPapers = examPapers.filter((p: any) => p.subject_id === subjectId);
        const totalExams = subjectExamPapers.length;
        
        // Completed exams = unique paper_ids from test results
        const completedExamPaperIds = new Set(
          subjectExamTests.map((r: any) => r.paper_id).filter(Boolean)
        );
        const completedExams = Math.min(completedExamPaperIds.size, totalExams);

        // PROFICIENCY: Real count from subject_previous_year_papers
        const subjectProficiencyPapers = proficiencyPapers.filter((p: any) => p.subject_id === subjectId);
        const totalProficiencyTests = subjectProficiencyPapers.length;
        
        const completedProficiencyPaperIds = new Set(
          proficiencyTestResults.filter((p: any) => p.subject_id === subjectId).map((r: any) => r.paper_id).filter(Boolean)
        );
        const completedProficiencyTests = Math.min(completedProficiencyPaperIds.size, totalProficiencyTests);

        // ASSIGNMENTS: Real count from assignments table
        const chapterAssignments = allAssignments.filter((a: any) => 
          a.chapter_id === chapterId || chapterTopicIds.includes(a.topic_id)
        );
        const totalAssignments = chapterAssignments.length;
        const chapterAssignmentIds = chapterAssignments.map((a: any) => a.id);
        const completedAssignments = assignmentSubmissions.filter((s: any) => 
          chapterAssignmentIds.includes(s.assignment_id)
        ).length;

        // Calculate chapter progress as weighted average of components WITH content
        const components: number[] = [];
        
        if (totalVideos > 0) {
          components.push(Math.min((completedVideos / totalVideos) * 100, 100));
        }
        if (totalMcqs > 0) {
          components.push(Math.min((completedMcqs / totalMcqs) * 100, 100));
        }
        if (totalExams > 0) {
          components.push(Math.min((completedExams / totalExams) * 100, 100));
        }
        if (totalProficiencyTests > 0) {
          components.push(Math.min((completedProficiencyTests / totalProficiencyTests) * 100, 100));
        }
        if (totalAssignments > 0) {
          components.push(Math.min((completedAssignments / totalAssignments) * 100, 100));
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
          proficiencyTests: { completed: completedProficiencyTests, total: totalProficiencyTests },
          assignments: { completed: completedAssignments, total: totalAssignments },
        };
      });

      // OVERALL PROGRESS: Weighted average of ALL content (not chapter averages)
      // Sum up totals across all chapters
      const totalVideos = chapterProgressList.reduce((sum, c) => sum + c.videos.total, 0);
      const completedVideos = chapterProgressList.reduce((sum, c) => sum + c.videos.completed, 0);
      
      const totalMcqs = chapterProgressList.reduce((sum, c) => sum + c.mcqs.total, 0);
      const completedMcqs = chapterProgressList.reduce((sum, c) => sum + c.mcqs.completed, 0);
      
      // For exams: count unique subject exam papers (not per chapter since exams are subject-level)
      const relevantSubjectIds = [...new Set(filteredChapters.map((c: any) => c.subject_id))];
      const totalExams = examPapers.filter((p: any) => 
        subjectIds.length === 0 || relevantSubjectIds.includes(p.subject_id)
      ).length;
      const completedExamPaperIds = new Set(
        examTestResults
          .filter((r: any) => subjectIds.length === 0 || relevantSubjectIds.includes(r.subject_id))
          .map((r: any) => r.paper_id)
          .filter(Boolean)
      );
      const completedExams = Math.min(completedExamPaperIds.size, totalExams);
      
      const totalAssignments = chapterProgressList.reduce((sum, c) => sum + c.assignments.total, 0);
      const completedAssignments = chapterProgressList.reduce((sum, c) => sum + c.assignments.completed, 0);

      // Proficiency: subject-level
      const totalProficiencyTests = proficiencyPapers.filter((p: any) => 
        subjectIds.length === 0 || relevantSubjectIds.includes(p.subject_id)
      ).length;
      const completedProficiencyPaperIds = new Set(
        proficiencyTestResults
          .filter((r: any) => subjectIds.length === 0 || relevantSubjectIds.includes(r.subject_id))
          .map((r: any) => r.paper_id)
          .filter(Boolean)
      );
      const completedProficiencyTests = Math.min(completedProficiencyPaperIds.size, totalProficiencyTests);

      // Calculate overall progress as average of component percentages (only components with content)
      const overallComponents: number[] = [];
      if (totalVideos > 0) overallComponents.push(Math.min((completedVideos / totalVideos) * 100, 100));
      if (totalMcqs > 0) overallComponents.push(Math.min((completedMcqs / totalMcqs) * 100, 100));
      if (totalExams > 0) overallComponents.push(Math.min((completedExams / totalExams) * 100, 100));
      if (totalProficiencyTests > 0) overallComponents.push(Math.min((completedProficiencyTests / totalProficiencyTests) * 100, 100));
      if (totalAssignments > 0) overallComponents.push(Math.min((completedAssignments / totalAssignments) * 100, 100));

      const overallProgress = overallComponents.length > 0
        ? overallComponents.reduce((a, b) => a + b, 0) / overallComponents.length
        : 0;

      // Calculate totals
      const totalChapters = filteredChapters.length;
      const completedChapters = chapterProgressList.filter(c => c.progress >= 100).length;

      // Generate trend data (cumulative progress over time)
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      const trendData: ProgressTrendPoint[] = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        
        // Count videos watched up to this date (allow duplicates)
        const videosWatchedByDate = watchedVideoLogs.filter((v: any) => {
          if (!v.created_at) return false;
          const watchDate = format(parseISO(v.created_at), "yyyy-MM-dd");
          return watchDate <= dateStr && (
            chapterIds.includes(v.chapter_id) || 
            topicIds.includes(v.topic_id) ||
            (subjectIds.length > 0 && subjectIds.includes(v.subject_id))
          );
        }).length;
        
        const videoProgress = totalVideos > 0 ? Math.min((videosWatchedByDate / totalVideos) * 100, 100) : 0;

        // Count MCQs (scores) up to this date
        const mcqsByDate = examTestResults.filter((p: any) => {
          if (!p.submitted_at) return false;
          return format(parseISO(p.submitted_at), "yyyy-MM-dd") <= dateStr;
        }).reduce((sum: number, p: any) => sum + (p.score || 0), 0);
        const mcqProgress = totalMcqs > 0 ? Math.min((mcqsByDate / totalMcqs) * 100, 100) : 0;

        // Count unique exam papers completed up to this date
        const examPapersByDate = new Set(
          examTestResults.filter((p: any) => {
            if (!p.submitted_at) return false;
            return format(parseISO(p.submitted_at), "yyyy-MM-dd") <= dateStr;
          }).map((r: any) => r.paper_id).filter(Boolean)
        ).size;
        const examProgress = totalExams > 0 ? Math.min((examPapersByDate / totalExams) * 100, 100) : 0;

        // Count unique proficiency tests completed up to this date
        const proficiencyByDate = new Set(
          proficiencyTestResults.filter((p: any) => {
            if (!p.submitted_at) return false;
            return format(parseISO(p.submitted_at), "yyyy-MM-dd") <= dateStr;
          }).map((r: any) => r.paper_id).filter(Boolean)
        ).size;
        const proficiencyProgress = totalProficiencyTests > 0 ? Math.min((proficiencyByDate / totalProficiencyTests) * 100, 100) : 0;

        // Count assignments completed up to this date
        const assignmentsByDate = assignmentSubmissions.filter((a: any) => {
          if (!a.submitted_at) return false;
          return format(parseISO(a.submitted_at), "yyyy-MM-dd") <= dateStr;
        }).length;
        const assignmentProgress = totalAssignments > 0 ? Math.min((assignmentsByDate / totalAssignments) * 100, 100) : 0;

        // Calculate overall progress for this date
        const progressComponents: number[] = [];
        if (totalVideos > 0) progressComponents.push(videoProgress);
        if (totalMcqs > 0) progressComponents.push(mcqProgress);
        if (totalExams > 0) progressComponents.push(examProgress);
        if (totalProficiencyTests > 0) progressComponents.push(proficiencyProgress);
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
            videos: Math.round(videoProgress * 10) / 10,
            mcqs: Math.round(mcqProgress * 10) / 10,
            exams: Math.round(examProgress * 10) / 10,
            proficiencyTests: Math.round(proficiencyProgress * 10) / 10,
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
        currentProgress: Math.round(overallProgress * 10) / 10,
        breakdown: latestProgress?.breakdown || {
          chapters: 0,
          videos: 0,
          mcqs: 0,
          exams: 0,
          proficiencyTests: 0,
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
          proficiencyCompleted: completedProficiencyTests,
          totalProficiencyTests,
          testsAttempted: examTestResults.length + proficiencyTestResults.length,
          presentClasses,
          totalClasses,
          attendancePercentage,
        },
        chapterDetails: chapterProgressList,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
