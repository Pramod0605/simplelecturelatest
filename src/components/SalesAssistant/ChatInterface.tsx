import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSpeech } from "@/hooks/useWebSpeech";
import { ConversationState } from "@/hooks/useSalesAssistant";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  conversationState: ConversationState;
  onSendMessage: (content: string) => void;
  onStateChange: (state: ConversationState) => void;
}

export const ChatInterface = ({ 
  messages, 
  isLoading, 
  conversationState,
  onSendMessage,
  onStateChange 
}: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showVoiceHelp, setShowVoiceHelp] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>("");
  const sentTranscriptRef = useRef<string>("");
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript,
    isSupported,
  } = useWebSpeech();

  console.log("ChatInterface - Voice support:", isSupported, "Listening:", isListening, "Speaking:", isSpeaking);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Update conversation state based on listening/speaking
  useEffect(() => {
    if (isListening) {
      onStateChange("listening");
    } else if (isSpeaking) {
      onStateChange("speaking");
    } else if (isLoading) {
      onStateChange("processing");
    } else {
      onStateChange("idle");
    }
  }, [isListening, isSpeaking, isLoading, onStateChange]);

  // Auto-speak new assistant messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      autoSpeak &&
      lastMessage?.role === "assistant" &&
      lastMessage.content &&
      lastMessage.content !== lastMessageRef.current
    ) {
      lastMessageRef.current = lastMessage.content;
      speak(lastMessage.content);
    }
  }, [messages, autoSpeak, speak]);

  // Handle voice input with silence detection (prevent duplicates)
  useEffect(() => {
    if (!transcript || !isListening) {
      // Clear timer if not listening or no transcript
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      return;
    }

    console.log("Voice transcript received:", transcript);
    setInput(transcript);

    // Clear existing silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    // Set new timer - auto-send after 2 seconds of silence
    silenceTimerRef.current = setTimeout(() => {
      if (transcript.trim() && transcript !== sentTranscriptRef.current) {
        console.log("Silence detected, auto-sending:", transcript);
        sentTranscriptRef.current = transcript;
        stopListening();
        onSendMessage(transcript.trim());
        setInput("");
        clearTranscript();
      }
    }, 2000);

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [transcript, isListening, onSendMessage, clearTranscript, stopListening]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      console.log("Sending message:", input.trim());
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      console.log("Stopping voice input");
      stopListening();
    } else {
      console.log("Starting voice input");
      sentTranscriptRef.current = ""; // Reset for new recording
      startListening('en-IN');
    }
  };

  const handleInterrupt = () => {
    console.log("Interrupt triggered");
    if (isSpeaking) {
      stopSpeaking();
    }
    if (!isListening && !isLoading) {
      sentTranscriptRef.current = "";
      startListening('en-IN');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Voice Help Banner */}
      {showVoiceHelp && (
        <div className="bg-muted border-b p-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isSupported ? (
                <span className="text-foreground">
                  🎤 Voice enabled! Use Chrome/Edge for best results. Click mic to speak.
                </span>
              ) : (
                <span className="text-destructive">
                  ⚠️ Voice not supported. Use Chrome/Edge browser for voice features.
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceHelp(false)}
              className="h-4 text-xs"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Interrupt Overlay when AI is speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center z-10 cursor-pointer" onClick={handleInterrupt}>
          <div className="text-center space-y-4">
            <Volume2 className="h-16 w-16 text-primary mx-auto animate-pulse" />
            <div>
              <p className="text-lg font-semibold">AI is speaking...</p>
              <p className="text-sm text-muted-foreground mt-2">Tap anywhere to interrupt</p>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4 space-y-2">
        {isSupported && (
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {conversationState === "listening" 
                ? "🎤 Listening..." 
                : conversationState === "speaking"
                ? "🔊 Speaking..."
                : conversationState === "processing"
                ? "⏳ Processing..."
                : "Tap mic to speak"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className="h-6"
            >
              {autoSpeak ? (
                <>
                  <Volume2 className="h-3 w-3 mr-1" />
                  Auto-speak ON
                </>
              ) : (
                <>
                  <VolumeX className="h-3 w-3 mr-1" />
                  Auto-speak OFF
                </>
              )}
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          {isSupported && (
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={toggleVoiceInput}
              disabled={isLoading}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question or use voice..."
            className="min-h-[60px] max-h-[120px]"
            disabled={isLoading || isListening}
          />

          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
