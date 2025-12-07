import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DatalabResult {
  success: boolean;
  request_id: string;
  content_json: any | null;
  content_markdown: string | null;
  images: Record<string, string>;
  metadata: {
    pages: number;
    ocr_stats: any | null;
  };
}

export function useDatalab() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const { toast } = useToast();

  const parsePdfFile = async (file: File): Promise<DatalabResult | null> => {
    setIsLoading(true);
    setProgress("Uploading PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress("Parsing PDF with AI... This may take a few minutes.");

      const { data, error } = await supabase.functions.invoke("parse-pdf-to-json", {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      setProgress("Complete!");
      toast({
        title: "PDF Parsed Successfully",
        description: `Extracted ${data.metadata?.pages || 0} pages`,
      });

      return data as DatalabResult;
    } catch (error: any) {
      console.error("Error parsing PDF:", error);
      toast({
        title: "PDF Parsing Failed",
        description: error.message || "Failed to parse PDF",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
      setProgress("");
    }
  };

  const parsePdfFromUrl = async (pdfUrl: string): Promise<DatalabResult | null> => {
    setIsLoading(true);
    setProgress("Starting PDF parsing...");

    try {
      const formData = new FormData();
      formData.append("pdf_url", pdfUrl);

      setProgress("Parsing PDF with AI... This may take a few minutes.");

      const { data, error } = await supabase.functions.invoke("parse-pdf-to-json", {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      setProgress("Complete!");
      toast({
        title: "PDF Parsed Successfully",
        description: `Extracted ${data.metadata?.pages || 0} pages`,
      });

      return data as DatalabResult;
    } catch (error: any) {
      console.error("Error parsing PDF:", error);
      toast({
        title: "PDF Parsing Failed",
        description: error.message || "Failed to parse PDF",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
      setProgress("");
    }
  };

  return {
    parsePdfFile,
    parsePdfFromUrl,
    isLoading,
    progress,
  };
}
