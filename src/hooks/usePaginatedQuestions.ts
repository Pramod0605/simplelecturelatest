import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 20;

export interface PaginatedQuestion {
  id: string;
  question_text: string;
  question_type: string;
  question_format: string;
  options?: Record<string, any>;
  correct_answer: string;
  explanation?: string;
  marks: number;
  difficulty: string;
  topic_id?: string;
  subtopic_id?: string;
  is_verified: boolean;
  is_ai_generated: boolean;
  is_important?: boolean;
  question_image_url?: string;
  option_images?: Record<string, string>;
  contains_formula: boolean;
  formula_type?: string;
  previous_year_paper_id?: string;
  created_at: string;
  subject_topics?: {
    id: string;
    title: string;
    chapter_id: string;
    subject_chapters: {
      id: string;
      title: string;
      subject_id: string;
    };
  };
}

export interface PaginatedQuestionsFilters {
  subjectId?: string;
  isAiGenerated?: boolean;
  difficulty?: string;
  topicId?: string;
  chapterId?: string;
  isVerified?: boolean;
  searchQuery?: string;
  chapterOnly?: boolean; // When true, only show questions with topic_id = NULL for the chapter
}

export const usePaginatedQuestions = (filters: PaginatedQuestionsFilters) => {
  return useInfiniteQuery({
    queryKey: ["paginated-questions", filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Use LEFT JOIN to include questions with topic_id = NULL (chapter-level questions)
      let query = supabase
        .from("questions")
        .select(`
          *,
          subject_topics(
            id,
            title,
            chapter_id,
            subject_chapters(
              id,
              title,
              subject_id
            )
          )
        `, { count: "exact" });

      // Filter by subject - handle both topic-based and chapter-based questions
      if (filters.subjectId) {
        // For questions with topics, filter via topic->chapter->subject chain
        // For chapter-level questions (topic_id = NULL), we need to use chapter_id directly
        query = query.or(
          `subject_topics.subject_chapters.subject_id.eq.${filters.subjectId},and(topic_id.is.null,chapter_id.in.(select id from subject_chapters where subject_id = '${filters.subjectId}'))`
        );
      }

      // Filter by AI-generated status
      if (filters.isAiGenerated !== undefined) {
        query = query.eq('is_ai_generated', filters.isAiGenerated);
      }

      // Filter by topic
      if (filters.topicId) {
        query = query.eq("topic_id", filters.topicId);
      }

      // Filter by chapter - include both topic-based and chapter-level questions
      if (filters.chapterId) {
        if (filters.chapterOnly) {
          // Only show chapter-level questions (topic_id is NULL)
          query = query.eq("chapter_id", filters.chapterId).is("topic_id", null);
        } else {
          // Show all questions for the chapter (both topic-based and chapter-level)
          query = query.or(
            `subject_topics.chapter_id.eq.${filters.chapterId},and(chapter_id.eq.${filters.chapterId},topic_id.is.null)`
          );
        }
      }

      // Filter by difficulty
      if (filters.difficulty) {
        query = query.eq("difficulty", filters.difficulty);
      }

      // Filter by verified status
      if (filters.isVerified !== undefined) {
        query = query.eq("is_verified", filters.isVerified);
      }

      // Server-side search
      if (filters.searchQuery) {
        query = query.ilike("question_text", `%${filters.searchQuery}%`);
      }

      // Order and paginate
      query = query
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        questions: data as PaginatedQuestion[],
        nextCursor: (pageParam + PAGE_SIZE < (count || 0)) ? pageParam + PAGE_SIZE : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    placeholderData: (previousData) => previousData,
  });
};
