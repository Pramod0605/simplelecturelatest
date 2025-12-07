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

      const response: TeachingResponse = {
        cached: data.cached || false,
        answer: data.answer || '',
        presentationSlides: data.presentationSlides || [],
        latexFormulas: data.latexFormulas || [],
        keyPoints: data.keyPoints || [],
        followUpQuestions: data.followUpQuestions || [],
        narrationText: data.narrationText || data.answer || '',
        subjectName: data.subjectName,
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
