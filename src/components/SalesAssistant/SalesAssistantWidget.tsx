import { useState, useEffect } from "react";
import { MessageCircle, X, TestTube, Phone, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { ChatInterface } from "./ChatInterface";
import { ConversationMode } from "./ConversationMode";
import { VoiceTestPanel } from "./VoiceTestPanel";
import { SupportChatTab } from "./SupportChatTab";
import { useSalesAssistant } from "@/hooks/useSalesAssistant";
import { useWebSpeech } from "@/hooks/useWebSpeech";

export const SalesAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<string>("en-IN");
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [currentGender, setCurrentGender] = useState<"female" | "male">("male");
  
  const { 
    messages, 
    isLoading, 
    leadId, 
    conversationState,
    conversationStage,
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
    isSupported,
    voicesLoaded
  } = useWebSpeech();

  // Sync language and gender when detected language changes
  useEffect(() => {
    if (detectedLanguage) {
      setCurrentLanguage(detectedLanguage);
      setCurrentGender(detectedLanguage === "hi-IN" ? "female" : "male");
    }
  }, [detectedLanguage]);

  // Lock background scroll when widget is open (robust on mobile)
  useEffect(() => {
    const html = document.documentElement;

    if (!isOpen) {
      html.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      return;
    }

    const scrollY = window.scrollY;

    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      html.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const handleLanguageChange = (language: string, gender: "female" | "male") => {
    console.log("Language changed to:", language, "Gender:", gender);
    setCurrentLanguage(language);
    setCurrentGender(gender);
  };

  const handleLeadSubmit = async (name: string, email: string, mobile: string) => {
    const success = await createLead(name, email, mobile, currentGender);
    return success;
  };

  const handleQuickChat = async () => {
    // Create anonymous lead for quick chat with friendly greeting
    const shortId = Date.now().toString(36).slice(-4);
    const anonymousName = `Anonymous-${shortId}`;
    
    // This button click counts as user interaction for audio permissions
    console.log("🎤 Quick chat started - user interaction registered");
    
    const success = await createLead(anonymousName, "", "", currentGender);
    if (success) {
      setIsVoiceMode(true);
    }
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
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dialog */}
          <Card className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(24rem,calc(100vw-2rem))] h-[min(600px,calc(100dvh-4rem))] shadow-2xl z-50 flex flex-col overflow-hidden">
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
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {!leadId ? (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="p-4 space-y-3">
                  <Button
                    onClick={handleQuickChat}
                    className="w-full"
                    size="lg"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Start Voice Chat Now
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">or</div>
                </div>
                <Tabs defaultValue="form" className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <TabsList className="w-full flex-shrink-0">
                    <TabsTrigger value="form" className="flex-1">Enter Details</TabsTrigger>
                    <TabsTrigger value="test" className="flex-1">
                      <TestTube className="h-3 w-3 mr-1" />
                      Test Voice
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="flex-1 relative">
                      <MessagesSquare className="h-3 w-3 mr-1" />
                      Service Chat
                      {unreadSupportCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                          {unreadSupportCount > 9 ? "9+" : unreadSupportCount}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="form" className="flex-1 min-h-0 overflow-auto mt-0">
                    <LeadCaptureForm onSubmit={handleLeadSubmit} />
                  </TabsContent>
                  <TabsContent value="test" className="flex-1 min-h-0 overflow-auto mt-0">
                    <VoiceTestPanel />
                  </TabsContent>
                  <TabsContent value="chat" className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0">
                    <SupportChatTab onUnreadCountChange={setUnreadSupportCount} />
                  </TabsContent>
                </Tabs>
              </div>
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
                    detectedLanguage={currentLanguage}
                    counselorGender={currentGender}
                    isVoiceMode={isVoiceMode}
                  />
                </div>
                {isSupported && (
                  <div className="border-t p-3 bg-muted/50">
            <Button
              onClick={() => {
                setConversationState("idle");
                setIsVoiceMode(true);
              }}
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
        </>
      )}

      {/* Voice Conversation Mode */}
      {isVoiceMode && leadId && (
        <ConversationMode
          messages={messages}
          conversationState={conversationState}
          conversationStage={conversationStage}
          autoSpeak={autoSpeak}
          transcript={transcript}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
          onInterrupt={handleInterrupt}
          onClose={handleCloseVoiceMode}
          detectedLanguage={currentLanguage}
          speak={speak}
          startListening={startListening}
          stopSpeaking={stopSpeaking}
          onLanguageChange={handleLanguageChange}
          voicesLoaded={voicesLoaded}
        />
      )}
    </>
  );
};
