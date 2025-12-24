import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, FileJson, FileText, Loader2, Check, Copy, Eye, EyeOff, 
  Pencil, ExternalLink, Clock, FileCheck2 
} from "lucide-react";
import { useDatalab } from "@/hooks/useDatalab";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSubjectUploadedDocuments } from "@/hooks/useSubjectUploadedDocuments";
import { RenameDocumentDialog } from "./RenameDocumentDialog";
import { format } from "date-fns";

interface SubjectDocumentsTabProps {
  subjectId: string;
  subjectName: string;
  currentJson?: any;
  currentPdfUrl?: string;
}

export function SubjectDocumentsTab({ 
  subjectId, 
  subjectName, 
  currentJson, 
  currentPdfUrl 
}: SubjectDocumentsTabProps) {
  const [jsonContent, setJsonContent] = useState<any>(currentJson || null);
  const [jsonText, setJsonText] = useState<string>(currentJson ? JSON.stringify(currentJson, null, 2) : "");
  const [pdfUrl, setPdfUrl] = useState<string>(currentPdfUrl || "");
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; name: string } | null>(null);
  
  const { parsePdfFile, parsePdfFromUrl, isLoading, progress } = useDatalab();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch uploaded documents for this subject
  const { data: uploadedDocuments, isLoading: isLoadingDocuments } = useSubjectUploadedDocuments(subjectId);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    const result = await parsePdfFile(file);
    if (result) {
      setJsonContent(result.content_json);
      setJsonText(JSON.stringify(result.content_json, null, 2));
    }
  };

  const handleParsePdfUrl = async () => {
    if (!pdfUrl) {
      toast({
        title: "No URL",
        description: "Please enter a PDF URL first",
        variant: "destructive",
      });
      return;
    }

    const result = await parsePdfFromUrl(pdfUrl);
    if (result) {
      setJsonContent(result.content_json);
      setJsonText(JSON.stringify(result.content_json, null, 2));
    }
  };

  const handleJsonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setJsonContent(parsed);
      setJsonText(JSON.stringify(parsed, null, 2));
      toast({
        title: "JSON Loaded",
        description: "JSON file loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Failed to parse JSON file",
        variant: "destructive",
      });
    }
  };

  const handleJsonTextChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setJsonContent(parsed);
    } catch {
      // Invalid JSON, keep the text but don't update jsonContent
    }
  };

  const handleSave = async () => {
    if (!jsonContent) {
      toast({
        title: "No Content",
        description: "Please parse a PDF or upload JSON first",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("popular_subjects")
        .update({
          content_json: jsonContent,
          json_source_pdf_url: pdfUrl || null,
        })
        .eq("id", subjectId);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Document content saved to subject",
      });
      
      queryClient.invalidateQueries({ queryKey: ["admin-subject", subjectId] });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonText);
    toast({
      title: "Copied",
      description: "JSON copied to clipboard",
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Completed</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getDocumentName = (doc: typeof uploadedDocuments extends (infer T)[] | undefined ? T : never) => {
    return doc.display_name || doc.file_name || doc.questions_file_name || "Untitled Document";
  };

  const handleRenameClick = (doc: typeof uploadedDocuments extends (infer T)[] | undefined ? T : never) => {
    setSelectedDocument({
      id: doc.id,
      name: getDocumentName(doc),
    });
    setRenameDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Document Content (JSON) Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Document Content (JSON)
          </CardTitle>
          <CardDescription>
            Upload a PDF to parse with AI or directly upload a JSON file. This content will be used by the AI Teaching Assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pdf" className="gap-2">
                <FileText className="h-4 w-4" />
                Parse PDF
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <FileJson className="h-4 w-4" />
                Upload JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="space-y-4 mt-4">
              {/* Upload PDF File */}
              <div className="space-y-2">
                <Label>Upload PDF File</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    disabled={isLoading}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Or Parse from URL */}
              <div className="space-y-2">
                <Label>Or Parse from PDF URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/document.pdf"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleParsePdfUrl} 
                    disabled={isLoading || !pdfUrl}
                    variant="secondary"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Parse
                  </Button>
                </div>
              </div>

              {/* Progress indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{progress}</span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="json" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Upload JSON File</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleJsonFileUpload}
                />
              </div>

              <div className="space-y-2">
                <Label>Or Paste JSON</Label>
                <Textarea
                  placeholder='{"content": "..."}'
                  value={jsonText}
                  onChange={(e) => handleJsonTextChange(e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* JSON Preview */}
          {jsonContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Parsed Content</Label>
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" />
                    Valid JSON
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {showPreview && (
                <ScrollArea className="h-[300px] rounded-lg border bg-muted/50 p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(jsonContent, null, 2)}
                  </pre>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !jsonContent}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save to Subject
            </Button>
          </div>

          {/* Current Status */}
          {currentJson && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              This subject has existing JSON content stored
              {currentPdfUrl && (
                <span className="text-xs">
                  (from: {currentPdfUrl.substring(0, 50)}...)
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Question Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5" />
            Uploaded Question Documents
          </CardTitle>
          <CardDescription>
            All question documents uploaded for this subject. Click rename to change the document name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !uploadedDocuments || uploadedDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No question documents uploaded for this subject yet.</p>
              <p className="text-sm mt-1">Upload documents from the Questions tab.</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {getDocumentName(doc)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>
                        {doc.questions_count != null ? (
                          <span className="font-medium">{doc.questions_count}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Clock className="h-3 w-3" />
                          {doc.created_at ? format(new Date(doc.created_at), "MMM d, yyyy") : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRenameClick(doc)}
                            className="gap-1"
                          >
                            <Pencil className="h-3 w-3" />
                            Rename
                          </Button>
                          {doc.questions_file_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={doc.questions_file_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      {selectedDocument && (
        <RenameDocumentDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          documentId={selectedDocument.id}
          currentName={selectedDocument.name}
        />
      )}
    </div>
  );
}
