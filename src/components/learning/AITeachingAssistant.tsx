import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, Send, Loader2, ChevronLeft, ChevronRight, Play, Maximize2, Minimize2, X } from 'lucide-react';
import { useTeachingAssistant, TeachingResponse, PresentationSlide } from '@/hooks/useTeachingAssistant';
import { useWebSpeech } from '@/hooks/useWebSpeech';
import { TeacherAvatarPanel } from './TeacherAvatarPanel';
import { PresentationSlide as SlideComponent } from './PresentationSlide';
import { FloatingAvatar } from './FloatingAvatar';
import { PlaybackControls } from './PlaybackControls';
import { QuestionHistory } from './QuestionHistory';
import { cn } from '@/lib/utils';

interface AITeachingAssistantProps {
  topicId?: string;
  chapterId?: string;
  topicTitle?: string;
  subjectName?: string;
  onTabActive?: () => void;
}

function splitIntoSubtitleChunks(text: string): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  const wordsPerChunk = 12;
  
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  
  return chunks;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AITeachingAssistant({ topicId, chapterId, topicTitle, subjectName, onTabActive }: AITeachingAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [narrationLanguage, setNarrationLanguage] = useState<'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN' | 'ml-IN'>('en-IN');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasSpokenLoadingMessage, setHasSpokenLoadingMessage] = useState(false);
  const [infographicPhase, setInfographicPhase] = useState<'hidden' | 'zooming' | 'zoomed' | 'returning'>('hidden');
  
  // UI States
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  
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

  const containerRef = useRef<HTMLDivElement>(null);
  const narrationQueueRef = useRef<Array<{ text: string; slideIndex: number; subtitleChunks: string[]; hasInfographic: boolean }>>([]);
  const isNarratingRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  const isPausedRef = useRef(isPaused);
  const subtitleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onTabActive?.();
  }, [onTabActive]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Calculate total time when response is received
  useEffect(() => {
    if (currentResponse?.presentationSlides) {
      let totalWords = 0;
      currentResponse.presentationSlides.forEach(slide => {
        const text = slide.narration || slide.content;
        if (text) totalWords += text.split(/\s+/).length;
      });
      // Estimate: 90 words per minute at 0.7x speed
      const estimatedSeconds = (totalWords / 90) * 60;
      setTotalTime(estimatedSeconds);
    }
  }, [currentResponse]);

  // Speak loading message
  useEffect(() => {
    if (isLoading && !hasSpokenLoadingMessage && !isMuted) {
      setHasSpokenLoadingMessage(true);
      const loadingMessage = narrationLanguage === 'hi-IN' 
        ? 'आपकी प्रस्तुति तैयार हो रही है! बस कुछ ही सेकंड!'
        : 'Working on your presentation! Just a moment!';
      speak(loadingMessage, narrationLanguage, narrationLanguage === 'hi-IN' ? 'female' : 'male');
    }
    if (!isLoading) {
      setHasSpokenLoadingMessage(false);
    }
  }, [isLoading, hasSpokenLoadingMessage, isMuted, narrationLanguage, speak]);

  // Start narration when response is received
  useEffect(() => {
    if (currentResponse?.presentationSlides && !isMuted && !isNarratingRef.current) {
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
        setProgress(0);
        setCurrentTime(0);
        startNarration();
      }
    }
  }, [currentResponse, isMuted]);

  const startNarration = async () => {
    if (isNarratingRef.current || narrationQueueRef.current.length === 0) return;
    
    isNarratingRef.current = true;
    setIsNarrating(true);
    setIsPaused(false);
    
    // Start progress tracking
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setCurrentTime(elapsed);
      if (totalTime > 0) {
        setProgress(Math.min((elapsed / totalTime) * 100, 100));
      }
    }, 100);
    
    await processNarrationQueue();
  };

  const processNarrationQueue = async () => {
    while (narrationQueueRef.current.length > 0 && !isMutedRef.current) {
      // Check for pause
      while (isPausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const item = narrationQueueRef.current[0];
      
      setCurrentSlideIndex(item.slideIndex);
      setInfographicPhase('hidden');
      
      const wordCount = item.text.split(/\s+/).length;
      const wordsPerMinute = 90;
      const estimatedDurationMs = (wordCount / wordsPerMinute) * 60 * 1000;
      
      const phase1Duration = Math.max(2000, estimatedDurationMs * 0.4);
      const phase2Duration = Math.max(2000, estimatedDurationMs * 0.4);
      const phase3Duration = Math.max(1000, estimatedDurationMs * 0.2);
      
      let chunkIndex = 0;
      const totalChunks = item.subtitleChunks.length;
      const totalDuration = phase1Duration + phase2Duration + phase3Duration;
      const timePerChunk = Math.max(1500, totalDuration / totalChunks);
      
      setCurrentSubtitle(item.subtitleChunks[0] || item.text);
      
      subtitleIntervalRef.current = setInterval(() => {
        chunkIndex = (chunkIndex + 1) % totalChunks;
        setCurrentSubtitle(item.subtitleChunks[chunkIndex] || '');
      }, timePerChunk);
      
      let speechCompleted = false;
      speak(item.text, narrationLanguage, 'male', () => {
        speechCompleted = true;
      });
      
      await new Promise(resolve => setTimeout(resolve, phase1Duration));
      
      if (item.hasInfographic) {
        setInfographicPhase('zooming');
        await new Promise(resolve => setTimeout(resolve, 300));
        setInfographicPhase('zoomed');
        await new Promise(resolve => setTimeout(resolve, phase2Duration - 300));
        
        setInfographicPhase('returning');
        await new Promise(resolve => setTimeout(resolve, 200));
        setInfographicPhase('hidden');
        await new Promise(resolve => setTimeout(resolve, phase3Duration - 200));
      } else {
        await new Promise(resolve => setTimeout(resolve, phase2Duration + phase3Duration));
      }
      
      while (!speechCompleted && !isMutedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
        subtitleIntervalRef.current = null;
      }
      
      setInfographicPhase('hidden');
      narrationQueueRef.current = narrationQueueRef.current.slice(1);
      
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
    setProgress(100);
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handlePlayPause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (!isNarratingRef.current && activeResponse) {
        // Restart from current slide
        handleReplaySlide(currentSlideIndex);
      }
    } else {
      setIsPaused(true);
      stopSpeaking();
    }
  };

  const handleReplaySlide = (slideIndex: number) => {
    if (!activeResponse) return;
    
    stopSpeaking();
    clearTimers();
    
    const slide = activeResponse.presentationSlides[slideIndex];
    if (!slide) return;
    
    const narrationText = slide.narration || slide.content;
    if (!narrationText) return;
    
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    setCurrentSlideIndex(slideIndex);
    setInfographicPhase('hidden');
    setIsPaused(false);
    
    narrationQueueRef.current = [{
      text: narrationText,
      slideIndex,
      subtitleChunks: splitIntoSubtitleChunks(narrationText),
      hasInfographic: !!slide.infographicUrl
    }];
    
    setTimeout(() => startNarration(), 300);
  };

  const clearTimers = () => {
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
      subtitleIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    stopSpeaking();
    clearTimers();
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    setInfographicPhase('hidden');
    setProgress(0);
    setCurrentTime(0);
    
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

  const handleLanguageChange = (lang: 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN' | 'ml-IN') => {
    setNarrationLanguage(lang);
    stopSpeaking();
    clearTimers();
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    setInfographicPhase('hidden');
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

  const handleFullScreenToggle = () => {
    if (!isFullScreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullScreen(!isFullScreen);
  };

  const handleMinimizeToggle = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSeek = (newProgress: number) => {
    // Calculate which slide corresponds to this progress
    if (!activeResponse) return;
    const totalSlides = activeResponse.presentationSlides.length;
    const targetSlide = Math.floor((newProgress / 100) * totalSlides);
    setCurrentSlideIndex(Math.min(targetSlide, totalSlides - 1));
    setProgress(newProgress);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    // Speed would affect TTS - for now just store it
  };

  const [replayResponse, setReplayResponse] = useState<TeachingResponse | null>(null);

  const handleReplay = (slides: PresentationSlide[], narrationText: string) => {
    stopSpeaking();
    clearTimers();
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    setInfographicPhase('hidden');
    
    const response: TeachingResponse = {
      cached: true,
      answer: narrationText,
      presentationSlides: slides,
      latexFormulas: [],
      keyPoints: [],
      followUpQuestions: [],
      narrationText: narrationText,
    };
    
    setReplayResponse(response);
    setCurrentSlideIndex(0);
    setCurrentSubtitle('');
    setProgress(0);
    
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
      setTimeout(() => startNarration(), 500);
    }
  };

  const activeResponse = currentResponse || replayResponse;
  const totalSlides = activeResponse?.presentationSlides?.length || 0;
  const currentSlide = activeResponse?.presentationSlides?.[currentSlideIndex];

  useEffect(() => {
    if (currentResponse) {
      setReplayResponse(null);
    }
  }, [currentResponse]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Minimized View
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-background/95 backdrop-blur-md border rounded-lg shadow-lg px-4 py-2 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlayPause}
          className="h-8 w-8 p-0"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <span className="h-4 w-4">❚❚</span>}
        </Button>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            📖 {currentSlide?.title || topicTitle || 'Presentation'}
          </p>
          <p className="text-xs text-muted-foreground">
            Slide {currentSlideIndex + 1} / {totalSlides}
          </p>
        </div>
        
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatTime(currentTime)} / {formatTime(totalTime)}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMinimizeToggle}
          className="h-8 w-8 p-0"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div 
        ref={containerRef}
        className={cn(
          "flex flex-col bg-background relative",
          isFullScreen ? "fixed inset-0 z-50" : "h-[calc(100vh-80px)]"
        )}
      >
        {/* Question History Button */}
        <QuestionHistory
          topicId={topicId}
          chapterId={chapterId}
          onReplay={handleReplay}
        />

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex gap-2 min-h-0 p-2",
          isFullScreen ? "p-4" : ""
        )}>
          {/* Presentation Area - 90% in normal mode, 100% in fullscreen */}
          <div className={cn(
            "flex flex-col min-h-0",
            isFullScreen ? "flex-1" : "flex-[90]"
          )}>
            {/* Presentation Display */}
            <div className="flex-1 relative min-h-0">
              {isLoading ? (
                <Card className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
                  <CardContent className="text-center py-12">
                    <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">
                      {narrationLanguage === 'hi-IN' ? 'प्रेजेंटेशन तैयार कर रहा हूं...' : 'Preparing your presentation...'}
                    </p>
                  </CardContent>
                </Card>
              ) : activeResponse && currentSlide ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 relative overflow-hidden rounded-xl min-h-0">
                    <SlideComponent
                      slide={currentSlide}
                      isActive={true}
                      slideNumber={currentSlideIndex + 1}
                      totalSlides={totalSlides}
                      isStorySlide={currentSlide.isStory}
                      currentSubtitle={currentSubtitle}
                      isNarrating={isNarrating}
                      infographicPhase={infographicPhase}
                      onReplaySlide={() => handleReplaySlide(currentSlideIndex)}
                      isFullScreen={isFullScreen}
                    />
                    
                    {/* Floating Avatar in Fullscreen */}
                    {isFullScreen && (
                      <FloatingAvatar
                        isSpeaking={isSpeaking || isNarrating}
                        isProcessing={isLoading}
                        language={narrationLanguage}
                        onMuteToggle={handleMuteToggle}
                        isMuted={isMuted}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <Card className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
                  <CardContent className="text-center py-12">
                    <div className="text-6xl mb-4">👨‍🏫</div>
                    <h3 className="text-xl font-semibold mb-2">
                      {subjectName ? `${subjectName} AI Professor` : 'AI Teaching Assistant'}
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Ask any question and I will explain with an interactive presentation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Playback Controls - Video-like */}
            {activeResponse && (
              <PlaybackControls
                isPaused={isPaused}
                onPlayPause={handlePlayPause}
                onPrevSlide={handlePrevSlide}
                onNextSlide={handleNextSlide}
                currentSlide={currentSlideIndex}
                totalSlides={totalSlides}
                isMuted={isMuted}
                onMuteToggle={handleMuteToggle}
                isFullScreen={isFullScreen}
                onFullScreenToggle={handleFullScreenToggle}
                isMinimized={isMinimized}
                onMinimizeToggle={handleMinimizeToggle}
                language={narrationLanguage}
                onLanguageChange={handleLanguageChange}
                playbackSpeed={playbackSpeed}
                onSpeedChange={handleSpeedChange}
                progress={progress}
                onSeek={handleSeek}
                currentTime={formatTime(currentTime)}
                totalTime={formatTime(totalTime)}
              />
            )}

            {/* Question Input - Compact */}
            <div className="shrink-0 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 mt-2">
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
                
                <div className="flex items-center gap-1 shrink-0">
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

          {/* Avatar Panel - 10% in normal mode, hidden in fullscreen */}
          {!isFullScreen && (
            <div className="flex-[10] min-w-[120px] max-w-[160px]">
              <TeacherAvatarPanel
                isSpeaking={isSpeaking || isNarrating}
                isProcessing={isLoading}
                isMuted={isMuted}
                onMuteToggle={handleMuteToggle}
                language={narrationLanguage}
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
