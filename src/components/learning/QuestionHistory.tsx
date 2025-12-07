import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Play, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CachedQuestion {
  id: string;
  question_text: string;
  answer_text: string;
  presentation_slides: any;
  created_at: string;
  language: string;
}

interface QuestionHistoryProps {
  topicId?: string;
  chapterId?: string;
  onReplay: (slides: any[], narrationText: string) => void;
}

export function QuestionHistory({ topicId, chapterId, onReplay }: QuestionHistoryProps) {
  const [history, setHistory] = useState<CachedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, topicId, chapterId]);

  const fetchHistory = async () => {
    setIsLoading(true);
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
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplay = (item: CachedQuestion) => {
    const slides = item.presentation_slides || [];
    onReplay(slides, item.answer_text);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-card/80 backdrop-blur-sm shadow-sm hover:bg-accent"
          title="Question History"
        >
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Question History
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No questions asked yet</p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors group"
                >
                  <p className="text-sm font-medium line-clamp-2 mb-2">
                    {item.question_text}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.created_at), 'MMM d, h:mm a')}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleReplay(item)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Replay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
