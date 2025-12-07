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
      
      // Check if there's an error in the response
      if (data.error) {
        console.error('[useTeachingAssistant] Error from edge function:', data.error);
        throw new Error(data.error);
      }
      
      // Helper to detect if content is raw JSON (parsing failure indicator)
      const isContentRawJson = (content: string): boolean => {
        if (!content || typeof content !== 'string') return false;
        const trimmed = content.trim();
        return trimmed.startsWith('{') && (trimmed.includes('"presentation_slides"') || trimmed.includes('"title"'));
      };
      
      // Normalize slide structure - ensure all fields are properly mapped
      const normalizedSlides: PresentationSlide[] = (data.presentationSlides || []).map((slide: any) => {
        // Check if content is actually raw JSON (indicates parsing failed upstream)
        if (slide.content && isContentRawJson(slide.content)) {
          console.warn('[useTeachingAssistant] ⚠️ Detected raw JSON in slide content - this slide is invalid');
          return {
            title: 'Error',
            content: 'There was an issue loading this content.',
            keyPoints: ['Please try again'],
            formula: null,
            narration: 'Sorry, there was a problem loading this slide. Please try asking again.',
            isStory: false,
            isTips: false,
            infographic: null,
            infographicUrl: null,
            videoUrl: null,
          };
        }
        
        return {
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
        };
      });
      
      // Filter out completely invalid slides (those with raw JSON content)
      const validSlides = normalizedSlides.filter(slide => 
        slide.title !== 'Error' && 
        slide.keyPoints.length > 0 &&
        !isContentRawJson(slide.narration)
      );
      
      console.log('[useTeachingAssistant] Valid slides:', validSlides.length, 'of', normalizedSlides.length);
      console.log('[useTeachingAssistant] First normalized slide:', JSON.stringify(validSlides[0] || normalizedSlides[0], null, 2));

      // Use valid slides if available, otherwise fall back to all normalized slides
      const slidesToUse = validSlides.length > 0 ? validSlides : normalizedSlides;
      
      const response: TeachingResponse = {
        cached: data.cached || false,
        answer: data.answer || '',
        presentationSlides: slidesToUse,
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
