import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FileText, Loader2, CheckCircle, AlertCircle, Brain } from "lucide-react";
import { PDFPreview } from "./PDFPreview";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePreviousYearPapers,
  useCreatePreviousYearPaper,
  useDeletePreviousYearPaper,
  useUploadPaperPDF,
} from "@/hooks/usePreviousYearPapers";
import {
  useSubjectChapters,
  useChapterTopics,
} from "@/hooks/useSubjectChaptersTopics";
import {
  useBulkInsertPreviousYearQuestions,
  type ExtractedQuestion,
} from "@/hooks/usePreviousYearQuestions";
import { useDatalab } from "@/hooks/useDatalab";
import { useExtractQuestionsAI } from "@/hooks/useExtractQuestionsAI";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface SubjectPreviousYearTabProps {
  subjectId: string;
  subjectName: string;
}

type Step = "form" | "parsing" | "extracting" | "preview" | "saving";

export function SubjectPreviousYearTab({ subjectId, subjectName }: SubjectPreviousYearTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("form");
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    exam_name: "",
    paper_type: "",
    total_questions: 0,
    chapter_id: "",
    topic_id: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [extractionMeta, setExtractionMeta] = useState<
    | {
        partial?: boolean;
        error?: string;
        errorCode?: string;
        errors?: string[];
        chunksProcessed?: number;
      }
    | null
  >(null);

  const { data: papers, isLoading } = usePreviousYearPapers(subjectId);
  const { data: chapters } = useSubjectChapters(subjectId);
  const { data: topics } = useChapterTopics(formData.chapter_id || undefined);
  
  const createPaper = useCreatePreviousYearPaper();
  const deletePaper = useDeletePreviousYearPaper();
  const uploadPDF = useUploadPaperPDF();
  const bulkInsertQuestions = useBulkInsertPreviousYearQuestions();
  const { parsePdfFile, isLoading: isParsing, progress: parseProgress } = useDatalab();
  const extractQuestionsAI = useExtractQuestionsAI();

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      exam_name: "",
      paper_type: "",
      total_questions: 0,
      chapter_id: "",
      topic_id: "",
    });
    setSelectedFile(null);
    setExtractedQuestions([]);
    setParsedJson(null);
    setExtractionMeta(null);
    setCurrentStep("form");
  };

  const handleParsePDF = async () => {
    if (!selectedFile) return;

    try {
      // Step 1: Parse PDF with Datalab
      setCurrentStep("parsing");
      const result = await parsePdfFile(selectedFile);

      if (!result || !result.success) {
        setCurrentStep("form");
        return;
      }

      setParsedJson(result.content_json);

      // Step 2: Extract questions using AI
      setExtractionMeta(null);
      setExtractedQuestions([]);
      setCurrentStep("extracting");

      try {
        const aiResult = await extractQuestionsAI.mutateAsync({
          contentJson: result.content_json,
          contentMarkdown: result.content_markdown, // Pass markdown for better extraction
          examName: formData.exam_name,
          year: formData.year,
          paperType: formData.paper_type,
        });

        setExtractionMeta({
          partial: aiResult.partial,
          error: aiResult.error,
          errorCode: aiResult.errorCode,
          errors: aiResult.errors,
          chunksProcessed: aiResult.chunksProcessed,
        });

        if (aiResult.questions && aiResult.questions.length > 0) {
          setExtractedQuestions(aiResult.questions);
          setFormData((prev) => ({ ...prev, total_questions: aiResult.questionsCount }));
        }

        setCurrentStep("preview");
      } catch (aiError) {
        console.error("AI extraction failed:", aiError);
        setExtractionMeta({
          error: aiError instanceof Error ? aiError.message : "AI extraction failed",
          errorCode: "CLIENT_ERROR",
        });
        setCurrentStep("preview");
      }
    } catch (error) {
      console.error("Error in PDF parsing/extraction:", error);
      setCurrentStep("form");
    }
  };

  const handleSubmit = async () => {
    if (!formData.chapter_id || !formData.topic_id) {
      return;
    }

    setCurrentStep("saving");
    let pdfUrl: string | undefined;

    try {
      // Upload PDF if selected
      if (selectedFile) {
        const tempId = `temp-${Date.now()}`;
        pdfUrl = await uploadPDF.mutateAsync({ file: selectedFile, paperId: tempId });
      }

      // Create the paper record
      const paper = await createPaper.mutateAsync({
        subject_id: subjectId,
        year: formData.year,
        exam_name: formData.exam_name,
        paper_type: formData.paper_type || undefined,
        pdf_url: pdfUrl,
        total_questions: extractedQuestions.length || formData.total_questions,
      });

      // If we have extracted questions, save them
      if (extractedQuestions.length > 0 && paper) {
        await bulkInsertQuestions.mutateAsync({
          questions: extractedQuestions,
          paperId: paper.id,
          topicId: formData.topic_id,
          subjectId,
          chapterId: formData.chapter_id,
        });
      }

      setIsAddOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving paper:", error);
      setCurrentStep("preview");
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deletePaper.mutate(
        { id: deleteId, subjectId },
        {
          onSuccess: () => setDeleteId(null),
        }
      );
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsAddOpen(open);
  };

  const getSelectedChapterName = () => {
    const chapter = chapters?.find((c) => c.id === formData.chapter_id);
    return chapter ? `Ch ${chapter.chapter_number}: ${chapter.title}` : "";
  };

  const getSelectedTopicName = () => {
    const topic = topics?.find((t) => t.id === formData.topic_id);
    return topic ? `Topic ${topic.topic_number}: ${topic.title}` : "";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Previous Year Papers</CardTitle>
              <CardDescription>
                Manage previous year examination papers for {subjectName}
              </CardDescription>
            </div>
            <Dialog open={isAddOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Paper
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Add Previous Year Paper</DialogTitle>
                  <DialogDescription>
                    Add a new previous year examination paper and extract questions
                  </DialogDescription>
                </DialogHeader>

                {currentStep === "form" && (
                  <div className="space-y-4 py-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year">Year *</Label>
                        <Input
                          id="year"
                          type="number"
                          value={formData.year}
                          onChange={(e) =>
                            setFormData({ ...formData, year: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exam-name">Exam Name *</Label>
                        <Input
                          id="exam-name"
                          placeholder="e.g., NEET, JEE Mains"
                          value={formData.exam_name}
                          onChange={(e) =>
                            setFormData({ ...formData, exam_name: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paper-type">Paper Type</Label>
                      <Input
                        id="paper-type"
                        placeholder="e.g., Phase 1, Main, Advanced"
                        value={formData.paper_type}
                        onChange={(e) =>
                          setFormData({ ...formData, paper_type: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Chapter *</Label>
                        <Select
                          value={formData.chapter_id}
                          onValueChange={(value) =>
                            setFormData({ ...formData, chapter_id: value, topic_id: "" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select chapter" />
                          </SelectTrigger>
                          <SelectContent>
                            {chapters?.map((chapter) => (
                              <SelectItem key={chapter.id} value={chapter.id}>
                                Ch {chapter.chapter_number}: {chapter.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Topic *</Label>
                        <Select
                          value={formData.topic_id}
                          onValueChange={(value) =>
                            setFormData({ ...formData, topic_id: value })
                          }
                          disabled={!formData.chapter_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {topics?.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id}>
                                Topic {topic.topic_number}: {topic.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pdf-upload">Upload PDF *</Label>
                      <Input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      {selectedFile && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Selected: {selectedFile.name}
                          </p>
                          <PDFPreview
                            pdfUrl={URL.createObjectURL(selectedFile)}
                            fileName={selectedFile.name}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === "parsing" && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium">Parsing PDF...</p>
                    <p className="text-sm text-muted-foreground">{parseProgress}</p>
                    <Progress value={50} className="w-64" />
                  </div>
                )}

                {currentStep === "extracting" && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Brain className="h-12 w-12 animate-pulse text-primary" />
                    <p className="text-lg font-medium">Extracting Questions with AI...</p>
                    <p className="text-sm text-muted-foreground">
                      Gemini is identifying questions, options, and correct answers
                    </p>
                    <Progress value={75} className="w-64" />
                  </div>
                )}

                {currentStep === "preview" && (
                  <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      {extractedQuestions.length > 0 ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-medium">
                        Extracted {extractedQuestions.length} questions
                      </span>
                      {extractionMeta?.partial && (
                        <Badge variant="outline">Partial</Badge>
                      )}
                      {extractionMeta?.chunksProcessed && (
                        <Badge variant="secondary">AI pass</Badge>
                      )}
                    </div>
                    {extractionMeta?.error && (
                      <p className="text-sm text-muted-foreground">
                        {extractionMeta.error}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Chapter:</span>{" "}
                        {getSelectedChapterName()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Topic:</span>{" "}
                        {getSelectedTopicName()}
                      </div>
                    </div>

                    <ScrollArea className="h-[400px] border rounded-md p-4">
                      <div className="space-y-4">
                        {extractedQuestions.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>No questions could be extracted from the PDF.</p>
                            <p className="text-sm">
                              The paper will still be saved for reference.
                            </p>
                          </div>
                        ) : (
                          extractedQuestions.map((q, index) => (
                            <div key={index} className="border-b pb-3 last:border-0">
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0">
                                  Q{q.question_number || index + 1}
                                </Badge>
                                <div className="flex-1">
                                  <p className="text-sm line-clamp-2">
                                    {q.question_text}
                                  </p>
                                  {Object.keys(q.options).length > 0 && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      {Object.entries(q.options).map(([key, val]) => (
                                        <span key={key} className="mr-2">
                                          {key}: {val.text.substring(0, 30)}
                                          {val.text.length > 30 ? "..." : ""}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="mt-1 flex gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {q.difficulty}
                                    </Badge>
                                    {q.correct_answer && (
                                      <Badge variant="outline" className="text-xs">
                                        Ans: {q.correct_answer}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {currentStep === "saving" && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium">Saving paper and questions...</p>
                  </div>
                )}

                <DialogFooter className="mt-4">
                  {currentStep === "form" && (
                    <>
                      <Button variant="outline" onClick={() => handleDialogClose(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleParsePDF}
                        disabled={
                          !formData.exam_name ||
                          !formData.chapter_id ||
                          !formData.topic_id ||
                          !selectedFile ||
                          isParsing
                        }
                      >
                        Parse PDF & Extract Questions
                      </Button>
                    </>
                  )}

                  {currentStep === "preview" && (
                    <>
                      <Button variant="outline" onClick={() => setCurrentStep("form")}>
                        Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={createPaper.isPending || bulkInsertQuestions.isPending}
                      >
                        {createPaper.isPending || bulkInsertQuestions.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          `Save Paper & ${extractedQuestions.length} Questions`
                        )}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : papers && papers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Paper Type</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell className="font-medium">{paper.year}</TableCell>
                    <TableCell>{paper.exam_name}</TableCell>
                    <TableCell>
                      {paper.paper_type ? (
                        <Badge variant="outline">{paper.paper_type}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{paper.total_questions || 0}</TableCell>
                    <TableCell>
                      {paper.pdf_url ? (
                        <a
                          href={paper.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(paper.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No previous year papers added yet</p>
              <p className="text-sm mt-2">Click "Add Paper" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Previous Year Paper?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the paper record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
