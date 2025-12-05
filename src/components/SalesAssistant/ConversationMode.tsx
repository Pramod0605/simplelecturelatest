import { useEffect, useRef, useState } from "react";
import { useGenerateCounselorAvatars } from "@/hooks/useGenerateCounselorAvatars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Volume2, VolumeX, Loader2, Mic } from "lucide-react";
import { VoiceStatusIndicator } from "./VoiceStatusIndicator";
import { ConversationStageIndicator } from "./ConversationStageIndicator";
import { ConversationState, ConversationStage } from "@/hooks/useSalesAssistant";
import { useToast } from "@/hooks/use-toast";
import { useVoiceActivityDetection } from "@/hooks/useVoiceActivityDetection";
import { CounselorPersona, PERSONA_CONFIGS } from "@/hooks/useWebSpeech";

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
  speak: (text: string, language?: string, gender?: "female" | "male", onComplete?: () => void, persona?: CounselorPersona) => void;
  startListening: (language?: string) => void;
  stopSpeaking: () => void;
  onLanguageChange?: (language: string, gender: "female" | "male") => void;
  onPersonaChange?: (persona: CounselorPersona) => void;
  voicesLoaded?: boolean;
  currentPersona?: CounselorPersona;
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
  onPersonaChange,
  voicesLoaded = false,
  currentPersona = "priya",
}: ConversationModeProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [counselorGender] = useState<"female" | "male">("female"); // Always female for our personas
  const [selectedPersona, setSelectedPersona] = useState<CounselorPersona>(currentPersona);
  const counselorName = PERSONA_CONFIGS[selectedPersona].name;
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-IN");
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [isSwitchingCounselor, setIsSwitchingCounselor] = useState(false);
  const [vadLevel, setVadLevel] = useState(0);
  const [vadEnabled, setVadEnabled] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const initialWelcomeDoneRef = useRef(false);
  const { avatars, isGenerating } = useGenerateCounselorAvatars();
  const { toast } = useToast();

  // CRITICAL: VAD is COMPLETELY DISABLED during initial welcome speech
  // Only enable VAD for subsequent AI responses after welcome is done
  useEffect(() => {
    if (!initialWelcomeDoneRef.current) {
      // Welcome speech not done yet - keep VAD completely disabled
      setVadEnabled(false);
      return;
    }
    
    // After welcome is done, enable VAD only when AI is speaking
    if (isSpeaking) {
      setVadEnabled(true);
    } else {
      setVadEnabled(false);
    }
  }, [isSpeaking]);

  // Mark initial welcome as done ONLY when first speech fully completes
  // This is set in the onComplete callback of the welcome speech

  // VAD for ConversationMode - improved voice-only detection with spectral analysis
  const { isDetecting } = useVoiceActivityDetection({
    enabled: vadEnabled,
    onVoiceDetected: () => {
      console.log("VAD: Human voice detected, interrupting AI speech");
      window.speechSynthesis.cancel();
      stopSpeaking();
      setTimeout(() => {
        startListening(selectedLanguage);
      }, 400);
    },
    onAudioLevel: setVadLevel,
    threshold: 55, // Lower threshold for easier interruption
    detectionDuration: 300, // Faster detection for responsive interrupts
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-start conversation - speak the FIRST assistant message (proper Dr. Nagpal welcome)
  // CRITICAL: Wait for voicesLoaded before speaking to avoid "Hi There" bug
  // CRITICAL: VAD is completely disabled until this welcome speech finishes
  useEffect(() => {
    if (!hasAutoStarted && messages.length > 0 && voicesLoaded) {
      const firstAssistantMessage = messages.find(m => m.role === "assistant");
      if (firstAssistantMessage) {
        setHasAutoStarted(true);
        console.log("✅ Voices ready! Speaking welcome message (VAD DISABLED):", firstAssistantMessage.content.substring(0, 50) + "...");
        
        // CRITICAL: Cancel any existing speech first to prevent interruption
        window.speechSynthesis.cancel();
        
        // Longer delay to ensure everything is fully ready
        setTimeout(() => {
          // Double-check nothing is speaking before starting
          if (!window.speechSynthesis.speaking) {
            speak(firstAssistantMessage.content, selectedLanguage, counselorGender, () => {
              // CRITICAL: Mark welcome as done ONLY after speech fully completes
              console.log("✅ Welcome speech completed! Enabling VAD for future responses");
              initialWelcomeDoneRef.current = true;
              
              setTimeout(() => {
                console.log("Starting listening after welcome message");
                startListening(selectedLanguage);
              }, 500);
            });
          }
        }, 500); // Increased from 200ms to 500ms for reliability
      }
    }
  }, [hasAutoStarted, messages, speak, startListening, selectedLanguage, counselorGender, voicesLoaded, selectedPersona]);

  // Handle persona change
  const handlePersonaSelect = (persona: CounselorPersona) => {
    if (persona === selectedPersona) return;
    
    setIsSwitchingCounselor(true);
    setSelectedPersona(persona);
    
    if (onPersonaChange) {
      onPersonaChange(persona);
    }
    
    toast({
      title: `Switched to ${PERSONA_CONFIGS[persona].name}`,
      description: PERSONA_CONFIGS[persona].description,
      duration: 2000,
    });
    
    setTimeout(() => {
      setIsSwitchingCounselor(false);
    }, 500);
  };

  // Handle language change
  const handleLanguageSelect = (language: string) => {
    if (language === selectedLanguage) return;
    
    setSelectedLanguage(language);
    
    if (onLanguageChange) {
      onLanguageChange(language, "female");
    }
    
    toast({
      title: `Language: ${language === "hi-IN" ? "हिंदी" : "English"}`,
      description: `Voice language updated`,
      duration: 2000,
    });
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
        
        speak(reminder, selectedLanguage, counselorGender, undefined, selectedPersona);
        lastInteractionRef.current = Date.now();
      }
    }, 60000);

    return () => clearInterval(checkInactivity);
  }, [conversationState, messages.length, speak, selectedLanguage, counselorGender, selectedPersona]);

  const handleInterruptClick = () => {
    window.speechSynthesis.cancel();
    onInterrupt();
  };

  return (
    <Card className="fixed inset-4 z-50 flex flex-col bg-background shadow-2xl" onClick={() => {
      // Ensure user interaction is tracked for audio permissions
      console.log("📱 ConversationMode clicked - ensuring audio permissions");
    }}>
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
        
        {/* Persona Selector - Choose Female Counselor */}
        <div className="flex flex-col gap-2 bg-primary-foreground/10 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-foreground/80">Choose Counselor:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedLanguage === "en-IN" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleLanguageSelect("en-IN")}
                className="text-xs px-2 py-1 h-6"
              >
                🇬🇧 EN
              </Button>
              <Button
                variant={selectedLanguage === "hi-IN" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleLanguageSelect("hi-IN")}
                className="text-xs px-2 py-1 h-6"
              >
                🇮🇳 हिंदी
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            {(Object.keys(PERSONA_CONFIGS) as CounselorPersona[]).map((persona) => (
              <Button
                key={persona}
                variant={selectedPersona === persona ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handlePersonaSelect(persona)}
                disabled={isSwitchingCounselor}
                className={`text-sm font-semibold px-3 ${
                  selectedPersona === persona 
                    ? "bg-primary-foreground text-primary shadow-md" 
                    : "text-primary-foreground hover:bg-primary-foreground/20 border border-primary-foreground/30"
                }`}
              >
                {isSwitchingCounselor && selectedPersona !== persona ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <span className="mr-1">👩</span>
                )}
                {PERSONA_CONFIGS[persona].name}
              </Button>
            ))}
          </div>
          <p className="text-xs text-primary-foreground/60 text-center">
            {PERSONA_CONFIGS[selectedPersona].description}
          </p>
        </div>
      </div>

      {/* Conversation Stage Indicator */}
      <ConversationStageIndicator currentStage={conversationStage} />

      {/* Main Content Area - Split view */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Voice Status */}
        <div className="w-1/2 flex items-center justify-center border-r bg-muted/30 relative">
          <VoiceStatusIndicator 
            state={conversationState} 
            gender={counselorGender}
            avatarUrl={avatars.female}
            isGenerating={isGenerating || isSwitchingCounselor}
            onTap={handleInterruptClick}
            isVADActive={isDetecting}
            vadLevel={vadLevel}
            persona={selectedPersona}
          />
          
          {/* Visual Interrupt Button - appears when AI is speaking */}
          {isSpeaking && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
              <Button
                onClick={handleInterruptClick}
                className="animate-pulse bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-6 py-3 shadow-lg flex items-center gap-2"
              >
                <Mic className="h-5 w-5" />
                Tap to Speak
              </Button>
            </div>
          )}
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
                      {message.role === "user" ? "You" : counselorName}
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
