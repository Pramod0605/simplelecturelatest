import { useState } from "react";
import { MessageCircle, X, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { ChatInterface } from "./ChatInterface";
import { VoiceTestPanel } from "./VoiceTestPanel";
import { useSalesAssistant } from "@/hooks/useSalesAssistant";

export const SalesAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, leadId, sendMessage, createLead } = useSalesAssistant();

  const handleLeadSubmit = async (name: string, email: string, mobile: string) => {
    const success = await createLead(name, email, mobile);
    return success;
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
          <div className="flex-1 overflow-hidden">
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
              <ChatInterface
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
              />
            )}
          </div>
        </Card>
      )}
    </>
  );
};
