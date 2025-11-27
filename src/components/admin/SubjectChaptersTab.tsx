import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Sparkles, Upload, Download, Loader2, GripVertical, List, HelpCircle } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useUpdateChapterOrder,
  useUpdateTopicOrder,
} from "@/hooks/useSubjectManagement";
import { FileUploadWidget } from "./FileUploadWidget";
import { SubjectSubtopicsSection } from "./SubjectSubtopicsSection";
import { VideoPreview } from "./VideoPreview";
import { PDFPreview } from "./PDFPreview";
import { toast } from "@/hooks/use-toast";
import { AIRephraseModal } from "./AIRephraseModal";
import { AIGenerateCurriculumDialog } from "./AIGenerateCurriculumDialog";
import { AIGenerateTopicContentDialog } from "./AIGenerateTopicContentDialog";
import { ChapterBulkOperations } from "./ChapterBulkOperations";
import { CurriculumTreeView } from "./CurriculumTreeView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SubjectChaptersTabProps {
  subjectId: string;
  subjectName: string;
  categoryName?: string;
}

export function SubjectChaptersTab({ subjectId, subjectName, categoryName }: SubjectChaptersTabProps) {
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [showTreeView, setShowTreeView] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [generateContentTopicId, setGenerateContentTopicId] = useState<string | null>(null);
  const [generateContentDialogOpen, setGenerateContentDialogOpen] = useState(false);
  const [currentChapterForContent, setCurrentChapterForContent] = useState<any>(null);
  const [currentTopicForContent, setCurrentTopicForContent] = useState<any>(null);
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
    video_id: "",
    video_platform: "",
    notes_markdown: "",
    pdf_url: "",
  });

  const [topicForm, setTopicForm] = useState({
    topic_number: 1,
    title: "",
    estimated_duration_minutes: 60,
    video_id: "",
    video_platform: "",
    notes_markdown: "",
    content_markdown: "",
    pdf_url: "",
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
  const updateChapterOrder = useUpdateChapterOrder();
  const updateTopicOrder = useUpdateTopicOrder();

  // Fetch all subjects for bulk operations
  const { data: allSubjects } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('popular_subjects')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    // Validation
    if (!chapterForm.title.trim()) {
      console.error("❌ Validation failed: Chapter title is empty");
      toast({
        title: "Validation Error",
        description: "Chapter title is required",
        variant: "destructive",
      });
      return;
    }

    console.log("=== CREATE CHAPTER DEBUG ===");
    console.log("Subject ID:", subjectId);
    console.log("Chapter Form Data:", chapterForm);
    console.log("Current Chapters Count:", chapters?.length);

    // Sanitize video fields - convert empty strings to null
    const sanitizedForm = {
      ...chapterForm,
      video_platform: chapterForm.video_platform || null,
      video_id: chapterForm.video_id || null,
    };

    createChapter.mutate(
      {
        subject_id: subjectId,
        ...sanitizedForm,
      },
      {
        onSuccess: (data) => {
          console.log("✅ Chapter created successfully:", data);
          toast({
            title: "Success",
            description: `Chapter "${chapterForm.title}" created successfully`,
          });
          setIsAddChapterOpen(false);
          setChapterForm({
            chapter_number: (chapters?.length || 0) + 1,
            title: "",
            description: "",
            sequence_order: (chapters?.length || 0) + 1,
            video_id: "",
            video_platform: "",
            notes_markdown: "",
            pdf_url: "",
          });
        },
        onError: (error: any) => {
          console.error("❌ Failed to create chapter:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });

          let errorMessage = error.message || "An unexpected error occurred";
          if (error.code === "23505") {
            errorMessage = `A chapter with number ${chapterForm.chapter_number} already exists for this subject`;
          }

          toast({
            title: "Error Creating Chapter",
            description: errorMessage,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleUpdateChapter = () => {
    if (!editingChapter) return;

    // Sanitize video fields - convert empty strings to null
    const sanitizedForm = {
      ...chapterForm,
      video_platform: chapterForm.video_platform || null,
      video_id: chapterForm.video_id || null,
    };

    updateChapter.mutate(
      {
        id: editingChapter.id,
        updates: sanitizedForm,
      },
      {
        onSuccess: () => {
          setEditingChapter(null);
          setChapterForm({
            chapter_number: 1,
            title: "",
            description: "",
            sequence_order: 1,
            video_id: "",
            video_platform: "",
            notes_markdown: "",
            pdf_url: "",
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
    if (!selectedChapter) {
      console.error("❌ No chapter selected for topic creation");
      toast({
        title: "Error",
        description: "No chapter selected. Please select a chapter first.",
        variant: "destructive",
      });
      return;
    }

    if (!topicForm.title.trim()) {
      console.error("❌ Validation failed: Topic title is empty");
      toast({
        title: "Validation Error",
        description: "Topic title is required",
        variant: "destructive",
      });
      return;
    }

    console.log("=== CREATE TOPIC DEBUG ===");
    console.log("Chapter ID:", selectedChapter);
    console.log("Topic Form Data:", topicForm);

    // Sanitize video fields - convert empty strings to null
    const sanitizedTopicForm = {
      ...topicForm,
      video_platform: topicForm.video_platform || null,
      video_id: topicForm.video_id || null,
    };

    createTopic.mutate(
      {
        chapter_id: selectedChapter,
        ...sanitizedTopicForm,
      },
      {
        onSuccess: (data) => {
          console.log("✅ Topic created successfully:", data);
          toast({
            title: "Success",
            description: `Topic "${topicForm.title}" created successfully`,
          });
          setIsAddTopicOpen(false);
          setTopicForm({
            topic_number: 1,
            title: "",
            estimated_duration_minutes: 60,
            video_id: "",
            video_platform: "",
            notes_markdown: "",
            content_markdown: "",
            pdf_url: "",
            sequence_order: 1,
          });
        },
        onError: (error: any) => {
          console.error("❌ Failed to create topic:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });

          let errorMessage = error.message || "An unexpected error occurred";
          if (error.code === "23505") {
            errorMessage = `A topic with number ${topicForm.topic_number} already exists in this chapter`;
          }

          toast({
            title: "Error Creating Topic",
            description: errorMessage,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleUpdateTopic = () => {
    if (!editingTopic) return;

    // Sanitize video fields - convert empty strings to null
    const sanitizedTopicForm = {
      ...topicForm,
      video_platform: topicForm.video_platform || null,
      video_id: topicForm.video_id || null,
    };

    updateTopic.mutate(
      {
        id: editingTopic.id,
        updates: sanitizedTopicForm,
      },
      {
        onSuccess: () => {
          setEditingTopic(null);
          setTopicForm({
            topic_number: 1,
            title: "",
            estimated_duration_minutes: 60,
            video_id: "",
            video_platform: "",
            notes_markdown: "",
            content_markdown: "",
            pdf_url: "",
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

    // Parse Excel data into chapters with topics and subtopics
    const chaptersMap = new Map<number, any>();
    const topicsMap = new Map<string, any>();

    jsonData.forEach((row) => {
      const chapterNum = parseInt(row.chapter_number);
      const topicNum = row.topic_number ? parseInt(row.topic_number) : null;
      const subtopicOrder = row.subtopic_order ? parseInt(row.subtopic_order) : null;

      // Create chapter if doesn't exist
      if (!chaptersMap.has(chapterNum)) {
        chaptersMap.set(chapterNum, {
          chapter_number: chapterNum,
          title: row.chapter_title,
          description: row.chapter_description || "",
          topics: [],
        });
      }

      // If topic exists, add/update it
      if (topicNum && row.topic_title) {
        const topicKey = `${chapterNum}-${topicNum}`;
        
        if (!topicsMap.has(topicKey)) {
          topicsMap.set(topicKey, {
            topic_number: topicNum,
            title: row.topic_title,
            estimated_duration_minutes: parseInt(row.topic_duration_minutes) || 60,
            content_markdown: row.topic_content || "",
            subtopics: [],
          });
          chaptersMap.get(chapterNum)?.topics.push(topicsMap.get(topicKey));
        }

        // If subtopic exists, add it
        if (subtopicOrder && row.subtopic_title) {
          topicsMap.get(topicKey)?.subtopics.push({
            title: row.subtopic_title,
            description: row.subtopic_description || "",
            estimated_duration_minutes: parseInt(row.subtopic_duration_minutes) || 30,
            sequence_order: subtopicOrder,
          });
        }
      }
    });

    const chaptersArray = Array.from(chaptersMap.values());

    const result = await bulkImport.mutateAsync({
      subjectId,
      chapters: chaptersArray,
    });

    return {
      success: result.chapters + result.topics + result.subtopics,
      errors: result.errors,
    };
  };

  const downloadTemplate = () => {
    const template = [
      // Chapter 1 - Only chapter info
      {
        chapter_number: 1,
        chapter_title: "Introduction to Physics",
        chapter_description: "Basic concepts and principles of physics",
        topic_number: "",
        topic_title: "",
        topic_duration_minutes: "",
        topic_content: "",
        subtopic_order: "",
        subtopic_title: "",
        subtopic_description: "",
        subtopic_duration_minutes: "",
      },
      // Chapter 1 - With topic
      {
        chapter_number: 1,
        chapter_title: "Introduction to Physics",
        chapter_description: "Basic concepts and principles of physics",
        topic_number: 1,
        topic_title: "Newton's Laws of Motion",
        topic_duration_minutes: 120,
        topic_content: "# Newton's Laws\nStudy of motion and forces",
        subtopic_order: "",
        subtopic_title: "",
        subtopic_description: "",
        subtopic_duration_minutes: "",
      },
      // Chapter 1, Topic 1 - With subtopics
      {
        chapter_number: 1,
        chapter_title: "Introduction to Physics",
        chapter_description: "Basic concepts and principles of physics",
        topic_number: 1,
        topic_title: "Newton's Laws of Motion",
        topic_duration_minutes: 120,
        topic_content: "# Newton's Laws\nStudy of motion and forces",
        subtopic_order: 1,
        subtopic_title: "Newton's First Law (Inertia)",
        subtopic_description: "An object at rest stays at rest",
        subtopic_duration_minutes: 45,
      },
      {
        chapter_number: 1,
        chapter_title: "Introduction to Physics",
        chapter_description: "Basic concepts and principles of physics",
        topic_number: 1,
        topic_title: "Newton's Laws of Motion",
        topic_duration_minutes: 120,
        topic_content: "# Newton's Laws\nStudy of motion and forces",
        subtopic_order: 2,
        subtopic_title: "Newton's Second Law (F=ma)",
        subtopic_description: "Force equals mass times acceleration",
        subtopic_duration_minutes: 45,
      },
      {
        chapter_number: 1,
        chapter_title: "Introduction to Physics",
        chapter_description: "Basic concepts and principles of physics",
        topic_number: 1,
        topic_title: "Newton's Laws of Motion",
        topic_duration_minutes: 120,
        topic_content: "# Newton's Laws\nStudy of motion and forces",
        subtopic_order: 3,
        subtopic_title: "Newton's Third Law (Action-Reaction)",
        subtopic_description: "Every action has equal opposite reaction",
        subtopic_duration_minutes: 30,
      },
      // Chapter 1, Topic 2
      {
        chapter_number: 1,
        chapter_title: "Introduction to Physics",
        chapter_description: "Basic concepts and principles of physics",
        topic_number: 2,
        topic_title: "Kinematics",
        topic_duration_minutes: 90,
        topic_content: "# Kinematics\nStudy of motion without forces",
        subtopic_order: 1,
        subtopic_title: "Displacement and Velocity",
        subtopic_description: "Understanding motion parameters",
        subtopic_duration_minutes: 45,
      },
      {
        chapter_number: 1,
        chapter_title: "Introduction to Physics",
        chapter_description: "Basic concepts and principles of physics",
        topic_number: 2,
        topic_title: "Kinematics",
        topic_duration_minutes: 90,
        topic_content: "# Kinematics\nStudy of motion without forces",
        subtopic_order: 2,
        subtopic_title: "Acceleration and Equations",
        subtopic_description: "Equations of motion",
        subtopic_duration_minutes: 45,
      },
      // Chapter 2
      {
        chapter_number: 2,
        chapter_title: "Thermodynamics",
        chapter_description: "Study of heat and energy transfer",
        topic_number: "",
        topic_title: "",
        topic_duration_minutes: "",
        topic_content: "",
        subtopic_order: "",
        subtopic_title: "",
        subtopic_description: "",
        subtopic_duration_minutes: "",
      },
      {
        chapter_number: 2,
        chapter_title: "Thermodynamics",
        chapter_description: "Study of heat and energy transfer",
        topic_number: 1,
        topic_title: "Laws of Thermodynamics",
        topic_duration_minutes: 120,
        topic_content: "# Thermodynamic Laws\nFundamental principles",
        subtopic_order: 1,
        subtopic_title: "Zeroth Law",
        subtopic_description: "Thermal equilibrium",
        subtopic_duration_minutes: 30,
      },
      {
        chapter_number: 2,
        chapter_title: "Thermodynamics",
        chapter_description: "Study of heat and energy transfer",
        topic_number: 1,
        topic_title: "Laws of Thermodynamics",
        topic_duration_minutes: 120,
        topic_content: "# Thermodynamic Laws\nFundamental principles",
        subtopic_order: 2,
        subtopic_title: "First Law (Energy Conservation)",
        subtopic_description: "Energy cannot be created or destroyed",
        subtopic_duration_minutes: 45,
      },
      {
        chapter_number: 2,
        chapter_title: "Thermodynamics",
        chapter_description: "Study of heat and energy transfer",
        topic_number: 1,
        topic_title: "Laws of Thermodynamics",
        topic_duration_minutes: 120,
        topic_content: "# Thermodynamic Laws\nFundamental principles",
        subtopic_order: 3,
        subtopic_title: "Second Law (Entropy)",
        subtopic_description: "Entropy always increases",
        subtopic_duration_minutes: 45,
      },
      // Chapter 3
      {
        chapter_number: 3,
        chapter_title: "Waves and Oscillations",
        chapter_description: "Periodic motion and wave phenomena",
        topic_number: "",
        topic_title: "",
        topic_duration_minutes: "",
        topic_content: "",
        subtopic_order: "",
        subtopic_title: "",
        subtopic_description: "",
        subtopic_duration_minutes: "",
      },
      {
        chapter_number: 3,
        chapter_title: "Waves and Oscillations",
        chapter_description: "Periodic motion and wave phenomena",
        topic_number: 1,
        topic_title: "Simple Harmonic Motion",
        topic_duration_minutes: 100,
        topic_content: "# SHM\nPeriodic oscillatory motion",
        subtopic_order: 1,
        subtopic_title: "Characteristics of SHM",
        subtopic_description: "Amplitude, frequency, period",
        subtopic_duration_minutes: 50,
      },
      {
        chapter_number: 3,
        chapter_title: "Waves and Oscillations",
        chapter_description: "Periodic motion and wave phenomena",
        topic_number: 1,
        topic_title: "Simple Harmonic Motion",
        topic_duration_minutes: 100,
        topic_content: "# SHM\nPeriodic oscillatory motion",
        subtopic_order: 2,
        subtopic_title: "Energy in SHM",
        subtopic_description: "Kinetic and potential energy",
        subtopic_duration_minutes: 50,
      },
      {
        chapter_number: 3,
        chapter_title: "Waves and Oscillations",
        chapter_description: "Periodic motion and wave phenomena",
        topic_number: 2,
        topic_title: "Wave Motion",
        topic_duration_minutes: 120,
        topic_content: "# Waves\nEnergy transfer through medium",
        subtopic_order: 1,
        subtopic_title: "Transverse and Longitudinal Waves",
        subtopic_description: "Types of mechanical waves",
        subtopic_duration_minutes: 60,
      },
      {
        chapter_number: 3,
        chapter_title: "Waves and Oscillations",
        chapter_description: "Periodic motion and wave phenomena",
        topic_number: 2,
        topic_title: "Wave Motion",
        topic_duration_minutes: 120,
        topic_content: "# Waves\nEnergy transfer through medium",
        subtopic_order: 2,
        subtopic_title: "Wave Equation and Properties",
        subtopic_description: "Mathematical representation",
        subtopic_duration_minutes: 60,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // chapter_number
      { wch: 30 }, // chapter_title
      { wch: 40 }, // chapter_description
      { wch: 15 }, // topic_number
      { wch: 30 }, // topic_title
      { wch: 25 }, // topic_duration_minutes
      { wch: 40 }, // topic_content
      { wch: 15 }, // subtopic_order
      { wch: 35 }, // subtopic_title
      { wch: 40 }, // subtopic_description
      { wch: 25 }, // subtopic_duration_minutes
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chapters");
    XLSX.writeFile(wb, `${subjectName}_chapters_template.xlsx`);
    
    toast({
      title: "Template Downloaded",
      description: "Excel template with 3 complete chapter examples downloaded",
    });
  };

  const handleDragEndChapters = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !chapters) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);

    const reorderedChapters = arrayMove(chapters, oldIndex, newIndex);
    const updates = reorderedChapters.map((chapter, index) => ({
      id: chapter.id,
      sequence_order: index + 1,
    }));

    updateChapterOrder.mutate({ chapters: updates });
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
            <div className="flex gap-2 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTreeView(!showTreeView)}
                    >
                      <List className="mr-2 h-4 w-4" />
                      {showTreeView ? "Table View" : "Tree View"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle between table and tree view of curriculum</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={downloadTemplate}>
                      <Download className="mr-2 h-4 w-4" />
                      Template
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2 text-xs">
                      <p className="font-semibold">Excel Import Instructions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Download the template with 3 example chapters</li>
                        <li>Fill chapter_number, chapter_title, chapter_description</li>
                        <li>Add topic_number, topic_title for each topic</li>
                        <li>Add subtopic_order, subtopic_title for subtopics</li>
                        <li>Duplicate chapters will be skipped automatically</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => setIsExcelImportOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Bulk Import
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Import chapters from Excel file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="default"
                onClick={() => setIsAIGenerateOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Generate
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
                      video_id: "",
                      video_platform: "",
                      notes_markdown: "",
                      pdf_url: "",
                    });
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setIsAddChapterOpen(true)}>
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

                    {/* Video Upload Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">Media & Resources</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-sm">
                              <div className="space-y-2 text-xs">
                                <p className="font-semibold">How to find Video IDs:</p>
                                <div>
                                  <p className="font-medium">YouTube:</p>
                                  <p>• From URL: youtube.com/watch?v=<span className="font-mono bg-muted px-1">VIDEO_ID</span></p>
                                  <p>• Example: dQw4w9WgXcQ</p>
                                </div>
                                <div>
                                  <p className="font-medium">Vimeo:</p>
                                  <p>• From URL: vimeo.com/<span className="font-mono bg-muted px-1">VIDEO_ID</span></p>
                                  <p>• Example: 123456789</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Video Platform</Label>
                          <Select
                            value={chapterForm.video_platform}
                            onValueChange={(value) =>
                              setChapterForm({ ...chapterForm, video_platform: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="youtube">YouTube</SelectItem>
                              <SelectItem value="vimeo">Vimeo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label>Video ID</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  <p>Enter the video ID from the URL</p>
                                  <p className="text-muted-foreground mt-1">YouTube: dQw4w9WgXcQ | Vimeo: 123456789</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g., dQw4w9WgXcQ"
                              value={chapterForm.video_id}
                              onChange={(e) =>
                                setChapterForm({ ...chapterForm, video_id: e.target.value })
                              }
                            />
                            {chapterForm.video_id && chapterForm.video_platform && (
                              <VideoPreview 
                                platform={chapterForm.video_platform} 
                                videoId={chapterForm.video_id} 
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>PDF Document</Label>
                        <FileUploadWidget
                          bucket="chapter-pdfs"
                          currentFileUrl={chapterForm.pdf_url}
                          onFileUploaded={(url) =>
                            setChapterForm({ ...chapterForm, pdf_url: url })
                          }
                          label="Upload Chapter PDF"
                        />
                        {chapterForm.pdf_url && (
                          <PDFPreview 
                            pdfUrl={chapterForm.pdf_url} 
                            fileName={`${chapterForm.title || 'Chapter'}.pdf`}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Notes (Markdown)</Label>
                        <Textarea
                          placeholder="# Chapter notes in markdown format..."
                          rows={4}
                          value={chapterForm.notes_markdown}
                          onChange={(e) =>
                            setChapterForm({ ...chapterForm, notes_markdown: e.target.value })
                          }
                        />
                      </div>
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
          {/* Bulk Operations Bar */}
          {chapters && chapters.length > 0 && !showTreeView && (
            <div className="mb-4">
              <ChapterBulkOperations
                subjectId={subjectId}
                chapters={chapters}
                subjects={allSubjects || []}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : showTreeView ? (
            <CurriculumTreeView subjectId={subjectId} subjectName={subjectName} />
          ) : chapters && chapters.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndChapters}
            >
              <SortableContext
                items={chapters.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {chapters.map((chapter) => (
                    <SortableChapterItem
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
                      video_id: chapter.video_id || "",
                      video_platform: chapter.video_platform || "",
                      notes_markdown: chapter.notes_markdown || "",
                      pdf_url: chapter.pdf_url || "",
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
                      video_id: topic.video_id || "",
                      video_platform: topic.video_platform || "",
                      notes_markdown: topic.notes_markdown || "",
                      content_markdown: topic.content_markdown || "",
                      pdf_url: topic.pdf_url || "",
                      sequence_order: topic.sequence_order,
                    });
                  }}
                  onDeleteTopic={(topicId) => {
                    setSelectedChapter(chapter.id);
                    setDeleteTopicId(topicId);
                  }}
                  onGenerateContent={(topicId, topicData, chapterData) => {
                    setGenerateContentTopicId(topicId);
                    setCurrentChapterForContent(chapterData);
                    setCurrentTopicForContent(topicData);
                    setGenerateContentDialogOpen(true);
                  }}
                />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
              video_id: "",
              video_platform: "",
              notes_markdown: "",
              content_markdown: "",
              pdf_url: "",
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
              <Label htmlFor="topic-video-platform">Video Platform</Label>
              <Select
                value={topicForm.video_platform}
                onValueChange={(value) =>
                  setTopicForm({ ...topicForm, video_platform: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="topic-video">Video ID</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p>Enter the video ID from the URL</p>
                      <p className="text-muted-foreground mt-1">YouTube: dQw4w9WgXcQ | Vimeo: 123456789</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Input
                  id="topic-video"
                  placeholder="e.g., dQw4w9WgXcQ"
                  value={topicForm.video_id}
                  onChange={(e) => setTopicForm({ ...topicForm, video_id: e.target.value })}
                />
                {topicForm.video_id && topicForm.video_platform && (
                  <VideoPreview 
                    platform={topicForm.video_platform} 
                    videoId={topicForm.video_id} 
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-notes">Notes (Markdown)</Label>
              <Textarea
                id="topic-notes"
                placeholder="# Notes for students..."
                rows={3}
                value={topicForm.notes_markdown}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, notes_markdown: e.target.value })
                }
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

            {/* PDF Upload for Topics */}
            <div className="space-y-2">
              <Label>Topic PDF Document</Label>
              <FileUploadWidget
                bucket="chapter-pdfs"
                currentFileUrl={topicForm.pdf_url}
                onFileUploaded={(url) =>
                  setTopicForm({ ...topicForm, pdf_url: url })
                }
                label="Upload Topic PDF"
              />
              {topicForm.pdf_url && (
                <PDFPreview 
                  pdfUrl={topicForm.pdf_url} 
                  fileName={`${topicForm.title || 'Topic'}.pdf`}
                />
              )}
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
      <Dialog open={isExcelImportOpen} onOpenChange={setIsExcelImportOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Chapters, Topics & Subtopics
            </DialogTitle>
            <DialogDescription>
              Upload an Excel file with chapter, topic, and subtopic structure. Existing chapters will be skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Excel Format Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Chapter only:</strong> Fill chapter_number, chapter_title, chapter_description. Leave topic fields empty.</li>
                  <li><strong>Chapter with Topic:</strong> Repeat chapter info + fill topic_number, topic_title, topic_duration_minutes.</li>
                  <li><strong>Topic with Subtopic:</strong> Repeat chapter & topic info + fill subtopic_order, subtopic_title, subtopic_description.</li>
                  <li>Chapters with duplicate chapter_number will be skipped automatically.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Download Template Button */}
            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Excel Template with Examples
            </Button>

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="chapters-excel">Upload Excel File (.xlsx)</Label>
              <Input
                id="chapters-excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      await handleExcelImport(file);
                      setIsExcelImportOpen(false);
                    } catch (error) {
                      console.error("Import error:", error);
                    }
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExcelImportOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Curriculum Dialog */}
      <AIGenerateCurriculumDialog
        open={isAIGenerateOpen}
        onOpenChange={setIsAIGenerateOpen}
        subjectId={subjectId}
        subjectName={subjectName}
        categoryName={categoryName}
      />

      {/* AI Generate Topic Content Dialog */}
      <AIGenerateTopicContentDialog
        open={generateContentDialogOpen}
        onOpenChange={setGenerateContentDialogOpen}
        topicId={generateContentTopicId}
        topicData={currentTopicForContent}
        chapterTitle={currentChapterForContent?.title || ""}
        chapterDescription={currentChapterForContent?.description}
        subjectName={subjectName}
        categoryName={categoryName || ""}
      />
    </div>
  );
}

// Sortable Chapter Item Wrapper
interface SortableChapterItemProps extends ChapterItemProps {
  chapter: any;
}

function SortableChapterItem(props: SortableChapterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ChapterItem {...props} dragHandleProps={{ attributes, listeners }} />
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
  onGenerateContent: (topicId: string, topicData: any, chapterData: any) => void;
  dragHandleProps?: any;
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
  onGenerateContent,
  dragHandleProps,
}: ChapterItemProps) {
  const { data: topics } = useChapterTopics(chapter.id);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  {...dragHandleProps?.attributes}
                  {...dragHandleProps?.listeners}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
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
                          <div className="flex gap-2 mt-2">
                            {topic.video_id && (
                              <Badge variant="secondary" className="text-xs">
                                Video: {topic.video_platform}
                              </Badge>
                            )}
                            {topic.pdf_url && (
                              <Badge variant="secondary" className="text-xs">
                                Has PDF
                              </Badge>
                            )}
                           {topic.notes_markdown && (
                              <Badge variant="secondary" className="text-xs">
                                Has Notes
                              </Badge>
                            )}
                            {topic.content_markdown && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI Content
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onGenerateContent(topic.id, topic, chapter)}
                                  className="text-purple-600 hover:text-purple-700"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Generate Content
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Use AI to create detailed learning content, examples, and practice questions</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                      
                      {/* Subtopics Section */}
                      <SubjectSubtopicsSection
                        topicId={topic.id}
                        topicTitle={topic.title}
                      />
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
