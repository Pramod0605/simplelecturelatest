import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type RephraseType = "chapter" | "topic" | "question" | "answer" | "explanation";

export const useAIRephrase = () => {
  return useMutation({
    mutationFn: async ({
      text,
      type,
    }: {
      text: string;
      type: RephraseType;
    }) => {
      const { data, error } = await supabase.functions.invoke("ai-rephrase", {
        body: { text, type },
      });

      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "AI rephrasing failed: " + error.message, variant: "destructive" });
    },
  });
};
