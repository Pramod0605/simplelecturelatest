import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Volume2, VolumeX } from "lucide-react";
import { VoiceStatusIndicator } from "./VoiceStatusIndicator";
import { ConversationState } from "@/hooks/useSalesAssistant";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationModeProps {
  messages: Message[];
  conversationState: ConversationState;
  autoSpeak: boolean;
  transcript: string;
  isListening: boolean;
  onToggleAutoSpeak: () => void;
  onInterrupt: () => void;
  onClose: () => void;
  selectedLanguage: string;
}

export const ConversationMode = ({
  messages,
  conversationState,
  autoSpeak,
  transcript,
  isListening,
  onToggleAutoSpeak,
  onInterrupt,
  onClose,
}: ConversationModeProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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
        <div>
          <h3 className="font-semibold text-lg">Voice Conversation</h3>
          <p className="text-xs opacity-90">SimpleLecture AI Assistant</p>
        </div>
        <div className="flex gap-2">
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

      {/* Main Content Area - Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Voice Status */}
        <div className="w-1/2 flex items-center justify-center border-r bg-muted/30">
          <VoiceStatusIndicator state={conversationState} onTap={onInterrupt} />
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
