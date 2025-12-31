import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileJson, Video, FileText, Image, ChevronDown, ChevronUp, Sparkles, Copy, Check, Filter, X, Link as LinkIcon, Clock, BookOpen } from "lucide-react";
import { useAIAssistantDocuments } from "@/hooks/useAIAssistantDocuments";
import { useSubjectChapters, useChapterTopics } from "@/hooks/useSubjectChaptersTopics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
interface SubjectVideoGeneratorTabProps {
  subjectId: string;
  subjectName: string;
}

export function SubjectVideoGeneratorTab({ subjectId, subjectName }: SubjectVideoGeneratorTabProps) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"markdown" | "json">("markdown");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Filter state
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  
  // Fetch chapters and topics
  const { data: chapters } = useSubjectChapters(subjectId);
  const { data: topics } = useChapterTopics(selectedChapterId || undefined);
  
  const { data: documents, isLoading } = useAIAssistantDocuments(
    subjectId,
    selectedChapterId,
    selectedTopicId
  );
  
  // Reset document selection when filters change
  useEffect(() => {
    setSelectedDocumentId("");
  }, [selectedChapterId, selectedTopicId]);
  
  // Reset topic when chapter changes
  useEffect(() => {
    setSelectedTopicId(null);
  }, [selectedChapterId]);
  
  const hasActiveFilters = selectedChapterId !== null;
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  
  const clearFilters = () => {
    setSelectedChapterId(null);
    setSelectedTopicId(null);
  };

  const displayedDocuments = showAllDocuments ? documents : documents?.slice(0, 5);

  const getChapterName = (chapterId: string | null) => {
    if (!chapterId || !chapters) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter ? `Ch. ${chapter.chapter_number}` : null;
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "url": return <LinkIcon className="h-4 w-4 text-blue-500" />;
      case "json": return <FileJson className="h-4 w-4 text-yellow-500" />;
      default: return <FileText className="h-4 w-4 text-red-500" />;
    }
  };
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

  // Generate 9-digit unique ID
  const generateUniqueId = () => {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  };

  // Handle generate video click
  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setGeneratedId(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uniqueId = generateUniqueId();
      
      const { error } = await supabase
        .from('video_generation_jobs')
        .insert({
          id: uniqueId,
          document_id: selectedDocumentId,
          subject_id: subjectId,
          document_name: selectedDocument?.display_name || selectedDocument?.file_name,
          parsed_content: fullContent as any,
          status: 'pending',
          created_by: user?.id
        } as any);
      
      if (error) {
        console.error('Error creating video job:', error);
        toast.error('Failed to create video job');
        return;
      }
      
      setGeneratedId(uniqueId);
      toast.success(`Video job created with ID: ${uniqueId}`);
    } catch (err) {
      console.error('Error:', err);
      toast.error('An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedId) {
      navigator.clipboard.writeText(generatedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('ID copied to clipboard');
    }
  };

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
        {/* Filter Section */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filter by:</span>
          </div>
          
          <Select
            value={selectedChapterId || "all"}
            onValueChange={(val) => setSelectedChapterId(val === "all" ? null : val)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Chapters" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Chapters</SelectItem>
              {chapters?.map((chapter) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  Ch {chapter.chapter_number}: {chapter.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedChapterId && (
            <Select
              value={selectedTopicId || "all"}
              onValueChange={(val) => setSelectedTopicId(val === "all" ? null : val)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Topics</SelectItem>
                {topics?.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    Topic {topic.topic_number}: {topic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Document List */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Documents ({documents?.length || 0})
          </Label>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground p-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30 text-center">
              <FileJson className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No documents found{hasActiveFilters ? " for selected filters" : ""}.</p>
              <p className="text-xs mt-1">
                {hasActiveFilters 
                  ? "Try clearing filters or select different chapter/topic." 
                  : "Go to the Documents tab to upload and parse PDFs first."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedDocuments?.map((doc) => (
                      <TableRow 
                        key={doc.id}
                        className={`cursor-pointer ${selectedDocumentId === doc.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => setSelectedDocumentId(doc.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getSourceIcon(doc.source_type)}
                            <span className="truncate max-w-[200px]">
                              {doc.display_name || doc.file_name || "Untitled"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.chapter_id ? (
                            <Badge variant="outline" className="text-xs">
                              {getChapterName(doc.chapter_id)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {doc.source_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <div className="flex flex-col">
                              <span>{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                              <span className="text-xs text-muted-foreground/70">
                                {format(new Date(doc.created_at), "HH:mm")}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant={selectedDocumentId === doc.id ? "default" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocumentId(doc.id);
                            }}
                          >
                            {selectedDocumentId === doc.id ? "Selected" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {documents.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllDocuments(!showAllDocuments)}
                  className="w-full"
                >
                  {showAllDocuments ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show All ({documents.length})
                    </>
                  )}
                </Button>
              )}
            </>
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

                {/* Generate Video Button */}
                <div className="mt-4 p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5">
                  <Button 
                    onClick={handleGenerateVideo}
                    disabled={isGenerating}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Video
                      </>
                    )}
                  </Button>
                  
                  {generatedId && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Video Job Created!</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xl font-mono font-bold text-green-800 dark:text-green-200">{generatedId}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={copyToClipboard}
                          className="h-8 w-8 p-0"
                        >
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use this ID to access the video once generated. The parsed content is stored and ready for API processing.
                      </p>
                    </div>
                  )}
                </div>
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
