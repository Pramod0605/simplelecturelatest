import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, Send, Loader2, ChevronLeft, ChevronRight, Play, Maximize2, Minimize2, X } from 'lucide-react';
import { useTeachingAssistant, TeachingResponse, PresentationSlide } from '@/hooks/useTeachingAssistant';
import { useWebSpeech } from '@/hooks/useWebSpeech';
import { useGoogleTTS } from '@/hooks/useGoogleTTS';
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
  const [isPresentationReady, setIsPresentationReady] = useState(false);
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
  
  // Use Google TTS hook for audio pre-caching
  const { precacheAudio } = useGoogleTTS();

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

  // Reset presentation ready state when loading starts
  useEffect(() => {
    if (isLoading) {
      setIsPresentationReady(false);
    }
  }, [isLoading]);

  // Preload infographic images when response arrives
  const preloadImages = useCallback(async (slides: PresentationSlide[]): Promise<void> => {
    const imageUrls = slides
      .map(s => s.infographicUrl)
      .filter((url): url is string => !!url);
    
    console.log('[AITeachingAssistant] Preloading', imageUrls.length, 'images');
    
    if (imageUrls.length === 0) {
      return Promise.resolve();
    }
    
    const loadPromises = imageUrls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log('[AITeachingAssistant] Image loaded:', url.substring(0, 50));
          resolve();
        };
        img.onerror = () => {
          console.log('[AITeachingAssistant] Image error:', url.substring(0, 50));
          resolve(); // Don't block on errors
        };
        img.src = url;
      });
    });
    
    // Wait for all images or timeout after 3 seconds
    await Promise.race([
      Promise.all(loadPromises),
      new Promise<void>(resolve => setTimeout(resolve, 3000))
    ]);
  }, []);

  // Prepare presentation when response is received - NON-BLOCKING
  useEffect(() => {
    if (currentResponse?.presentationSlides && currentResponse.presentationSlides.length > 0) {
      console.log('[AITeachingAssistant] Response received with', currentResponse.presentationSlides.length, 'slides');
      
      // Mark ready IMMEDIATELY - preload images in background (non-blocking)
      setIsPresentationReady(true);
      console.log('[AITeachingAssistant] isPresentationReady set to true IMMEDIATELY');
      
      // Preload images in background (don't block narration)
      preloadImages(currentResponse.presentationSlides);
    }
  }, [currentResponse, preloadImages]);

  // Start narration IMMEDIATELY when presentation is ready
  useEffect(() => {
    if (
      currentResponse?.presentationSlides && 
      !isMuted && 
      !isNarratingRef.current && 
      isPresentationReady
    ) {
      console.log('[AITeachingAssistant] Starting narration immediately');
      
      // Build queue and start immediately - NO DELAY
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
  }, [currentResponse, isMuted, isPresentationReady]);

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
      // Check for pause - if paused, exit loop cleanly so resume can restart
      if (isPausedRef.current) {
        console.log('[Narration] Paused - exiting queue processing');
        break;
      }
      
      const item = narrationQueueRef.current[0];
      
      setCurrentSlideIndex(item.slideIndex);
      setInfographicPhase('hidden');
      
      // Calculate timing based on word count for 40-40-20 rule
      const totalChunks = item.subtitleChunks.length;
      const wordsInText = item.text.split(/\s+/).length;
      const wordsPerSecond = 2.0; // Slower to match audio pace
      const estimatedAudioDuration = (wordsInText / wordsPerSecond) * 1000;
      const timePerChunk = Math.max(1800, estimatedAudioDuration / totalChunks);
      
      // 40-40-20 timing phases (concurrent with narration)
      const phase1Duration = estimatedAudioDuration * 0.40; // Slide display
      const phase2Duration = estimatedAudioDuration * 0.40; // Infographic zoom
      
      let chunkIndex = 0;
      setCurrentSubtitle(item.subtitleChunks[0] || item.text);
      
      // Start speech and track completion
      let speechCompleted = false;
      let wasStopped = false;
      let speechStartTime = Date.now();
      
      speak(item.text, narrationLanguage, 'male', () => {
        speechCompleted = true;
      });
      
      // Schedule infographic phases CONCURRENT with narration (40-40-20)
      let infographicTimers: NodeJS.Timeout[] = [];
      if (item.hasInfographic) {
        // Phase 2 starts at 40% - zoom infographic
        infographicTimers.push(setTimeout(() => {
          if (!isPausedRef.current) {
            console.log('[Narration] Phase 2: Zooming infographic at 40%');
            setInfographicPhase('zooming');
            setTimeout(() => setInfographicPhase('zoomed'), 200);
          }
        }, phase1Duration));
        
        // Phase 3 starts at 80% - return to slide
        infographicTimers.push(setTimeout(() => {
          if (!isPausedRef.current) {
            console.log('[Narration] Phase 3: Returning to slide at 80%');
            setInfographicPhase('returning');
            setTimeout(() => setInfographicPhase('hidden'), 300);
          }
        }, phase1Duration + phase2Duration));
      }
      
      // Sync subtitles with estimated audio timing
      subtitleIntervalRef.current = setInterval(() => {
        if (chunkIndex < totalChunks - 1) {
          chunkIndex++;
          setCurrentSubtitle(item.subtitleChunks[chunkIndex] || '');
        }
      }, timePerChunk);
      
      // Wait for speech to actually complete before moving to next slide
      while (!speechCompleted && !isMutedRef.current && !wasStopped) {
        // Check if paused - exit cleanly
        if (isPausedRef.current) {
          console.log('[Narration] Pause detected during speech wait');
          wasStopped = true;
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Safety timeout - if speech takes way too long (3x estimated), move on
        if (Date.now() - speechStartTime > estimatedAudioDuration * 3) {
          console.warn('Speech timeout, moving to next slide');
          break;
        }
      }
      
      // Clear any remaining infographic timers
      infographicTimers.forEach(timer => clearTimeout(timer));
      
      // Clear subtitle interval
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
        subtitleIntervalRef.current = null;
      }
      
      setInfographicPhase('hidden');
      
      // If stopped/paused, exit loop cleanly
      if (wasStopped) {
        console.log('[Narration] Exiting queue due to pause/stop');
        break;
      }
      
      narrationQueueRef.current = narrationQueueRef.current.slice(1);
      
      // Longer pause before next slide to prevent TTS rate limiting - 3 seconds
      if (narrationQueueRef.current.length > 0) {
        setCurrentSubtitle('');
        
        // No pre-caching - causes parallel requests that hit rate limits
        // Just wait before next slide
        await new Promise(resolve => setTimeout(resolve, 4000)); // 4 second delay between slides
        
        // Check pause again after delay
        if (isPausedRef.current) {
          console.log('[Narration] Paused during inter-slide delay');
          break;
        }
        
        setCurrentSlideIndex(narrationQueueRef.current[0].slideIndex);
      }
    }
    
    // Only mark complete if not paused (paused = will resume later)
    if (!isPausedRef.current) {
      setCurrentSubtitle('');
      setProgress(100);
    }
    
    setIsNarrating(false);
    setInfographicPhase('hidden');
    isNarratingRef.current = false;
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handlePlayPause = () => {
    if (isPaused) {
      // Resume: restart from current slide
      setIsPaused(false);
      isPausedRef.current = false;
      
      if (activeResponse) {
        console.log('[PlayPause] Resuming from slide', currentSlideIndex);
        // Small delay to ensure state is updated
        setTimeout(() => {
          handleReplaySlide(currentSlideIndex);
        }, 100);
      }
    } else {
      // Pause: stop everything cleanly
      console.log('[PlayPause] Pausing');
      setIsPaused(true);
      isPausedRef.current = true;
      stopSpeaking();
      clearTimers();
      
      // Clear queue so processNarrationQueue exits
      narrationQueueRef.current = [];
      isNarratingRef.current = false;
      setIsNarrating(false);
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
    setIsPresentationReady(false);
    
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
    isNarratingRef.current = false;
    setIsNarrating(false);
    setInfographicPhase('hidden');
    
    // Restart narration from current slide in the new language
    if (activeResponse?.presentationSlides) {
      const remainingSlides = activeResponse.presentationSlides.slice(currentSlideIndex);
      const queue: Array<{ text: string; slideIndex: number; subtitleChunks: string[]; hasInfographic: boolean }> = [];
      
      remainingSlides.forEach((slide, idx) => {
        const narrationText = slide.narration || slide.content;
        if (narrationText) {
          queue.push({
            text: narrationText,
            slideIndex: currentSlideIndex + idx,
            subtitleChunks: splitIntoSubtitleChunks(narrationText),
            hasInfographic: !!slide.infographicUrl
          });
        }
      });
      
      if (queue.length > 0) {
        narrationQueueRef.current = queue;
        setTimeout(() => startNarration(), 300);
      }
    }
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
              {isLoading || (activeResponse && !isPresentationReady) ? (
                <Card className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
                  <CardContent className="text-center py-12">
                    <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">
                      {isLoading 
                        ? (narrationLanguage === 'hi-IN' ? 'प्रेजेंटेशन तैयार कर रहा हूं...' : 'Preparing your presentation...')
                        : (narrationLanguage === 'hi-IN' ? 'स्लाइड्स लोड हो रही हैं...' : 'Loading slides...')
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : activeResponse && currentSlide && isPresentationReady ? (
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
                  <CardContent className="text-center py-8 px-6 max-w-2xl">
                    {/* Teacher Avatar */}
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border-4 border-primary/30 shadow-lg">
                      <span className="text-6xl">👨‍🏫</span>
                    </div>
                    
                    {/* Greeting */}
                    <h2 className="text-2xl font-bold mb-3 text-foreground">
                      {narrationLanguage === 'hi-IN' 
                        ? `नमस्ते! मैं आपका ${subjectName || 'विषय'} शिक्षक हूं।`
                        : `Hello! I am your ${subjectName || 'Subject'} Teacher.`
                      }
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {narrationLanguage === 'hi-IN'
                        ? 'मैं आपकी कैसे मदद कर सकता हूं?'
                        : 'How may I help you today?'
                      }
                    </p>
                    
                    {/* Subject Scope Notice */}
                    <div className="bg-primary/10 rounded-lg px-4 py-3 mb-6 text-sm text-muted-foreground">
                      {narrationLanguage === 'hi-IN'
                        ? `मैं ${subjectName || 'इस विषय'} के प्रश्नों का उत्तर दे सकता हूं। अन्य विषयों के लिए संबंधित शिक्षक से पूछें।`
                        : `I can answer questions about ${subjectName || 'this subject'}. For other subjects, please consult the respective teacher.`
                      }
                    </div>
                    
                    {/* Voice Input Prompt */}
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        {narrationLanguage === 'hi-IN' 
                          ? 'अपना प्रश्न बोलें या नीचे टाइप करें'
                          : 'Speak your question or type below'
                        }
                      </p>
                      
                      {isSupported && (
                        <Button
                          variant={isListening ? "destructive" : "default"}
                          size="lg"
                          className={cn(
                            "rounded-full h-16 w-16 p-0 shadow-lg transition-all",
                            isListening && "animate-pulse ring-4 ring-destructive/30"
                          )}
                          onClick={handleVoiceToggle}
                          disabled={isLoading}
                        >
                          {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                        </Button>
                      )}
                      
                      {isListening && (
                        <p className="text-sm text-primary animate-pulse">
                          {narrationLanguage === 'hi-IN' ? 'सुन रहा हूं...' : 'Listening...'}
                        </p>
                      )}
                    </div>
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
