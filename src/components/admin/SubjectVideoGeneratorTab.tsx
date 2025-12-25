import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, FileJson, Video, FileText, Image, ChevronDown, ChevronUp } from "lucide-react";
import { useAIAssistantDocuments } from "@/hooks/useAIAssistantDocuments";

interface SubjectVideoGeneratorTabProps {
  subjectId: string;
  subjectName: string;
}

export function SubjectVideoGeneratorTab({ subjectId, subjectName }: SubjectVideoGeneratorTabProps) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"markdown" | "json">("markdown");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: documents, isLoading } = useAIAssistantDocuments(subjectId);
  
  const selectedDocument = documents?.find(doc => doc.id === selectedDocumentId);
  const fullContent = selectedDocument?.full_content as Record<string, unknown> | null;
  
  // Helper to get JSON without base64 image data for readability
  const getCleanJsonForDisplay = (content: Record<string, unknown>) => {
    const cleaned = { ...content };
    if (cleaned.images && typeof cleaned.images === 'object') {
      const imageKeys = Object.keys(cleaned.images as object);
      cleaned.images = `[${imageKeys.length} images - base64 data hidden for display]`;
    }
    return cleaned;
  };
  
  const metadata = fullContent?.metadata as Record<string, unknown> | undefined;
  const imageCount = fullContent?.images ? Object.keys(fullContent.images as object).length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Generate Video
        </CardTitle>
        <CardDescription>
          Select a parsed document to view its content and generate AI video scripts for {subjectName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Selector */}
        <div className="space-y-2">
          <Label>Select Document</Label>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30 text-center">
              <FileJson className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No documents found.</p>
              <p className="text-xs mt-1">Go to the Documents tab to upload and parse PDFs first.</p>
            </div>
          ) : (
            <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a document..." />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.display_name || doc.file_name || "Untitled Document"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Document Content Display */}
        {selectedDocumentId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Document Content</Label>
              {fullContent && (
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "markdown" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("markdown")}
                    className="gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Markdown
                  </Button>
                  <Button
                    variant={viewMode === "json" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("json")}
                    className="gap-1.5"
                  >
                    <FileJson className="h-3.5 w-3.5" />
                    JSON
                  </Button>
                </div>
              )}
            </div>
            
            {fullContent ? (
              <>
                {/* Metadata bar */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Pages: {(metadata?.pages as number) || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Image className="h-3.5 w-3.5" />
                    Images: {imageCount}
                  </span>
                  <span className={fullContent.success ? "text-green-600" : "text-red-600"}>
                    Status: {fullContent.success ? "✓ Success" : "✗ Failed"}
                  </span>
                </div>
                
                <ScrollArea className={`${isExpanded ? "h-[600px]" : "h-[200px]"} rounded-lg border bg-muted/50 p-4 transition-all duration-300`}>
                  {viewMode === "markdown" ? (
                    <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {(fullContent.content_markdown as string) || "No markdown content available"}
                    </pre>
                  ) : (
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(getCleanJsonForDisplay(fullContent), null, 2)}
                    </pre>
                  )}
                </ScrollArea>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full mt-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30 text-center">
                <p>No full content available for this document.</p>
                <p className="text-xs mt-1">
                  This document was saved before full content storage was enabled. 
                  Re-parse the document in the Documents tab to store the full content.
                </p>
              </div>
            )}
          </div>
        )}

        {!selectedDocumentId && documents && documents.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select a document above to view its parsed content</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
