import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Sparkles, Upload, Download, Loader2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useSubjectChapters,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  useChapterTopics,
  useCreateTopic,
  useUpdateTopic,
  useDeleteTopic,
  useBulkImportChapters,
} from "@/hooks/useSubjectManagement";
import { AIRephraseModal } from "./AIRephraseModal";
import { ExcelImportModal } from "./ExcelImportModal";
import * as XLSX from "xlsx";

interface SubjectChaptersTabProps {
  subjectId: string;
  subjectName: string;
}

export function SubjectChaptersTab({ subjectId, subjectName }: SubjectChaptersTabProps) {
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);
  
  // AI Rephrase states
  const [rephraseModalOpen, setRephraseModalOpen] = useState(false);
  const [rephraseText, setRephraseText] = useState("");
  const [rephraseType, setRephraseType] = useState<"chapter" | "topic">("chapter");
  const [rephraseCallback, setRephraseCallback] = useState<((text: string) => void) | null>(null);

  // Form states
  const [chapterForm, setChapterForm] = useState({
    chapter_number: 1,
    title: "",
    description: "",
    sequence_order: 1,
  });

  const [topicForm, setTopicForm] = useState({
    topic_number: 1,
    title: "",
    estimated_duration_minutes: 60,
    video_url: "",
    content_markdown: "",
    sequence_order: 1,
  });

  const { data: chapters, isLoading } = useSubjectChapters(subjectId);
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const bulkImport = useBulkImportChapters();

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleCreateChapter = () => {
    createChapter.mutate(
      {
        subject_id: subjectId,
        ...chapterForm,
      },
      {
        onSuccess: () => {
          setIsAddChapterOpen(false);
          setChapterForm({
            chapter_number: (chapters?.length || 0) + 1,
            title: "",
            description: "",
            sequence_order: (chapters?.length || 0) + 1,
          });
        },
      }
    );
  };

  const handleUpdateChapter = () => {
    if (!editingChapter) return;
    updateChapter.mutate(
      {
        id: editingChapter.id,
        updates: chapterForm,
      },
      {
        onSuccess: () => {
          setEditingChapter(null);
          setChapterForm({
            chapter_number: 1,
            title: "",
            description: "",
            sequence_order: 1,
          });
        },
      }
    );
  };

  const handleDeleteChapter = () => {
    if (!deleteChapterId) return;
    deleteChapter.mutate(
      { id: deleteChapterId, subjectId },
      {
        onSuccess: () => setDeleteChapterId(null),
      }
    );
  };

  const handleCreateTopic = () => {
    if (!selectedChapter) return;
    createTopic.mutate(
      {
        chapter_id: selectedChapter,
        ...topicForm,
      },
      {
        onSuccess: () => {
          setIsAddTopicOpen(false);
          setTopicForm({
            topic_number: 1,
            title: "",
            estimated_duration_minutes: 60,
            video_url: "",
            content_markdown: "",
            sequence_order: 1,
          });
        },
      }
    );
  };

  const handleUpdateTopic = () => {
    if (!editingTopic) return;
    updateTopic.mutate(
      {
        id: editingTopic.id,
        updates: topicForm,
      },
      {
        onSuccess: () => {
          setEditingTopic(null);
          setTopicForm({
            topic_number: 1,
            title: "",
            estimated_duration_minutes: 60,
            video_url: "",
            content_markdown: "",
            sequence_order: 1,
          });
        },
      }
    );
  };

  const handleDeleteTopic = () => {
    if (!deleteTopicId || !selectedChapter) return;
    deleteTopic.mutate(
      { id: deleteTopicId, chapterId: selectedChapter },
      {
        onSuccess: () => setDeleteTopicId(null),
      }
    );
  };

  const openRephraseModal = (text: string, type: "chapter" | "topic", callback: (text: string) => void) => {
    setRephraseText(text);
    setRephraseType(type);
    setRephraseCallback(() => callback);
    setRephraseModalOpen(true);
  };

  const handleRephraseAccept = (rephrasedText: string) => {
    if (rephraseCallback) {
      rephraseCallback(rephrasedText);
    }
    setRephraseModalOpen(false);
  };

  const handleExcelImport = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    // Parse Excel data into chapters with topics
    const chaptersMap = new Map<number, any>();

    jsonData.forEach((row) => {
      const chapterNum = parseInt(row.chapter_number);
      if (!chaptersMap.has(chapterNum)) {
        chaptersMap.set(chapterNum, {
          chapter_number: chapterNum,
          title: row.chapter_title,
          description: row.chapter_description || "",
          topics: [],
        });
      }

      if (row.topic_number && row.topic_title) {
        chaptersMap.get(chapterNum)?.topics.push({
          topic_number: parseInt(row.topic_number),
          title: row.topic_title,
          estimated_duration_minutes: parseInt(row.duration_minutes) || 60,
          content_markdown: row.content_markdown || "",
        });
      }
    });

    const chaptersArray = Array.from(chaptersMap.values());

    const result = await bulkImport.mutateAsync({
      subjectId,
      chapters: chaptersArray,
    });

    return {
      success: result.chapters + result.topics,
      errors: result.errors,
    };
  };

  const downloadTemplate = () => {
    const template = [
      {
        chapter_number: 1,
        chapter_title: "Introduction to Physics",
        chapter_description: "Basic concepts and principles",
        topic_number: 1,
        topic_title: "Newton's First Law",
        duration_minutes: 45,
        content_markdown: "# Content here...",
      },
      {
        chapter_number: 1,
        chapter_title: "Introduction to Physics",
        chapter_description: "Basic concepts and principles",
        topic_number: 2,
        topic_title: "Newton's Second Law",
        duration_minutes: 60,
        content_markdown: "# Content here...",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chapters");
    XLSX.writeFile(wb, "chapters_template.xlsx");
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsExcelImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
              <Dialog
                open={isAddChapterOpen || !!editingChapter}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsAddChapterOpen(false);
                    setEditingChapter(null);
                    setChapterForm({
                      chapter_number: 1,
                      title: "",
                      description: "",
                      sequence_order: 1,
                    });
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Chapter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingChapter ? "Edit Chapter" : "Add New Chapter"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingChapter ? "Update chapter details" : "Create a new chapter for this subject"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="chapter-number">Chapter Number *</Label>
                        <Input
                          id="chapter-number"
                          type="number"
                          value={chapterForm.chapter_number}
                          onChange={(e) =>
                            setChapterForm({
                              ...chapterForm,
                              chapter_number: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chapter-sequence">Sequence Order</Label>
                        <Input
                          id="chapter-sequence"
                          type="number"
                          value={chapterForm.sequence_order}
                          onChange={(e) =>
                            setChapterForm({
                              ...chapterForm,
                              sequence_order: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="chapter-title">Chapter Title *</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openRephraseModal(
                              chapterForm.title,
                              "chapter",
                              (text) => setChapterForm({ ...chapterForm, title: text })
                            )
                          }
                          disabled={!chapterForm.title}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Rephrase
                        </Button>
                      </div>
                      <Input
                        id="chapter-title"
                        placeholder="e.g., Mechanics"
                        value={chapterForm.title}
                        onChange={(e) =>
                          setChapterForm({ ...chapterForm, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chapter-description">Description</Label>
                      <Textarea
                        id="chapter-description"
                        placeholder="Brief description of the chapter..."
                        rows={3}
                        value={chapterForm.description}
                        onChange={(e) =>
                          setChapterForm({ ...chapterForm, description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddChapterOpen(false);
                        setEditingChapter(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingChapter ? handleUpdateChapter : handleCreateChapter}
                      disabled={
                        !chapterForm.title ||
                        createChapter.isPending ||
                        updateChapter.isPending
                      }
                    >
                      {createChapter.isPending || updateChapter.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : editingChapter ? (
                        "Update Chapter"
                      ) : (
                        "Add Chapter"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : chapters && chapters.length > 0 ? (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  isExpanded={expandedChapters.has(chapter.id)}
                  onToggle={() => toggleChapter(chapter.id)}
                  onEdit={() => {
                    setEditingChapter(chapter);
                    setChapterForm({
                      chapter_number: chapter.chapter_number,
                      title: chapter.title,
                      description: chapter.description || "",
                      sequence_order: chapter.sequence_order,
                    });
                  }}
                  onDelete={() => setDeleteChapterId(chapter.id)}
                  onAddTopic={() => {
                    setSelectedChapter(chapter.id);
                    setIsAddTopicOpen(true);
                  }}
                  onEditTopic={(topic) => {
                    setSelectedChapter(chapter.id);
                    setEditingTopic(topic);
                    setTopicForm({
                      topic_number: topic.topic_number,
                      title: topic.title,
                      estimated_duration_minutes: topic.estimated_duration_minutes || 60,
                      video_url: topic.video_url || "",
                      content_markdown: topic.content_markdown || "",
                      sequence_order: topic.sequence_order,
                    });
                  }}
                  onDeleteTopic={(topicId) => {
                    setSelectedChapter(chapter.id);
                    setDeleteTopicId(topicId);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No chapters added yet</p>
              <p className="text-sm mt-2">Click "Add Chapter" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Topic Dialog */}
      <Dialog
        open={isAddTopicOpen || !!editingTopic}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddTopicOpen(false);
            setEditingTopic(null);
            setTopicForm({
              topic_number: 1,
              title: "",
              estimated_duration_minutes: 60,
              video_url: "",
              content_markdown: "",
              sequence_order: 1,
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Edit Topic" : "Add New Topic"}</DialogTitle>
            <DialogDescription>
              {editingTopic ? "Update topic details" : "Create a new topic for this chapter"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="topic-number">Topic Number *</Label>
                <Input
                  id="topic-number"
                  type="number"
                  value={topicForm.topic_number}
                  onChange={(e) =>
                    setTopicForm({
                      ...topicForm,
                      topic_number: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-duration">Duration (minutes)</Label>
                <Input
                  id="topic-duration"
                  type="number"
                  value={topicForm.estimated_duration_minutes}
                  onChange={(e) =>
                    setTopicForm({
                      ...topicForm,
                      estimated_duration_minutes: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="topic-title">Topic Title *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    openRephraseModal(
                      topicForm.title,
                      "topic",
                      (text) => setTopicForm({ ...topicForm, title: text })
                    )
                  }
                  disabled={!topicForm.title}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Rephrase
                </Button>
              </div>
              <Input
                id="topic-title"
                placeholder="e.g., Newton's Laws"
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-video">Video URL (Optional)</Label>
              <Input
                id="topic-video"
                placeholder="https://youtube.com/..."
                value={topicForm.video_url}
                onChange={(e) => setTopicForm({ ...topicForm, video_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-content">Content (Markdown)</Label>
              <Textarea
                id="topic-content"
                placeholder="# Topic content in markdown..."
                rows={8}
                value={topicForm.content_markdown}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, content_markdown: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTopicOpen(false);
                setEditingTopic(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingTopic ? handleUpdateTopic : handleCreateTopic}
              disabled={
                !topicForm.title || createTopic.isPending || updateTopic.isPending
              }
            >
              {createTopic.isPending || updateTopic.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingTopic ? (
                "Update Topic"
              ) : (
                "Add Topic"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chapter Confirmation */}
      <AlertDialog open={!!deleteChapterId} onOpenChange={() => setDeleteChapterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the chapter and all its topics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChapter}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Topic Confirmation */}
      <AlertDialog open={!!deleteTopicId} onOpenChange={() => setDeleteTopicId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the topic. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTopic}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Rephrase Modal */}
      <AIRephraseModal
        open={rephraseModalOpen}
        onOpenChange={setRephraseModalOpen}
        originalText={rephraseText}
        type={rephraseType}
        onAccept={handleRephraseAccept}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        title="Import Chapters & Topics"
        templateUrl="#"
        onImport={handleExcelImport}
        instructions={[
          "Download the template and fill in chapter and topic details",
          "Each row can contain both chapter and topic information",
          "Topics are grouped by chapter_number",
          "All fields marked with * are required",
          "Save as .xlsx or .xls file before uploading",
        ]}
      />
    </div>
  );
}

// Chapter Item Component with Topics
interface ChapterItemProps {
  chapter: any;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTopic: () => void;
  onEditTopic: (topic: any) => void;
  onDeleteTopic: (topicId: string) => void;
}

function ChapterItem({
  chapter,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
}: ChapterItemProps) {
  const { data: topics } = useChapterTopics(chapter.id);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Chapter {chapter.chapter_number}</Badge>
                    <h3 className="font-semibold">{chapter.title}</h3>
                  </div>
                  {chapter.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {chapter.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Badge variant="secondary">{topics?.length || 0} topics</Badge>
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Topics</h4>
              <Button variant="outline" size="sm" onClick={onAddTopic}>
                <Plus className="h-4 w-4 mr-1" />
                Add Topic
              </Button>
            </div>
            {topics && topics.length > 0 ? (
              <div className="space-y-2">
                {topics.map((topic) => (
                  <Card key={topic.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {topic.topic_number}
                            </Badge>
                            <span className="font-medium">{topic.title}</span>
                          </div>
                          {topic.estimated_duration_minutes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {topic.estimated_duration_minutes} mins
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditTopic(topic)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteTopic(topic.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No topics added yet
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
