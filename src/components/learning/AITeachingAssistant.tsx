import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX, Globe } from 'lucide-react';
import { useTeachingAssistant, TeachingResponse, PresentationSlide as SlideType } from '@/hooks/useTeachingAssistant';
import { useWebSpeech } from '@/hooks/useWebSpeech';
import { TeacherAvatarPanel } from './TeacherAvatarPanel';
import { PresentationSlide } from './PresentationSlide';
import { SubtitleOverlay } from './SubtitleOverlay';
import { cn } from '@/lib/utils';

interface AITeachingAssistantProps {
  topicId?: string;
  chapterId?: string;
  topicTitle?: string;
}

export function AITeachingAssistant({ topicId, chapterId, topicTitle }: AITeachingAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSentence, setCurrentSentence] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [qaHistory, setQaHistory] = useState<Array<{ question: string; response: TeachingResponse }>>([]);
  
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

  const narrationRef = useRef<string[]>([]);
  const sentenceIndexRef = useRef(0);

  // Update input with voice transcript
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Handle narration when response is received
  useEffect(() => {
    if (currentResponse?.narrationText && !isMuted) {
      // Split into sentences for highlighting
      const sentences = currentResponse.narrationText
        .split(/(?<=[.!?।])\s+/)
        .filter(s => s.trim());
      
      narrationRef.current = sentences;
      sentenceIndexRef.current = 0;
      
      // Start speaking with sentence tracking
      speakWithHighlighting(currentResponse.narrationText);
    }
  }, [currentResponse, isMuted]);

  const speakWithHighlighting = async (text: string) => {
    if (isMuted) return;
    
    const sentences = text.split(/(?<=[.!?।])\s+/).filter(s => s.trim());
    
    for (let i = 0; i < sentences.length; i++) {
      if (isMuted) break;
      
      setCurrentSentence(sentences[i]);
      
      // Determine which slide this sentence belongs to
      if (currentResponse?.presentationSlides) {
        const slideIndex = currentResponse.presentationSlides.findIndex(
          slide => slide.content.includes(sentences[i])
        );
        if (slideIndex !== -1) {
          setCurrentSlideIndex(slideIndex);
        }
      }
      
      // Speak the sentence
      await speak(sentences[i], language, language === 'hi-IN' ? 'female' : 'male');
      
      // Small pause between sentences
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setCurrentSentence('');
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const question = inputText.trim();
    setInputText('');
    clearTranscript();
    clearResponse();
    setCurrentSlideIndex(0);
    
    const response = await askQuestion(question, topicId, chapterId, language);
    
    if (response) {
      setQaHistory(prev => [...prev, { question, response }]);
    }
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
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopSpeaking();
    }
  };

  const handleFollowUpClick = (question: string) => {
    setInputText(question);
  };

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Left Panel - Content Display (60%) */}
      <div className="flex-[6] flex flex-col gap-4">
        {/* Question Input */}
        <Card>
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

        {/* Presentation Area */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">
                  {language === 'hi-IN' ? 'उत्तर तैयार कर रहा हूं...' : 'Preparing your answer...'}
                </p>
              </CardContent>
            </Card>
          ) : currentResponse ? (
            <div className="space-y-4">
              {/* Slides */}
              {currentResponse.presentationSlides.map((slide, idx) => (
                <PresentationSlide
                  key={idx}
                  slide={slide}
                  isActive={currentSlideIndex === idx}
                  highlightedSentence={currentSlideIndex === idx ? currentSentence : undefined}
                  slideNumber={idx + 1}
                  totalSlides={currentResponse.presentationSlides.length}
                />
              ))}

              {/* Follow-up Questions */}
              {currentResponse.followUpQuestions && currentResponse.followUpQuestions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {language === 'hi-IN' ? 'आगे के प्रश्न' : 'Follow-up Questions'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
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
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">👨‍🏫</div>
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'hi-IN' ? 'AI शिक्षक' : 'AI Teaching Assistant'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {language === 'hi-IN' 
                    ? 'कोई भी प्रश्न पूछें और मैं आपको एक शिक्षक की तरह समझाऊंगा। आप टाइप कर सकते हैं या बोल सकते हैं।'
                    : 'Ask any question and I will explain it to you like a teacher. You can type or speak your question.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Teacher Avatar (40%) */}
      <div className="flex-[4]">
        <TeacherAvatarPanel
          isSpeaking={isSpeaking}
          isProcessing={isLoading}
          language={language}
          onMuteToggle={handleMuteToggle}
          isMuted={isMuted}
        />
      </div>

      {/* Subtitle Overlay */}
      <SubtitleOverlay
        text={currentSentence}
        isVisible={showSubtitles && isSpeaking}
        language={language}
      />
    </div>
  );
}
