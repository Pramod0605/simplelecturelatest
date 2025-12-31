import { useState, useEffect } from "react";
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
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Derive a human-friendly file name from the URL/path if not explicitly provided
  const derivedFileName = fileName || decodeURIComponent(pdfUrl.split("/").pop() || "Document");

  // Get authorized download URL for B2 files
  const { downloadUrl, proxyUrl, isLoading, error } = useB2DownloadUrl(pdfUrl);

  // Get auth token for proxy requests
  useEffect(() => {
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
    };
    getToken();
  }, []);

  // Build proxy URL with auth token for iframe
  const iframeUrl = proxyUrl && authToken 
    ? `${proxyUrl}&token=${encodeURIComponent(authToken)}`
    : null;

  const handleRetry = () => {
    window.location.reload();
  };

  if (error) {
    const errorType = error.includes('404') ? 'not found in storage' :
                     error.includes('401') || error.includes('403') ? 'authorization failed' :
                     'unknown error';
    
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load PDF: {errorType} - {error}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
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
          onClick={() => iframeUrl && window.open(iframeUrl, "_blank")}
          disabled={isLoading || !iframeUrl}
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
        ) : iframeUrl ? (
          <div className="relative border rounded-lg overflow-hidden bg-muted/10">
            <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
              <span className="text-sm font-medium">{derivedFileName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <iframe
              src={iframeUrl}
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
