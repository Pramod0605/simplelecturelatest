import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, X, Loader2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useB2DownloadUrl } from "@/hooks/useB2DownloadUrl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface PDFPreviewProps {
  pdfUrl: string;
  /** Optional override for the display name. If omitted, we derive it from the URL/path. */
  fileName?: string;
}

export function PDFPreview({ pdfUrl, fileName }: PDFPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isFetchingPdf, setIsFetchingPdf] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Derive a human-friendly file name from the URL/path if not explicitly provided
  const derivedFileName = fileName || decodeURIComponent(pdfUrl.split("/").pop() || "Document");

  // Get proxy URL for B2 files
  const { proxyUrl, isLoading: isUrlLoading, error: urlError } = useB2DownloadUrl(pdfUrl);

  // Cleanup blob URL on unmount or when closing
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const loadPdf = useCallback(async () => {
    if (!proxyUrl) return;
    
    setIsFetchingPdf(true);
    setFetchError(null);

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Fetch PDF through proxy with Authorization header
      const response = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load PDF: ${response.status} - ${errorText}`);
      }

      // Create blob URL from response
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Cleanup old blob URL if exists
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      
      setPdfBlobUrl(blobUrl);
    } catch (error) {
      console.error("PDF fetch error:", error);
      
      // Check if it's a blocker issue
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        setFetchError("Your browser may be blocking this request. Please disable ad blockers or allowlist this site.");
      } else {
        setFetchError(error instanceof Error ? error.message : "Failed to load PDF");
      }
    } finally {
      setIsFetchingPdf(false);
    }
  }, [proxyUrl, pdfBlobUrl]);

  // Load PDF when opening the preview
  useEffect(() => {
    if (isOpen && proxyUrl && !pdfBlobUrl && !isFetchingPdf && !fetchError) {
      loadPdf();
    }
  }, [isOpen, proxyUrl, pdfBlobUrl, isFetchingPdf, fetchError, loadPdf]);

  // Cleanup when closing
  const handleClose = () => {
    setIsOpen(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setFetchError(null);
  };

  const handleOpenInNewTab = () => {
    // Navigate to dedicated PDF viewer page (avoids Chrome blocking)
    const encodedPath = encodeURIComponent(pdfUrl);
    window.open(`/admin/pdf-viewer?path=${encodedPath}`, "_blank");
  };

  const isLoading = isUrlLoading || isFetchingPdf;
  const error = urlError || fetchError;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFetchError(null);
              loadPdf();
            }}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isLoading ? "Loading..." : isOpen ? "Hide Preview" : "Preview PDF"}
          </Button>
        </CollapsibleTrigger>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOpenInNewTab}
          disabled={isLoading}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open in New Tab
        </Button>
      </div>

      <CollapsibleContent className="mt-4">
        {isLoading ? (
          <div className="border rounded-lg p-8 bg-muted flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : pdfBlobUrl ? (
          <div className="relative border rounded-lg overflow-hidden bg-muted/10">
            <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
              <span className="text-sm font-medium">{derivedFileName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <iframe
              src={pdfBlobUrl}
              className="w-full h-[600px]"
              title={`PDF Preview: ${derivedFileName}`}
            />
          </div>
        ) : (
          <div className="border rounded-lg p-8 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Unable to load preview</span>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
