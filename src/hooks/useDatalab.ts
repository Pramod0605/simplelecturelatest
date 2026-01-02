import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePdfPageRenderer } from "./usePdfPageRenderer";

interface UploadedImage {
  url: string;
  pageNumber: number;
  name?: string;
}

interface DatalabResult {
  success: boolean;
  request_id: string;
  content_json: any | null;
  content_markdown: string | null;
  images: Record<string, string>;
  uploaded_images: UploadedImage[];
  metadata: {
    pages: number;
    ocr_stats: any | null;
  };
}

export function useDatalab() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const { toast } = useToast();
  const { renderPdfPages, renderPdfFromBlob, progress: renderProgress } = usePdfPageRenderer();

  const parsePdfFile = async (file: File): Promise<DatalabResult | null> => {
    setIsLoading(true);
    setProgress("Uploading PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress("Extracting text with AI... This may take a few minutes.");

      const { data, error } = await supabase.functions.invoke("parse-pdf-to-json", {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      // Now render pages with PDF.js using the original file blob
      setProgress("Rendering PDF pages...");
      const pages = await renderPdfFromBlob(file, data.request_id);
      const renderedPages = pages.map(p => ({
        url: p.url,
        pageNumber: p.pageNumber,
        name: `page_${p.pageNumber}.png`,
      }));

      const result: DatalabResult = {
        ...data,
        uploaded_images: renderedPages,
        metadata: {
          ...data.metadata,
          pages: renderedPages.length || data.metadata?.pages || 0,
        },
      };

      setProgress("Complete!");
      toast({
        title: "PDF Parsed Successfully",
        description: `Extracted ${result.metadata?.pages || 0} pages`,
      });

      return result;
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

      setProgress("Extracting text with AI... This may take a few minutes.");

      const { data, error } = await supabase.functions.invoke("parse-pdf-to-json", {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      // Now render pages with PDF.js using the B2 proxy
      setProgress("Rendering PDF pages...");
      const pages = await renderPdfPages(pdfUrl, data.request_id);
      const renderedPages = pages.map(p => ({
        url: p.url,
        pageNumber: p.pageNumber,
        name: `page_${p.pageNumber}.png`,
      }));

      const result: DatalabResult = {
        ...data,
        uploaded_images: renderedPages,
        metadata: {
          ...data.metadata,
          pages: renderedPages.length || data.metadata?.pages || 0,
        },
      };

      setProgress("Complete!");
      toast({
        title: "PDF Parsed Successfully",
        description: `Extracted ${result.metadata?.pages || 0} pages`,
      });

      return result;
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

  // Get detailed progress message
  const getDetailedProgress = (): string => {
    if (renderProgress && renderProgress.phase !== "complete") {
      const { currentPage, totalPages, phase } = renderProgress;
      if (phase === "loading") return "Loading PDF...";
      if (phase === "rendering") return `Rendering page ${currentPage} of ${totalPages}...`;
      if (phase === "uploading") return `Uploading page ${currentPage} of ${totalPages}...`;
    }
    return progress;
  };

  return {
    parsePdfFile,
    parsePdfFromUrl,
    isLoading,
    progress: getDetailedProgress(),
  };
}
