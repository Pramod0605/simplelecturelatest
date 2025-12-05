import { useEffect, useRef, useState } from "react";
import { useGenerateCounselorAvatars } from "@/hooks/useGenerateCounselorAvatars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Volume2, VolumeX, Loader2 } from "lucide-react";
import { VoiceStatusIndicator } from "./VoiceStatusIndicator";
import { ConversationStageIndicator } from "./ConversationStageIndicator";
import { ConversationState, ConversationStage } from "@/hooks/useSalesAssistant";
import { useToast } from "@/hooks/use-toast";
import { useVoiceActivityDetection } from "@/hooks/useVoiceActivityDetection";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationModeProps {
  messages: Message[];
  conversationState: ConversationState;
  conversationStage: ConversationStage;
  autoSpeak: boolean;
  transcript: string;
  isListening: boolean;
  isSpeaking: boolean;
  onToggleAutoSpeak: () => void;
  onInterrupt: () => void;
  onClose: () => void;
  detectedLanguage: string;
  speak: (text: string, language?: string, gender?: "female" | "male", onComplete?: () => void) => void;
  startListening: (language?: string) => void;
  stopSpeaking: () => void;
  onLanguageChange?: (language: string, gender: "female" | "male") => void;
}

export const ConversationMode = ({
  messages,
  conversationState,
  conversationStage,
  autoSpeak,
  transcript,
  isListening,
  isSpeaking,
  onToggleAutoSpeak,
  onInterrupt,
  onClose,
  detectedLanguage,
  speak,
  startListening,
  stopSpeaking,
  onLanguageChange,
}: ConversationModeProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [counselorGender, setCounselorGender] = useState<"female" | "male">("male");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-IN");
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [isSwitchingCounselor, setIsSwitchingCounselor] = useState(false);
  const [vadLevel, setVadLevel] = useState(0);
  const lastInteractionRef = useRef<number>(Date.now());
  const { avatars, isGenerating } = useGenerateCounselorAvatars();
  const { toast } = useToast();

  // VAD for ConversationMode - with better speech frequency filtering
  const { isDetecting } = useVoiceActivityDetection({
    enabled: isSpeaking,
    onVoiceDetected: () => {
      console.log("VAD in ConversationMode: Voice detected, interrupting");
      window.speechSynthesis.cancel();
      stopSpeaking();
      setTimeout(() => {
        startListening(selectedLanguage);
      }, 400);
    },
    onAudioLevel: setVadLevel,
    threshold: 55, // Increased to reduce false positives
    detectionDuration: 400, // Increased for sustained detection
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-start conversation - speak the FIRST assistant message (proper Dr. Nagpal welcome)
  useEffect(() => {
    if (!hasAutoStarted && messages.length > 0) {
      const firstAssistantMessage = messages.find(m => m.role === "assistant");
      if (firstAssistantMessage) {
        setHasAutoStarted(true);
        console.log("Speaking welcome message from createLead:", firstAssistantMessage.content.substring(0, 50) + "...");
        
        // Speak immediately without delay
        speak(firstAssistantMessage.content, selectedLanguage, counselorGender, () => {
          setTimeout(() => {
            console.log("Starting listening after welcome message");
            startListening(selectedLanguage);
          }, 500);
        });
      }
    }
  }, [hasAutoStarted, messages, speak, startListening, selectedLanguage, counselorGender]);

  // Handle language button click
  const handleLanguageSelect = (language: string, gender: "female" | "male") => {
    if (language === selectedLanguage) return;
    
    setIsSwitchingCounselor(true);
    
    setCounselorGender(gender);
    setSelectedLanguage(language);
    
    if (onLanguageChange) {
      onLanguageChange(language, gender);
    }
    
    toast({
      title: gender === "female" ? "Switched to Priya (Hindi)" : "Switched to Rahul (English)",
      description: `Voice and language updated to ${language === "hi-IN" ? "Hindi" : "English"}`,
      duration: 2000,
    });
    
    setTimeout(() => {
      setIsSwitchingCounselor(false);
    }, 500);
  };

  // Track user interactions
  useEffect(() => {
    if (messages.length > 0 || isListening || conversationState === 'speaking') {
      lastInteractionRef.current = Date.now();
    }
  }, [messages, isListening, conversationState]);

  // 5-minute inactivity reminder
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeSinceLastInteraction >= fiveMinutes && conversationState === "idle" && messages.length > 0) {
        const reminder = selectedLanguage === 'hi-IN'
          ? "मैं अभी भी आपकी मदद के लिए यहाँ हूँ। जब भी आप तैयार हों, मुझसे कुछ भी पूछ सकते हैं।"
          : "I'm still here to assist you. Feel free to ask me anything whenever you're ready.";
        
        speak(reminder, selectedLanguage, counselorGender);
        lastInteractionRef.current = Date.now();
      }
    }, 60000);

    return () => clearInterval(checkInactivity);
  }, [conversationState, messages.length, speak, selectedLanguage, counselorGender]);

  const handleInterruptClick = () => {
    window.speechSynthesis.cancel();
    onInterrupt();
  };

  return (
    <Card className="fixed inset-4 z-50 flex flex-col bg-background shadow-2xl">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="font-semibold text-base">Voice Conversation</h3>
              <p className="text-xs opacity-90">SimpleLecture AI Assistant</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAutoSpeak}
              className="text-primary-foreground hover:bg-primary-foreground/20 text-xs"
            >
              {autoSpeak ? (
                <>
                  <Volume2 className="h-4 w-4 mr-1" />
                  Voice ON
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 mr-1" />
                  Voice OFF
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Language Selector - Prominent Row */}
        <div className="flex items-center justify-center gap-2 bg-primary-foreground/10 rounded-lg p-2">
          <span className="text-xs text-primary-foreground/80 mr-2">Choose Counselor:</span>
          <Button
            variant={selectedLanguage === "en-IN" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleLanguageSelect("en-IN", "male")}
            disabled={isSwitchingCounselor}
            className={`text-sm font-semibold px-4 ${
              selectedLanguage === "en-IN" 
                ? "bg-primary-foreground text-primary shadow-md" 
                : "text-primary-foreground hover:bg-primary-foreground/20 border border-primary-foreground/30"
            }`}
          >
            {isSwitchingCounselor && selectedLanguage !== "en-IN" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            🇬🇧 English (Rahul)
          </Button>
          <Button
            variant={selectedLanguage === "hi-IN" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleLanguageSelect("hi-IN", "female")}
            disabled={isSwitchingCounselor}
            className={`text-sm font-semibold px-4 ${
              selectedLanguage === "hi-IN" 
                ? "bg-primary-foreground text-primary shadow-md" 
                : "text-primary-foreground hover:bg-primary-foreground/20 border border-primary-foreground/30"
            }`}
          >
            {isSwitchingCounselor && selectedLanguage !== "hi-IN" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            🇮🇳 हिंदी (Priya)
          </Button>
        </div>
      </div>

      {/* Conversation Stage Indicator */}
      <ConversationStageIndicator currentStage={conversationStage} />

      {/* Main Content Area - Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Voice Status */}
        <div className="w-1/2 flex items-center justify-center border-r bg-muted/30">
          <VoiceStatusIndicator 
            state={conversationState} 
            gender={counselorGender}
            avatarUrl={counselorGender === "female" ? avatars.female : avatars.male}
            isGenerating={isGenerating || isSwitchingCounselor}
            onTap={handleInterruptClick}
            isVADActive={isDetecting}
            vadLevel={vadLevel}
          />
        </div>

        {/* Right: Transcript */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b bg-muted/50">
            <h4 className="font-semibold text-sm text-muted-foreground">Conversation Transcript</h4>
          </div>
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-70">
                      {message.role === "user" ? "You" : "AI Assistant"}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {/* Real-time transcript preview */}
              {isListening && transcript && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg p-3 bg-primary/50 text-primary-foreground border-2 border-primary">
                    <p className="text-xs font-semibold mb-1 opacity-70">You (speaking...)</p>
                    <p className="text-sm whitespace-pre-wrap italic">{transcript}</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="border-t p-3 bg-muted/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {conversationState === "speaking"
              ? "🎯 Tap the avatar or just speak to interrupt"
              : conversationState === "listening"
              ? "🎤 Speak now... I'm listening"
              : conversationState === "processing"
              ? "⏳ Processing your message..."
              : "💡 Tap to start speaking"}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            End Conversation
          </Button>
        </div>
      </div>
    </Card>
  );
};
