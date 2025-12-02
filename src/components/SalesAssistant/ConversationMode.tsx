import { useEffect, useRef, useState } from "react";
import { useGenerateCounselorAvatars } from "@/hooks/useGenerateCounselorAvatars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Volume2, VolumeX } from "lucide-react";
import { VoiceStatusIndicator } from "./VoiceStatusIndicator";
import { ConversationStageIndicator } from "./ConversationStageIndicator";
import { ConversationState, ConversationStage } from "@/hooks/useSalesAssistant";

// Language display map
const languageNames: Record<string, { name: string; flag: string }> = {
  'en-IN': { name: 'English', flag: '🇮🇳' },
  'hi-IN': { name: 'हिंदी', flag: '🇮🇳' },
  'kn-IN': { name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  'ta-IN': { name: 'தமிழ்', flag: '🇮🇳' },
  'te-IN': { name: 'తెలుగు', flag: '🇮🇳' },
  'ml-IN': { name: 'മലയാളം', flag: '🇮🇳' },
  'mr-IN': { name: 'मराठी', flag: '🇮🇳' },
  'bn-IN': { name: 'বাংলা', flag: '🇮🇳' },
  'gu-IN': { name: 'ગુજરાతી', flag: '🇮🇳' },
  'pa-IN': { name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  'or-IN': { name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  'as-IN': { name: 'অসমীয়া', flag: '🇮🇳' },
  'ur-IN': { name: 'اردو', flag: '🇮🇳' },
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
}: ConversationModeProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [counselorGender, setCounselorGender] = useState<"female" | "male">("female");
  const { avatars, isGenerating } = useGenerateCounselorAvatars();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
          {/* Gender Toggle */}
          <div className="flex gap-1 mr-2">
            <Button
              variant={counselorGender === "female" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCounselorGender("female")}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              👩 Priya
            </Button>
            <Button
              variant={counselorGender === "male" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCounselorGender("male")}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              👨 Rahul
            </Button>
          </div>
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
