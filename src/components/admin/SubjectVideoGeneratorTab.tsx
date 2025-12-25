import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileJson, Video } from "lucide-react";
import { useAIAssistantDocuments } from "@/hooks/useAIAssistantDocuments";

interface SubjectVideoGeneratorTabProps {
  subjectId: string;
  subjectName: string;
}

export function SubjectVideoGeneratorTab({ subjectId, subjectName }: SubjectVideoGeneratorTabProps) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  
  const { data: documents, isLoading } = useAIAssistantDocuments(subjectId);
  
  const selectedDocument = documents?.find(doc => doc.id === selectedDocumentId);
  const fullContent = selectedDocument?.full_content;

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

        {/* JSON Content Display */}
        {selectedDocumentId && (
          <div className="space-y-2">
            <Label>Document Content</Label>
            {fullContent ? (
              <ScrollArea className="h-[400px] rounded-lg border bg-muted/50 p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(fullContent, null, 2)}
                </pre>
              </ScrollArea>
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
