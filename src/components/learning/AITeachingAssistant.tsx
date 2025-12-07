import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, Loader2, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTeachingAssistant, TeachingResponse } from '@/hooks/useTeachingAssistant';
import { useWebSpeech } from '@/hooks/useWebSpeech';
import { TeacherAvatarPanel } from './TeacherAvatarPanel';
import { PresentationSlide } from './PresentationSlide';
import { SubtitleOverlay } from './SubtitleOverlay';
import { cn } from '@/lib/utils';

interface AITeachingAssistantProps {
  topicId?: string;
  chapterId?: string;
  topicTitle?: string;
  subjectName?: string;
}

export function AITeachingAssistant({ topicId, chapterId, topicTitle, subjectName }: AITeachingAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSentence, setCurrentSentence] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  
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

  const narrationQueueRef = useRef<Array<{ text: string; slideIndex: number }>>([]);
  const isNarratingRef = useRef(false);
  const isMutedRef = useRef(isMuted);

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

  // Handle narration when response is received - build queue from per-slide narration
  useEffect(() => {
    if (currentResponse?.presentationSlides && !isMuted && !isNarratingRef.current) {
      const queue: Array<{ text: string; slideIndex: number }> = [];
      
      currentResponse.presentationSlides.forEach((slide, index) => {
        // Use slide-specific narration if available, otherwise use content
        const narrationText = slide.narration || slide.content;
        if (narrationText) {
          queue.push({ text: narrationText, slideIndex: index });
        }
      });
      
      if (queue.length > 0) {
        narrationQueueRef.current = queue;
        setCurrentSlideIndex(0);
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
      
      // Update slide and sentence
      setCurrentSlideIndex(item.slideIndex);
      setCurrentSentence(item.text);
      
      // Wait for speech to complete
      await new Promise<void>((resolve) => {
        speak(item.text, language, language === 'hi-IN' ? 'female' : 'male', () => {
          resolve();
        });
      });
      
      // Remove from queue after speaking
      narrationQueueRef.current = narrationQueueRef.current.slice(1);
      
      // Small pause between slides
      if (narrationQueueRef.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Narration complete
    setCurrentSentence('');
    setIsNarrating(false);
    isNarratingRef.current = false;
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    // Stop any ongoing narration
    stopSpeaking();
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
    
    const question = inputText.trim();
    setInputText('');
    clearTranscript();
    clearResponse();
    setCurrentSlideIndex(0);
    setCurrentSentence('');
    
    await askQuestion(question, topicId, chapterId, language, subjectName);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      startListening(language);
    }
  };

  const handleLanguageToggle = () => {
    const newLang = language === 'en-IN' ? 'hi-IN' : 'en-IN';
    setLanguage(newLang);
    stopSpeaking();
    narrationQueueRef.current = [];
    isNarratingRef.current = false;
    setIsNarrating(false);
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      stopSpeaking();
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
    if (currentResponse && currentSlideIndex < currentResponse.presentationSlides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handleFollowUpClick = (question: string) => {
    setInputText(question);
  };

  const totalSlides = currentResponse?.presentationSlides?.length || 0;
  const currentSlide = currentResponse?.presentationSlides?.[currentSlideIndex];

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Left Panel - Presentation Display (75%) */}
      <div className="flex-[75] flex flex-col gap-4">
        {/* Presentation Area */}
        <div className="flex-1 relative">
          {isLoading ? (
            <Card className="h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
              <CardContent className="text-center py-12">
                <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
                <p className="text-lg text-muted-foreground">
                  {language === 'hi-IN' ? 'प्रेजेंटेशन तैयार कर रहा हूं...' : 'Preparing your presentation...'}
                </p>
              </CardContent>
            </Card>
          ) : currentResponse && currentSlide ? (
            <div className="h-full flex flex-col">
              {/* Single Slide Display - PPT Style */}
              <div className="flex-1 relative overflow-hidden rounded-xl">
                <PresentationSlide
                  slide={currentSlide}
                  isActive={true}
                  highlightedSentence={currentSentence}
                  slideNumber={currentSlideIndex + 1}
                  totalSlides={totalSlides}
                  isStorySlide={currentSlide.isStory}
                />
              </div>

              {/* Slide Navigation */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="h-10 w-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                {/* Slide Indicators */}
                <div className="flex items-center gap-2">
                  {currentResponse.presentationSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all",
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
                  className="h-10 w-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                
                <span className="text-sm text-muted-foreground ml-2">
                  {currentSlideIndex + 1} / {totalSlides}
                </span>
              </div>

              {/* Follow-up Questions */}
              {currentResponse.followUpQuestions && currentResponse.followUpQuestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {currentResponse.followUpQuestions.map((q, idx) => (
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
                  {subjectName ? `${subjectName} AI Professor` : language === 'hi-IN' ? 'AI शिक्षक' : 'AI Teaching Assistant'}
                </h3>
                <p className="text-muted-foreground max-w-md text-lg">
                  {language === 'hi-IN' 
                    ? 'कोई भी प्रश्न पूछें और मैं आपको एक प्रेजेंटेशन के साथ समझाऊंगा।'
                    : 'Ask any question and I will explain it with an interactive presentation.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Subtitle Overlay */}
        {showSubtitles && currentSentence && (
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 text-center">
            <p className="text-sm text-foreground">{currentSentence}</p>
          </div>
        )}

        {/* Question Input - Bottom of presentation */}
        <Card className="shrink-0">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={language === 'hi-IN' ? 'अपना प्रश्न यहाँ लिखें...' : 'Type your question here...'}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                {isSupported && (
                  <Button
                    variant={isListening ? "destructive" : "outline"}
                    size="icon"
                    onClick={handleVoiceToggle}
                    disabled={isLoading || isSpeaking}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Controls Row */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLanguageToggle}
                  className="text-xs"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {language === 'en-IN' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className="text-xs"
                >
                  {showSubtitles ? 'Hide Subtitles' : 'Show Subtitles'}
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
      <div className="flex-[25]">
        <TeacherAvatarPanel
          isSpeaking={isSpeaking || isNarrating}
          isProcessing={isLoading}
          language={language}
          onMuteToggle={handleMuteToggle}
          isMuted={isMuted}
          subjectName={subjectName}
        />
      </div>
    </div>
  );
}
