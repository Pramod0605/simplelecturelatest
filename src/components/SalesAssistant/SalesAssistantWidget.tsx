import { useState } from "react";
import { MessageCircle, X, TestTube, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { ChatInterface } from "./ChatInterface";
import { ConversationMode } from "./ConversationMode";
import { VoiceTestPanel } from "./VoiceTestPanel";
import { useSalesAssistant } from "@/hooks/useSalesAssistant";
import { useWebSpeech } from "@/hooks/useWebSpeech";

export const SalesAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  const { 
    messages, 
    isLoading, 
    leadId, 
    conversationState,
    detectedLanguage,
    setConversationState,
    sendMessage, 
    createLead 
  } = useSalesAssistant();
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

  const handleLeadSubmit = async (name: string, email: string, mobile: string) => {
    const success = await createLead(name, email, mobile);
    return success;
  };

  const handleInterrupt = () => {
    console.log("Interrupt triggered, current state:", conversationState);
    
    // If AI is speaking, stop it
    if (conversationState === "speaking") {
      stopSpeaking();
    }
    
    // Start listening if not already processing or listening
    if (conversationState !== "listening" && conversationState !== "processing") {
      console.log("Starting listening after interrupt");
      setConversationState("listening");
      startListening(detectedLanguage);
    }
  };

  const handleCloseVoiceMode = () => {
    setIsVoiceMode(false);
    stopSpeaking();
    setConversationState("idle");
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">SimpleLecture AI Assistant</h3>
              <p className="text-xs opacity-90">Ask me anything about our courses!</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!leadId ? (
              <Tabs defaultValue="form" className="h-full">
                <TabsList className="w-full">
                  <TabsTrigger value="form" className="flex-1">Get Started</TabsTrigger>
                  <TabsTrigger value="test" className="flex-1">
                    <TestTube className="h-3 w-3 mr-1" />
                    Test Voice
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="form" className="h-full">
                  <LeadCaptureForm onSubmit={handleLeadSubmit} />
                </TabsContent>
                <TabsContent value="test" className="h-full overflow-auto">
                  <VoiceTestPanel />
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    messages={messages}
                    isLoading={isLoading}
                    conversationState={conversationState}
                    onSendMessage={sendMessage}
                    onStateChange={setConversationState}
                    isListening={isListening}
                    isSpeaking={isSpeaking}
                    transcript={transcript}
                    startListening={startListening}
                    stopListening={stopListening}
                    speak={speak}
                    stopSpeaking={stopSpeaking}
                    clearTranscript={clearTranscript}
                    isSupported={isSupported}
                    detectedLanguage={detectedLanguage}
                  />
                </div>
                {isSupported && (
                  <div className="border-t p-3 bg-muted/50">
                    <Button
                      onClick={() => setIsVoiceMode(true)}
                      className="w-full"
                      variant="default"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Start Voice Conversation
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* Voice Conversation Mode */}
      {isVoiceMode && leadId && (
        <ConversationMode
          messages={messages}
          conversationState={conversationState}
          autoSpeak={autoSpeak}
          transcript={transcript}
          isListening={isListening}
          onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
          onInterrupt={handleInterrupt}
          onClose={handleCloseVoiceMode}
          detectedLanguage={detectedLanguage}
        />
      )}
    </>
  );
};
