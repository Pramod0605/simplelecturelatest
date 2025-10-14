import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SubjectChaptersTabProps {
  subjectId: string;
  subjectName: string;
}

export function SubjectChaptersTab({ subjectId, subjectName }: SubjectChaptersTabProps) {
  const [chapters, setChapters] = useState<any[]>([]);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chapters & Topics</CardTitle>
              <CardDescription>
                Organize {subjectName} curriculum into chapters and topics
              </CardDescription>
            </div>
            <Dialog open={isAddChapterOpen} onOpenChange={setIsAddChapterOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Chapter
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle>Add New Chapter</DialogTitle>
                  <DialogDescription>
                    Create a new chapter for this subject
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapter-number">Chapter Number *</Label>
                    <Input id="chapter-number" type="number" placeholder="1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapter-title">Chapter Title *</Label>
                    <Input id="chapter-title" placeholder="e.g., Mechanics" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapter-description">Description</Label>
                    <Textarea
                      id="chapter-description"
                      placeholder="Brief description of the chapter..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapter-sequence">Sequence Order</Label>
                    <Input id="chapter-sequence" type="number" defaultValue={1} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddChapterOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddChapterOpen(false)}>
                    Add Chapter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {chapters.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No chapters yet</p>
              <Button variant="outline" onClick={() => setIsAddChapterOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Chapter
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <Collapsible
                  key={chapter.id}
                  open={expandedChapters.has(chapter.id)}
                  onOpenChange={() => toggleChapter(chapter.id)}
                >
                  <div className="border rounded-lg">
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                            {expandedChapters.has(chapter.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Chapter {chapter.number}: {chapter.title}
                            </span>
                            <Badge variant="secondary">{chapter.topics?.length || 0} topics</Badge>
                          </div>
                          {chapter.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {chapter.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChapter(chapter.id);
                            setIsAddTopicOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Topic
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="border-t bg-muted/20 p-4">
                        {chapter.topics && chapter.topics.length > 0 ? (
                          <div className="space-y-2">
                            {chapter.topics.map((topic: any, idx: number) => (
                              <div
                                key={topic.id}
                                className="flex items-center justify-between p-3 bg-background rounded-lg border"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {idx + 1}. {topic.title}
                                    </span>
                                    {topic.estimated_duration_minutes && (
                                      <Badge variant="outline" className="text-xs">
                                        {topic.estimated_duration_minutes}min
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No topics yet. Click "Add Topic" to create the first one.
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Topic Dialog */}
      <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
            <DialogDescription>
              Create a new topic for this chapter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic-number">Topic Number *</Label>
              <Input id="topic-number" type="number" placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-title">Topic Title *</Label>
              <Input id="topic-title" placeholder="e.g., Newton's Laws of Motion" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-duration">Estimated Duration (minutes)</Label>
              <Input id="topic-duration" type="number" placeholder="45" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-video">Video URL (Optional)</Label>
              <Input id="topic-video" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-content">Content Markdown (Optional)</Label>
              <Textarea
                id="topic-content"
                placeholder="Add topic content in markdown format..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTopicOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddTopicOpen(false)}>Add Topic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
