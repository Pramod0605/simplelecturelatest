import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export type ConversationState = "idle" | "listening" | "processing" | "speaking";

export type ConversationStage = "greeting" | "discovery" | "consultation" | "closing";

interface UseSalesAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  leadId: string | null;
  conversationState: ConversationState;
  conversationStage: ConversationStage;
  detectedLanguage: string;
  setConversationState: (state: ConversationState) => void;
  sendMessage: (content: string) => Promise<void>;
  createLead: (name: string, email: string, mobile: string, gender?: "female" | "male") => Promise<boolean>;
}

export const useSalesAssistant = (): UseSalesAssistantReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>("idle");
  const [conversationStage, setConversationStage] = useState<ConversationStage>("greeting");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en-IN");
  const { toast } = useToast();

  // Detect conversation stage based on messages
  const detectConversationStage = useCallback((messages: Message[]): ConversationStage => {
    const messageCount = messages.length;
    const lastAssistantMessage = messages
      .filter((m) => m.role === "assistant")
      .pop()?.content.toLowerCase() || "";

    // Keyword-based detection (takes priority)
    const closingKeywords = ["enroll", "get started", "secure your spot", "enrollment", "sign up", "payment", "discount"];
    const consultationKeywords = ["recommend", "course includes", "students improved", "perfect for you", "suggest", "based on"];
    const discoveryKeywords = ["which class", "what subjects", "preparing for", "tell me about", "what are your", "help me understand"];

    if (closingKeywords.some((k) => lastAssistantMessage.includes(k))) return "closing";
    if (consultationKeywords.some((k) => lastAssistantMessage.includes(k))) return "consultation";
    if (discoveryKeywords.some((k) => lastAssistantMessage.includes(k))) return "discovery";

    // Fallback to message count
    if (messageCount <= 1) return "greeting";
    if (messageCount <= 4) return "discovery";
    if (messageCount <= 7) return "consultation";
    return "closing";
  }, []);

  const createLead = useCallback(async (
    name: string, 
    email: string, 
    mobile: string,
    gender: "female" | "male" = "male"
  ): Promise<boolean> => {
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
      
      // Determine if this is an anonymous user
      const isAnonymous = name.startsWith("Anonymous") || name.startsWith("Guest");
      const displayName = isAnonymous ? "there" : name;
      
      // Generate welcome message based on gender (Rahul for male/English, Priya for female/Hindi)
      const counselorName = gender === "female" ? "Priya" : "Rahul";
      const welcomeMessage = gender === "female"
        ? `नमस्ते ${displayName}! 👋 मैं प्रिया हूं, SimpleLecture में आपकी शिक्षा सलाहकार।

मैं आपके लक्ष्यों के लिए सही कोर्स खोजने में मदद करने के लिए यहाँ हूं। आपको बेहतर समझने के लिए - क्या आप परीक्षाओं की तैयारी कर रहे छात्र हैं, या अपने बच्चे के लिए सही कोर्स ढूंढ रहे माता-पिता?`
        : `Hi ${displayName}! 👋 I'm ${counselorName}, your education counselor at SimpleLecture.

I'm here to help you find the perfect course for your goals. Just to understand you better - are you a student preparing for exams, or a parent looking for the right course for your child?`;
      
      setMessages([{
        role: "assistant",
        content: welcomeMessage
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
    if (!leadId || !content.trim()) {
      console.log("Cannot send message - leadId:", leadId, "content:", content);
      return;
    }

    const userMessage: Message = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    console.log("Sending message to AI:", { leadId, messageCount: messages.length + 1 });

    try {
      const AI_SALES_ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-sales-assistant`;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (publishableKey) {
        headers["Authorization"] = `Bearer ${publishableKey}`;
      }

      const response = await fetch(AI_SALES_ASSISTANT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [...messages, userMessage],
          leadId,
        }),
      });

      console.log("Edge function response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Edge function error:", response.status, errorText);
        throw new Error(`AI service error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body from AI service");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      // Add placeholder for assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      console.log("Started streaming response");

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
              
              // ALWAYS strip language tags from content (handles partial tag arrivals)
              // Remove complete tags
              let displayContent = assistantContent.replace(/\[LANG:\w{2}-IN\]\s*/g, '');
              // Remove incomplete tag patterns that might be at the end
              displayContent = displayContent.replace(/\[LANG:\w{0,5}$/g, '');
              displayContent = displayContent.replace(/\[LANG$/g, '');
              displayContent = displayContent.replace(/\[LAN$/g, '');
              displayContent = displayContent.replace(/\[LA$/g, '');
              displayContent = displayContent.replace(/\[L$/g, '');
              displayContent = displayContent.replace(/\[$/g, '');
              
              // Parse language tag from response if present (for detection only)
              const langTagMatch = assistantContent.match(/\[LANG:(\w{2}-IN)\]/);
              if (langTagMatch) {
                const detectedLang = langTagMatch[1];
                setDetectedLanguage(detectedLang);
                console.log("Detected language:", detectedLang);
              }
              
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: displayContent.trim()
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

      // Update conversation stage after successful response
      setConversationStage(detectConversationStage([...messages, userMessage]));

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Could not send message: ${errorMessage}`,
        variant: "destructive",
      });
      // Remove the placeholder assistant message if it exists
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === "assistant" && !lastMsg.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [leadId, messages, toast]);

  return {
    messages,
    isLoading,
    leadId,
    conversationState,
    conversationStage,
    detectedLanguage,
    setConversationState,
    sendMessage,
    createLead,
  };
};
