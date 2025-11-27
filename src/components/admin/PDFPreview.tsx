import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, X, Loader2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useB2DownloadUrl } from "@/hooks/useB2DownloadUrl";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFPreviewProps {
  pdfUrl: string;
  fileName?: string;
}

export function PDFPreview({ pdfUrl, fileName = "Document" }: PDFPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get authorized download URL for B2 files
  const { downloadUrl, isLoading, error } = useB2DownloadUrl(pdfUrl);
  const effectiveUrl = downloadUrl || pdfUrl;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load PDF: {error}
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
          onClick={() => effectiveUrl && window.open(effectiveUrl, '_blank')}
          disabled={isLoading || !effectiveUrl}
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
        ) : (
          <div className="relative border rounded-lg overflow-hidden bg-muted/10">
            <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
              <span className="text-sm font-medium">{fileName}</span>
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
              src={effectiveUrl}
              className="w-full h-[600px]"
              title={`PDF Preview: ${fileName}`}
            />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
