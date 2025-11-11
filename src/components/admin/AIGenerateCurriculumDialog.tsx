import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ChevronRight, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBulkImportChapters } from "@/hooks/useSubjectManagement";

interface AIGenerateCurriculumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  categoryName?: string;
}

export function AIGenerateCurriculumDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  categoryName,
}: AIGenerateCurriculumDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfChapters, setNumberOfChapters] = useState(10);
  const [generatedCurriculum, setGeneratedCurriculum] = useState<any[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const bulkImport = useBulkImportChapters();

  const toggleChapter = (index: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChapters(newExpanded);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedCurriculum([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-curriculum', {
        body: {
          subjectName,
          categoryName,
          numberOfChapters,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Generation Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setGeneratedCurriculum(data.curriculum || []);
      setExpandedChapters(new Set([0, 1])); // Expand first 2 chapters by default
      
      toast({
        title: "Curriculum Generated",
        description: `Generated ${data.curriculum?.length || 0} chapters. Review and approve to add to subject.`,
      });
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast({
        title: "Generation Error",
        description: error.message || "Failed to generate curriculum",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (generatedCurriculum.length === 0) return;

    try {
      const result = await bulkImport.mutateAsync({
        subjectId,
        chapters: generatedCurriculum,
      });

      toast({
        title: "Curriculum Imported",
        description: `Successfully imported ${result.chapters} chapters, ${result.topics} topics, and ${result.subtopics} subtopics.`,
      });

      onOpenChange(false);
      setGeneratedCurriculum([]);
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import curriculum",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Curriculum Generator
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive chapter structure for {subjectName}
            {categoryName && ` (${categoryName})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Generation Settings */}
          {generatedCurriculum.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numChapters">Number of Chapters</Label>
                  <Input
                    id="numChapters"
                    type="number"
                    min={3}
                    max={20}
                    value={numberOfChapters}
                    onChange={(e) => setNumberOfChapters(parseInt(e.target.value) || 10)}
                    disabled={isGenerating}
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Curriculum...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Curriculum
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Preview Generated Curriculum */}
          {generatedCurriculum.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Preview Generated Curriculum</CardTitle>
                    <Badge variant="secondary">
                      {generatedCurriculum.length} Chapters
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {generatedCurriculum.map((chapter, chapterIndex) => (
                        <Collapsible
                          key={chapterIndex}
                          open={expandedChapters.has(chapterIndex)}
                          onOpenChange={() => toggleChapter(chapterIndex)}
                        >
                          <Card>
                            <CollapsibleTrigger className="w-full">
                              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-left">
                                    {expandedChapters.has(chapterIndex) ? (
                                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                    )}
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {chapter.chapter_number}
                                        </Badge>
                                        <span className="font-semibold">{chapter.title}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {chapter.description}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {chapter.topics?.length || 0} topics
                                  </Badge>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0 space-y-2">
                                {chapter.topics?.map((topic: any, topicIndex: number) => (
                                  <Card key={topicIndex} className="bg-muted/30">
                                    <CardContent className="p-3">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {topic.topic_number}
                                          </Badge>
                                          <span className="text-sm font-medium">{topic.title}</span>
                                          <Badge variant="secondary" className="text-xs ml-auto">
                                            {topic.estimated_duration_minutes} min
                                          </Badge>
                                        </div>
                                        {topic.subtopics && topic.subtopics.length > 0 && (
                                          <div className="ml-6 space-y-1">
                                            {topic.subtopics.map((subtopic: any, subIndex: number) => (
                                              <div key={subIndex} className="flex items-center gap-2 text-xs">
                                                <span className="text-muted-foreground">•</span>
                                                <span>{subtopic.title}</span>
                                                <Badge variant="outline" className="text-xs ml-auto">
                                                  {subtopic.estimated_duration_minutes} min
                                                </Badge>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Review the generated curriculum. Click "Approve & Import" to add to {subjectName}.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {generatedCurriculum.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedCurriculum([]);
                  setExpandedChapters(new Set());
                }}
              >
                Regenerate
              </Button>
              <Button
                onClick={handleApprove}
                disabled={bulkImport.isPending}
              >
                {bulkImport.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Approve & Import"
                )}
              </Button>
            </>
          )}
          {generatedCurriculum.length === 0 && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
