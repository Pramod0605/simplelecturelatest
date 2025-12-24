import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ExtractedQuestion } from "./usePreviousYearQuestions";

interface ExtractQuestionsParams {
  contentJson: any;
  examName: string;
  year: number;
  paperType?: string;
}

interface ExtractQuestionsResponse {
  success: boolean;
  questions: ExtractedQuestion[];
  questionsCount: number;
  error?: string;
}

export function useExtractQuestionsAI() {
  return useMutation({
    mutationFn: async ({
      contentJson,
      examName,
      year,
      paperType,
    }: ExtractQuestionsParams): Promise<ExtractQuestionsResponse> => {
      const { data, error } = await supabase.functions.invoke("extract-questions-preview", {
        body: { contentJson, examName, year, paperType },
      });

      if (error) {
        console.error("Error calling extract-questions-preview:", error);
        throw new Error(error.message || "Failed to extract questions");
      }

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onError: (error: Error) => {
      console.error("AI extraction error:", error);
      if (error.message.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else if (error.message.includes("credits")) {
        toast.error("API credits exhausted. Please contact support.");
      } else {
        toast.error(`Failed to extract questions: ${error.message}`);
      }
    },
  });
}
