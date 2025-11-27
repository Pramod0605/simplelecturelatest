import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, X } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PDFPreviewProps {
  pdfUrl: string;
  fileName?: string;
}

export function PDFPreview({ pdfUrl, fileName = "Document" }: PDFPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {isOpen ? "Hide Preview" : "Preview PDF"}
          </Button>
        </CollapsibleTrigger>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          asChild
        >
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </a>
        </Button>
      </div>

      <CollapsibleContent className="mt-4">
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
            src={pdfUrl}
            className="w-full h-[600px]"
            title={`PDF Preview: ${fileName}`}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
