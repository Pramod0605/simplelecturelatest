import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PresentationSlide {
  title: string;
  content: string;
  keyPoints?: string[];
  formula?: string;
  narration?: string;
  isStory?: boolean;
  isTips?: boolean;
  infographic?: string;
  infographicUrl?: string;
  videoUrl?: string;
}

export interface LatexFormula {
  formula: string;
  explanation: string;
}

export interface TeachingResponse {
  cached: boolean;
  answer: string;
  presentationSlides: PresentationSlide[];
  latexFormulas: LatexFormula[];
  keyPoints?: string[];
  followUpQuestions?: string[];
  narrationText: string;
  subjectName?: string;
}

export function useTeachingAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<TeachingResponse | null>(null);
  const { toast } = useToast();

  const askQuestion = useCallback(async (
    question: string,
    topicId?: string,
    chapterId?: string,
    language: string = 'en-IN',
    subjectName?: string
  ): Promise<TeachingResponse | null> => {
    if (!question.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question to ask the AI tutor.",
        variant: "destructive"
      });
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-teaching-assistant', {
        body: { question, topicId, chapterId, language, subjectName }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('[useTeachingAssistant] Raw response:', JSON.stringify(data).substring(0, 1000));
      console.log('[useTeachingAssistant] presentationSlides count:', data.presentationSlides?.length);
      
      // Normalize slide structure - ensure all fields are properly mapped
      const normalizedSlides: PresentationSlide[] = (data.presentationSlides || []).map((slide: any) => ({
        title: slide.title || 'Untitled Slide',
        content: slide.content || '',
        keyPoints: slide.keyPoints || slide.key_points || [],
        formula: slide.formula || null,
        narration: slide.narration || slide.content || '',
        isStory: slide.isStory === true || slide.is_story === true,
        isTips: slide.isTips === true || slide.is_tips === true,
        infographic: slide.infographic || null,
        infographicUrl: slide.infographicUrl || slide.infographic_url || null,
        videoUrl: slide.videoUrl || slide.video_url || null,
      }));
      
      console.log('[useTeachingAssistant] First normalized slide:', JSON.stringify(normalizedSlides[0], null, 2));

      const response: TeachingResponse = {
        cached: data.cached || false,
        answer: data.answer || '',
        presentationSlides: normalizedSlides,
        latexFormulas: data.latexFormulas || data.latex_formulas || [],
        keyPoints: data.keyPoints || data.key_points || [],
        followUpQuestions: data.followUpQuestions || data.follow_up_questions || [],
        narrationText: data.narrationText || data.narration_text || data.answer || '',
        subjectName: data.subjectName || data.subject_name,
      };

      setCurrentResponse(response);
      
      if (response.cached) {
        console.log('Response served from cache');
      }

      return response;
    } catch (error) {
      console.error('Teaching assistant error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from AI tutor",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearResponse = useCallback(() => {
    setCurrentResponse(null);
  }, []);

  const fetchHistory = useCallback(async (topicId?: string, chapterId?: string) => {
    try {
      let query = supabase
        .from('teaching_qa_cache')
        .select('id, question_text, answer_text, presentation_slides, created_at, language')
        .order('created_at', { ascending: false })
        .limit(20);

      if (topicId) {
        query = query.eq('topic_id', topicId);
      } else if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }, []);

  return {
    isLoading,
    currentResponse,
    askQuestion,
    clearResponse,
    fetchHistory,
  };
}
