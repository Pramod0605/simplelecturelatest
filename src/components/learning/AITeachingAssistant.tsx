import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, Send, Loader2, Globe, ChevronLeft, ChevronRight, Languages, Eye } from 'lucide-react';
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

// Split text into chunks of ~15 words for dynamic subtitle display
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

  const narrationQueueRef = useRef<Array<{ text: string; slideIndex: number; subtitleChunks: string[] }>>([]);
  const isNarratingRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  const subtitleIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        ? 'आपकी प्रस्तुति तैयार हो रही है, कृपया प्रतीक्षा करें...'
        : 'We are working on your presentation, please wait...';
      speak(loadingMessage, narrationLanguage, narrationLanguage === 'hi-IN' ? 'female' : 'male');
    }
    if (!isLoading) {
      setHasSpokenLoadingMessage(false);
    }
  }, [isLoading, hasSpokenLoadingMessage, isMuted, narrationLanguage, speak]);

  // Handle narration when response is received - build queue from per-slide narration
  useEffect(() => {
    if (currentResponse?.presentationSlides && !isMuted && !isNarratingRef.current) {
      // Stop loading message if playing
      stopSpeaking();
      
      const queue: Array<{ text: string; slideIndex: number; subtitleChunks: string[] }> = [];
      
      currentResponse.presentationSlides.forEach((slide, index) => {
        const narrationText = slide.narration || slide.content;
        if (narrationText) {
          queue.push({ 
            text: narrationText, 
            slideIndex: index,
            subtitleChunks: splitIntoSubtitleChunks(narrationText)
          });
        }
      });
      
      if (queue.length > 0) {
        narrationQueueRef.current = queue;
        setCurrentSlideIndex(0);
        // Start narration after a brief delay to ensure UI is ready
        setTimeout(() => startNarration(), 500);
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
      
      // Update slide
      setCurrentSlideIndex(item.slideIndex);
      
      // Start dynamic subtitle cycling
      let chunkIndex = 0;
      const totalChunks = item.subtitleChunks.length;
      
      // Calculate time per chunk based on narration length
      const estimatedSpeakTime = item.text.length * 50; // ~50ms per character
      const timePerChunk = Math.max(2000, estimatedSpeakTime / totalChunks);
      
      // Show first chunk immediately
      setCurrentSubtitle(item.subtitleChunks[0] || item.text);
      
      // Cycle through subtitle chunks during narration
      subtitleIntervalRef.current = setInterval(() => {
        chunkIndex = (chunkIndex + 1) % totalChunks;
        setCurrentSubtitle(item.subtitleChunks[chunkIndex] || '');
      }, timePerChunk);
      
      // Wait for speech to complete
      await new Promise<void>((resolve) => {
        speak(item.text, narrationLanguage, narrationLanguage === 'hi-IN' ? 'female' : 'male', () => {
          resolve();
        });
      });
      
      // Clear subtitle interval
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
        subtitleIntervalRef.current = null;
      }
      
      // Remove from queue after speaking
      narrationQueueRef.current = narrationQueueRef.current.slice(1);
      
      // Brief pause between slides (max 10 seconds wait is enforced by TTS)
      if (narrationQueueRef.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Narration complete
    setCurrentSubtitle('');
    setIsNarrating(false);
    isNarratingRef.current = false;
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    // Stop any ongoing narration
    stopSpeaking();
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
      subtitleIntervalRef.current = null;
    }
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    
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
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
      subtitleIntervalRef.current = null;
    }
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
  };

  const handleSubtitleLanguageToggle = () => {
    // Just toggle subtitle language - display what's available
    setSubtitleLanguage(prev => prev === 'en-IN' ? 'hi-IN' : 'en-IN');
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      stopSpeaking();
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
        subtitleIntervalRef.current = null;
      }
      narrationQueueRef.current = [];
      isNarratingRef.current = false;
      setIsNarrating(false);
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
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
      subtitleIntervalRef.current = null;
    }
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    
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
    const queue: Array<{ text: string; slideIndex: number; subtitleChunks: string[] }> = [];
    slides.forEach((slide, index) => {
      const text = slide.narration || slide.content;
      if (text) {
        queue.push({ 
          text, 
          slideIndex: index,
          subtitleChunks: splitIntoSubtitleChunks(text)
        });
      }
    });
    
    if (queue.length > 0 && !isMuted) {
      narrationQueueRef.current = queue;
      setTimeout(() => startNarration(), 500);
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
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
      }
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-200px)] flex gap-4 relative">
        {/* Question History Button */}
        <QuestionHistory
          topicId={topicId}
          chapterId={chapterId}
          onReplay={handleReplay}
        />

        {/* Left Panel - Presentation Display (75%) */}
        <div className="flex-[75] flex flex-col gap-3">
          {/* Presentation Area */}
          <div className="flex-1 relative">
            {isLoading ? (
              <Card className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
                <CardContent className="text-center py-12">
                  <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {narrationLanguage === 'hi-IN' ? 'प्रेजेंटेशन तैयार कर रहा हूं...' : 'Preparing your presentation...'}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    {narrationLanguage === 'hi-IN' ? 'कृपया प्रतीक्षा करें...' : 'This may take a few seconds...'}
                  </p>
                </CardContent>
              </Card>
            ) : activeResponse && currentSlide ? (
              <div className="h-full flex flex-col">
                {/* Single Slide Display - PPT Style */}
                <div className="flex-1 relative overflow-hidden rounded-xl">
                  <SlideComponent
                    slide={currentSlide}
                    isActive={true}
                    slideNumber={currentSlideIndex + 1}
                    totalSlides={totalSlides}
                    isStorySlide={currentSlide.isStory}
                    currentSubtitle={showSubtitles ? currentSubtitle : undefined}
                    isNarrating={isNarrating}
                  />
                </div>

                {/* Slide Navigation */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevSlide}
                    disabled={currentSlideIndex === 0}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Slide Indicators */}
                  <div className="flex items-center gap-2">
                    {activeResponse.presentationSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all",
                          idx === currentSlideIndex 
                            ? "bg-primary scale-125" 
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        )}
                      />
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextSlide}
                    disabled={currentSlideIndex === totalSlides - 1}
                    className="h-9 w-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground ml-2">
                    {currentSlideIndex + 1} / {totalSlides}
                  </span>
                </div>

                {/* Follow-up Questions */}
                {activeResponse.followUpQuestions && activeResponse.followUpQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    {activeResponse.followUpQuestions.map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleFollowUpClick(q)}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
                <CardContent className="text-center py-12">
                  <div className="text-7xl mb-6">👨‍🏫</div>
                  <h3 className="text-2xl font-semibold mb-3">
                    {subjectName ? `${subjectName} AI Professor` : narrationLanguage === 'hi-IN' ? 'AI शिक्षक' : 'AI Teaching Assistant'}
                  </h3>
                  <p className="text-muted-foreground max-w-md text-lg">
                    {narrationLanguage === 'hi-IN' 
                      ? 'कोई भी प्रश्न पूछें और मैं आपको एक प्रेजेंटेशन के साथ समझाऊंगा।'
                      : 'Ask any question and I will explain it with an interactive presentation.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Question Input - Bottom of presentation */}
          <Card className="shrink-0">
            <CardContent className="pt-3 pb-3">
              <div className="flex gap-2">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={narrationLanguage === 'hi-IN' ? 'अपना प्रश्न यहाँ लिखें...' : 'Type your question here...'}
                  className="min-h-[50px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isLoading}
                />
                <div className="flex flex-col gap-1">
                  {isSupported && (
                    <Button
                      variant={isListening ? "destructive" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleVoiceToggle}
                      disabled={isLoading || isSpeaking}
                    >
                      {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    </Button>
                  )}
                  <Button
                    onClick={handleSend}
                    disabled={!inputText.trim() || isLoading}
                    size="icon"
                    className="h-8 w-8"
                  >
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              {/* Controls Row */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  {/* Narration Language */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNarrationLanguageToggle}
                    className="text-xs h-7 px-2"
                    title="Narration Language"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    {narrationLanguage === 'en-IN' ? '🇬🇧 EN' : '🇮🇳 हिं'}
                  </Button>
                  
                  {/* Subtitle Language */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSubtitleLanguageToggle}
                    className="text-xs h-7 px-2"
                    title="Subtitle Language"
                  >
                    <Languages className="h-3 w-3 mr-1" />
                    Sub: {subtitleLanguage === 'en-IN' ? 'EN' : 'हिं'}
                  </Button>
                  
                  {/* Toggle Subtitles */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    className="text-xs h-7 px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {showSubtitles ? 'Hide' : 'Show'}
                  </Button>
                </div>
                
                {topicTitle && (
                  <Badge variant="secondary" className="text-xs">
                    {topicTitle}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Teacher Avatar (25%) */}
        <div className="flex-[25] min-w-[200px]">
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
