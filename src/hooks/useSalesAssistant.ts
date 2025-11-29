import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseSalesAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  leadId: string | null;
  sendMessage: (content: string) => Promise<void>;
  createLead: (name: string, email: string, mobile: string) => Promise<boolean>;
}

export const useSalesAssistant = (): UseSalesAssistantReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const { toast } = useToast();

  const createLead = useCallback(async (name: string, email: string, mobile: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .insert({
          name,
          email,
          mobile,
          conversation_history: [],
        })
        .select()
        .single();

      if (error) throw error;

      setLeadId(data.id);
      
      // Add welcome message
      setMessages([{
        role: "assistant",
        content: `Hello ${name}! 👋 Welcome to SimpleLecture! I'm here to help you find the perfect course for your exam preparation. Feel free to ask me anything about our courses, pricing, or features!`
      }]);

      return true;
    } catch (error) {
      console.error("Error creating lead:", error);
      toast({
        title: "Error",
        description: "Could not save your information. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const sendMessage = useCallback(async (content: string) => {
    if (!leadId || !content.trim()) return;

    const userMessage: Message = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://oxwhqvsoelqqsblmqkxx.supabase.co/functions/v1/ai-sales-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94d2hxdnNvZWxxcXNibG1xa3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTU4NTgsImV4cCI6MjA3NTA5MTg1OH0.nZbWSb9AQK5uGAQmc7zXAceTHm9GRQJvqkg4-LNo_DM`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            leadId,
          }),
        }
      );

      if (!response.ok || !response.body) throw new Error("Failed to get response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      // Add placeholder for assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
      // Remove the placeholder assistant message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [leadId, messages, toast]);

  return {
    messages,
    isLoading,
    leadId,
    sendMessage,
    createLead,
  };
};
