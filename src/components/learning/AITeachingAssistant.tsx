import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, Send, Loader2, Globe, ChevronLeft, ChevronRight, Languages, Eye, Play } from 'lucide-react';
import { useTeachingAssistant, TeachingResponse, PresentationSlide } from '@/hooks/useTeachingAssistant';
import { useWebSpeech } from '@/hooks/useWebSpeech';
import { TeacherAvatarPanel } from './TeacherAvatarPanel';
import { PresentationSlide as SlideComponent } from './PresentationSlide';
import { QuestionHistory } from './QuestionHistory';
import { cn } from '@/lib/utils';

interface AITeachingAssistantProps {
  topicId?: string;
  chapterId?: string;
  topicTitle?: string;
  subjectName?: string;
  onTabActive?: () => void;
}

// Split text into chunks of ~12 words for dynamic subtitle display
function splitIntoSubtitleChunks(text: string): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  const wordsPerChunk = 12;
  
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  
  return chunks;
}

export function AITeachingAssistant({ topicId, chapterId, topicTitle, subjectName, onTabActive }: AITeachingAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [narrationLanguage, setNarrationLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [subtitleLanguage, setSubtitleLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [hasSpokenLoadingMessage, setHasSpokenLoadingMessage] = useState(false);
  const [infographicPhase, setInfographicPhase] = useState<'hidden' | 'zooming' | 'zoomed' | 'returning'>('hidden');
  
  const { isLoading, currentResponse, askQuestion, clearResponse } = useTeachingAssistant();
  const { 
    isListening, 
    isSpeaking, 
    transcript, 
    startListening, 
    stopListening, 
    speak, 
    stopSpeaking,
    clearTranscript,
    isSupported 
  } = useWebSpeech();

  const narrationQueueRef = useRef<Array<{ text: string; slideIndex: number; subtitleChunks: string[]; hasInfographic: boolean }>>([]);
  const isNarratingRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  const subtitleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const infographicTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Notify parent when tab is active
  useEffect(() => {
    onTabActive?.();
  }, [onTabActive]);

  // Keep muted ref in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Update input with voice transcript
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Speak loading message when loading starts
  useEffect(() => {
    if (isLoading && !hasSpokenLoadingMessage && !isMuted) {
      setHasSpokenLoadingMessage(true);
      const loadingMessage = narrationLanguage === 'hi-IN' 
        ? 'आपकी प्रस्तुति तैयार हो रही है! बस कुछ ही सेकंड, आपके लिए कुछ बहुत खास तैयार कर रहा हूं!'
        : 'Working on your presentation! Just a moment, I am preparing something special for you!';
      speak(loadingMessage, narrationLanguage, narrationLanguage === 'hi-IN' ? 'female' : 'male');
    }
    if (!isLoading) {
      setHasSpokenLoadingMessage(false);
    }
  }, [isLoading, hasSpokenLoadingMessage, isMuted, narrationLanguage, speak]);

  // Handle narration when response is received - START IMMEDIATELY
  useEffect(() => {
    if (currentResponse?.presentationSlides && !isMuted && !isNarratingRef.current) {
      // Stop loading message if playing
      stopSpeaking();
      
      const queue: Array<{ text: string; slideIndex: number; subtitleChunks: string[]; hasInfographic: boolean }> = [];
      
      currentResponse.presentationSlides.forEach((slide, index) => {
        const narrationText = slide.narration || slide.content;
        if (narrationText) {
          queue.push({ 
            text: narrationText, 
            slideIndex: index,
            subtitleChunks: splitIntoSubtitleChunks(narrationText),
            hasInfographic: !!slide.infographicUrl
          });
        }
      });
      
      if (queue.length > 0) {
        narrationQueueRef.current = queue;
        setCurrentSlideIndex(0);
        // Start narration IMMEDIATELY - no delay
        startNarration();
      }
    }
  }, [currentResponse, isMuted]);

  const startNarration = async () => {
    if (isNarratingRef.current || narrationQueueRef.current.length === 0) return;
    
    isNarratingRef.current = true;
    setIsNarrating(true);
    
    await processNarrationQueue();
  };

  const processNarrationQueue = async () => {
    while (narrationQueueRef.current.length > 0 && !isMutedRef.current) {
      const item = narrationQueueRef.current[0];
      
      // Update slide and reset infographic
      setCurrentSlideIndex(item.slideIndex);
      setInfographicPhase('hidden');
      
      // Calculate estimated narration duration for percentage-based timing
      // At 0.75x speed, ~90 words per minute
      const wordCount = item.text.split(/\s+/).length;
      const wordsPerMinute = 90;
      const estimatedDurationMs = (wordCount / wordsPerMinute) * 60 * 1000;
      
      // Phase timing: 40% slide view, 40% infographic zoom, 20% return
      const phase1Duration = Math.max(3000, estimatedDurationMs * 0.4); // 40% for slide (min 3s)
      const phase2Duration = Math.max(3000, estimatedDurationMs * 0.4); // 40% for infographic (min 3s)
      const phase3Duration = Math.max(1500, estimatedDurationMs * 0.2); // 20% return (min 1.5s)
      
      // Subtitle timing
      let chunkIndex = 0;
      const totalChunks = item.subtitleChunks.length;
      const totalDuration = phase1Duration + phase2Duration + phase3Duration;
      const timePerChunk = Math.max(2000, totalDuration / totalChunks);
      
      // Set initial subtitle
      setCurrentSubtitle(item.subtitleChunks[0] || item.text);
      
      // Start subtitle cycling immediately
      subtitleIntervalRef.current = setInterval(() => {
        chunkIndex = (chunkIndex + 1) % totalChunks;
        setCurrentSubtitle(item.subtitleChunks[chunkIndex] || '');
      }, timePerChunk);
      
      // Start narration IMMEDIATELY
      const speechPromise = new Promise<void>((resolve) => {
        speak(item.text, narrationLanguage, narrationLanguage === 'hi-IN' ? 'female' : 'male', () => {
          resolve();
        });
      });
      
      // PHASE 1: Slide visible for 40% of narration
      await new Promise(resolve => setTimeout(resolve, phase1Duration));
      
      // PHASE 2: Zoom infographic for 40% of narration (synced with speech)
      if (item.hasInfographic) {
        setInfographicPhase('zooming');
        await new Promise(resolve => setTimeout(resolve, 400)); // Quick zoom animation
        setInfographicPhase('zoomed');
        await new Promise(resolve => setTimeout(resolve, phase2Duration - 400));
        
        // PHASE 3: Return to slide for 20%
        setInfographicPhase('returning');
        await new Promise(resolve => setTimeout(resolve, 300));
        setInfographicPhase('hidden');
        await new Promise(resolve => setTimeout(resolve, phase3Duration - 300));
      } else {
        // No infographic - just wait for remaining time
        await new Promise(resolve => setTimeout(resolve, phase2Duration + phase3Duration));
      }
      
      // Wait for speech to complete if still playing
      await speechPromise;
      
      // Clear subtitle interval
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
        subtitleIntervalRef.current = null;
      }
      
      // Ensure infographic is hidden
      setInfographicPhase('hidden');
      
      // Remove from queue
      narrationQueueRef.current = narrationQueueRef.current.slice(1);
      
      // Brief pause before next slide
      if (narrationQueueRef.current.length > 0) {
        setCurrentSubtitle('');
        await new Promise(resolve => setTimeout(resolve, 500));
        setCurrentSlideIndex(narrationQueueRef.current[0].slideIndex);
      }
    }
    
    // Narration complete
    setCurrentSubtitle('');
    setIsNarrating(false);
    setInfographicPhase('hidden');
    isNarratingRef.current = false;
  };

  // Replay a specific slide
  const handleReplaySlide = (slideIndex: number) => {
    if (!activeResponse) return;
    
    // Stop any ongoing narration
    stopSpeaking();
    clearTimers();
    
    const slide = activeResponse.presentationSlides[slideIndex];
    if (!slide) return;
    
    const narrationText = slide.narration || slide.content;
    if (!narrationText) return;
    
    // Reset state
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    setCurrentSlideIndex(slideIndex);
    setInfographicPhase('hidden');
    
    // Build single-slide queue
    narrationQueueRef.current = [{
      text: narrationText,
      slideIndex,
      subtitleChunks: splitIntoSubtitleChunks(narrationText),
      hasInfographic: !!slide.infographicUrl
    }];
    
    // Start after brief delay
    setTimeout(() => startNarration(), 500);
  };

  const clearTimers = () => {
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
      subtitleIntervalRef.current = null;
    }
    if (infographicTimerRef.current) {
      clearTimeout(infographicTimerRef.current);
      infographicTimerRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    // Stop any ongoing narration
    stopSpeaking();
    clearTimers();
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    setInfographicPhase('hidden');
    
    const question = inputText.trim();
    setInputText('');
    clearTranscript();
    clearResponse();
    setCurrentSlideIndex(0);
    setCurrentSubtitle('');
    
    await askQuestion(question, topicId, chapterId, narrationLanguage, subjectName);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      startListening(narrationLanguage);
    }
  };

  const handleNarrationLanguageToggle = () => {
    const newLang = narrationLanguage === 'en-IN' ? 'hi-IN' : 'en-IN';
    setNarrationLanguage(newLang);
    stopSpeaking();
    clearTimers();
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    setInfographicPhase('hidden');
  };

  const handleSubtitleLanguageToggle = () => {
    setSubtitleLanguage(prev => prev === 'en-IN' ? 'hi-IN' : 'en-IN');
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      stopSpeaking();
      clearTimers();
      narrationQueueRef.current = [];
      isNarratingRef.current = false;
      setIsNarrating(false);
      setInfographicPhase('hidden');
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleNextSlide = () => {
    if (activeResponse && currentSlideIndex < activeResponse.presentationSlides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handleFollowUpClick = (question: string) => {
    setInputText(question);
  };

  // Store replay response separately to maintain presentation mode
  const [replayResponse, setReplayResponse] = useState<TeachingResponse | null>(null);

  const handleReplay = (slides: PresentationSlide[], narrationText: string) => {
    // Stop any ongoing narration first
    stopSpeaking();
    clearTimers();
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    setInfographicPhase('hidden');
    
    // Create replay response
    const response: TeachingResponse = {
      cached: true,
      answer: narrationText,
      presentationSlides: slides,
      latexFormulas: [],
      keyPoints: [],
      followUpQuestions: [],
      narrationText: narrationText,
    };
    
    // Set replay response (this will be used for display)
    setReplayResponse(response);
    setCurrentSlideIndex(0);
    setCurrentSubtitle('');
    
    // Build narration queue
    const queue: Array<{ text: string; slideIndex: number; subtitleChunks: string[]; hasInfographic: boolean }> = [];
    slides.forEach((slide, index) => {
      const text = slide.narration || slide.content;
      if (text) {
        queue.push({ 
          text, 
          slideIndex: index,
          subtitleChunks: splitIntoSubtitleChunks(text),
          hasInfographic: !!slide.infographicUrl
        });
      }
    });
    
    if (queue.length > 0 && !isMuted) {
      narrationQueueRef.current = queue;
      // Show first slide for 3 seconds before narrating
      setTimeout(() => startNarration(), 3000);
    }
  };

  // Use currentResponse or replayResponse, whichever is available
  const activeResponse = currentResponse || replayResponse;
  const totalSlides = activeResponse?.presentationSlides?.length || 0;
  const currentSlide = activeResponse?.presentationSlides?.[currentSlideIndex];

  // Clear replay response when new question is asked
  useEffect(() => {
    if (currentResponse) {
      setReplayResponse(null);
    }
  }, [currentResponse]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-160px)] flex gap-3 relative">
        {/* Question History Button */}
        <QuestionHistory
          topicId={topicId}
          chapterId={chapterId}
          onReplay={handleReplay}
        />

        {/* Left Panel - Presentation Display (80%) - Bigger */}
        <div className="flex-[80] flex flex-col gap-2">
          {/* Presentation Area - Takes most space */}
          <div className="flex-1 relative min-h-0">
            {isLoading ? (
              <Card className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
                <CardContent className="text-center py-12">
                  <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {narrationLanguage === 'hi-IN' ? 'प्रेजेंटेशन तैयार कर रहा हूं...' : 'Preparing your presentation...'}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    {narrationLanguage === 'hi-IN' ? 'कुछ खास तैयार हो रहा है!' : 'Something special is being prepared!'}
                  </p>
                </CardContent>
              </Card>
            ) : activeResponse && currentSlide ? (
              <div className="h-full flex flex-col">
                {/* Single Slide Display - PPT Style */}
                <div className="flex-1 relative overflow-hidden rounded-xl min-h-0">
                  <SlideComponent
                    slide={currentSlide}
                    isActive={true}
                    slideNumber={currentSlideIndex + 1}
                    totalSlides={totalSlides}
                    isStorySlide={currentSlide.isStory}
                    currentSubtitle={showSubtitles ? currentSubtitle : undefined}
                    isNarrating={isNarrating}
                    infographicPhase={infographicPhase}
                    onReplaySlide={() => handleReplaySlide(currentSlideIndex)}
                  />
                </div>

                {/* Slide Navigation - Compact */}
                <div className="flex items-center justify-center gap-3 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevSlide}
                    disabled={currentSlideIndex === 0}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Slide Indicators */}
                  <div className="flex items-center gap-1.5">
                    {activeResponse.presentationSlides.map((_, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setCurrentSlideIndex(idx);
                              if (!isNarrating) handleReplaySlide(idx);
                            }}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full transition-all hover:scale-125",
                              idx === currentSlideIndex 
                                ? "bg-primary scale-110" 
                                : "bg-muted-foreground/30 hover:bg-primary/50"
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs py-1">
                          <Play className="h-3 w-3 inline mr-1" />
                          Slide {idx + 1}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextSlide}
                    disabled={currentSlideIndex === totalSlides - 1}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-xs text-muted-foreground">
                    {currentSlideIndex + 1}/{totalSlides}
                  </span>
                </div>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">👨‍🏫</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {subjectName ? `${subjectName} AI Professor` : narrationLanguage === 'hi-IN' ? 'AI शिक्षक' : 'AI Teaching Assistant'}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {narrationLanguage === 'hi-IN' 
                      ? 'कोई भी प्रश्न पूछें और मैं आपको एक प्रेजेंटेशन के साथ समझाऊंगा।'
                      : 'Ask any question and I will explain with an interactive presentation.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Compact Question Input - Minimal footprint */}
          <div className="shrink-0 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={narrationLanguage === 'hi-IN' ? 'प्रश्न पूछें...' : 'Ask a question...'}
                className="min-h-[36px] max-h-[36px] resize-none text-sm py-2 border-0 shadow-none focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
              
              {/* Controls inline */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNarrationLanguageToggle}
                  className="h-7 px-2 text-xs"
                >
                  {narrationLanguage === 'en-IN' ? '🇬🇧' : '🇮🇳'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className="h-7 px-2 text-xs"
                >
                  <Eye className={cn("h-3 w-3", !showSubtitles && "opacity-50")} />
                </Button>
                
                {isSupported && (
                  <Button
                    variant={isListening ? "destructive" : "ghost"}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleVoiceToggle}
                    disabled={isLoading || isSpeaking}
                  >
                    {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  </Button>
                )}
                
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Teacher Avatar (20%) - Smaller */}
        <div className="flex-[20] min-w-[180px]">
          <TeacherAvatarPanel
            isSpeaking={isSpeaking || isNarrating}
            isProcessing={isLoading}
            isMuted={isMuted}
            onMuteToggle={handleMuteToggle}
            language={narrationLanguage}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
