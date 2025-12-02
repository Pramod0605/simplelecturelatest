import { useEffect, useRef, useState } from "react";
import { useGenerateCounselorAvatars } from "@/hooks/useGenerateCounselorAvatars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Volume2, VolumeX, Loader2 } from "lucide-react";
import { VoiceStatusIndicator } from "./VoiceStatusIndicator";
import { ConversationStageIndicator } from "./ConversationStageIndicator";
import { ConversationState, ConversationStage } from "@/hooks/useSalesAssistant";
import { useToast } from "@/hooks/use-toast";

// Language display map - Limited to Hindi and English only (best voice quality)
const languageNames: Record<string, { name: string; flag: string }> = {
  'en-IN': { name: 'English', flag: '🇮🇳' },
  'hi-IN': { name: 'हिंदी', flag: '🇮🇳' },
};

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
  onToggleAutoSpeak: () => void;
  onInterrupt: () => void;
  onClose: () => void;
  detectedLanguage: string;
  speak: (text: string, language?: string, gender?: "female" | "male", onComplete?: () => void) => void;
  startListening: (language?: string) => void;
  onLanguageChange?: (language: string, gender: "female" | "male") => void;
}

export const ConversationMode = ({
  messages,
  conversationState,
  conversationStage,
  autoSpeak,
  transcript,
  isListening,
  onToggleAutoSpeak,
  onInterrupt,
  onClose,
  detectedLanguage,
  speak,
  startListening,
  onLanguageChange,
}: ConversationModeProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [counselorGender, setCounselorGender] = useState<"female" | "male">("male");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(detectedLanguage || "en-IN");
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [isSwitchingCounselor, setIsSwitchingCounselor] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const { avatars, isGenerating } = useGenerateCounselorAvatars();
  const { toast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-start conversation with greeting (don't wait for avatars)
  useEffect(() => {
    if (!hasAutoStarted && messages.length === 0) {
      setHasAutoStarted(true);
      // Always start with English greeting since default is en-IN
      const greeting = "Hello! I'm your education counselor at SimpleLecture. How can I help you today?";
      
      console.log("Auto-starting conversation with English greeting, language:", detectedLanguage);
      
      speak(greeting, "en-IN", "male", () => {
        // After greeting, start listening in English
        setTimeout(() => {
          console.log("Starting listening in English after greeting");
          startListening("en-IN");
        }, 500);
      });
    }
  }, [hasAutoStarted, messages.length, speak, startListening]);

  // Handle manual counselor/language switch
  const handleCounselorSwitch = (gender: "female" | "male") => {
    if (gender === counselorGender) return; // Already selected
    
    setIsSwitchingCounselor(true);
    const newLanguage = gender === "female" ? "hi-IN" : "en-IN";
    
    // Update states
    setCounselorGender(gender);
    setSelectedLanguage(newLanguage);
    
    // Notify parent to update voice settings
    if (onLanguageChange) {
      onLanguageChange(newLanguage, gender);
    }
    
    // Show toast
    toast({
      title: gender === "female" ? "Switched to Priya (Hindi)" : "Switched to Rahul (English)",
      description: `Voice and language updated to ${newLanguage === "hi-IN" ? "Hindi" : "English"}`,
      duration: 2000,
    });
    
    // Simulate loading for avatar
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
        const reminder = detectedLanguage === 'hi-IN'
          ? "मैं अभी भी आपकी मदद के लिए यहाँ हूँ। जब भी आप तैयार हों, मुझसे कुछ भी पूछ सकते हैं।"
          : "I'm still here to assist you. Feel free to ask me anything whenever you're ready.";
        
        speak(reminder, detectedLanguage, counselorGender);
        lastInteractionRef.current = Date.now(); // Reset timer
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInactivity);
  }, [conversationState, messages.length, speak, detectedLanguage, counselorGender]);

  return (
    <Card className="fixed inset-4 z-50 flex flex-col bg-background shadow-2xl">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-lg">Voice Conversation</h3>
            <p className="text-xs opacity-90">SimpleLecture AI Assistant</p>
          </div>
          {detectedLanguage && (
            <Badge variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
              {languageNames[detectedLanguage]?.flag} {languageNames[detectedLanguage]?.name || detectedLanguage}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {/* Clear Language Toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleCounselorSwitch(counselorGender === "male" ? "female" : "male")}
            disabled={isSwitchingCounselor}
            className="text-primary-foreground bg-primary-foreground/20 hover:bg-primary-foreground/30 font-semibold border-2 border-primary-foreground/40"
          >
            {isSwitchingCounselor ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {counselorGender === "male" ? "🇬🇧 English" : "🇮🇳 हिंदी"}
            <span className="mx-2">⟷</span>
            {counselorGender === "male" ? "🇮🇳 हिंदी" : "🇬🇧 English"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAutoSpeak}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            {autoSpeak ? (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Voice ON
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-2" />
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
            isGenerating={isGenerating}
            onTap={onInterrupt} 
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
              ? "🎯 Tap the indicator to interrupt and speak"
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
