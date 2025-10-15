import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Brain, Sparkles, Trash2, Edit, Loader2, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useSubjectQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useUploadQuestionImage,
  useBulkImportQuestions,
} from "@/hooks/useSubjectQuestions";
import { useSubjectChapters, useChapterTopics } from "@/hooks/useSubjectManagement";
import { AIRephraseModal } from "./AIRephraseModal";
import { ExcelImportModal } from "./ExcelImportModal";
import { FormulaEditor } from "./FormulaEditor";
import { ImageUploadWidget } from "./ImageUploadWidget";
import * as XLSX from "xlsx";

interface SubjectQuestionsTabProps {
  subjectId: string;
  subjectName: string;
}

export function SubjectQuestionsTab({ subjectId, subjectName }: SubjectQuestionsTabProps) {
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterVerified, setFilterVerified] = useState<string>("all");

  // AI Rephrase states
  const [rephraseModalOpen, setRephraseModalOpen] = useState(false);
  const [rephraseText, setRephraseText] = useState("");
  const [rephraseType, setRephraseType] = useState<"question" | "answer" | "explanation">("question");
  const [rephraseCallback, setRephraseCallback] = useState<((text: string) => void) | null>(null);

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    chapter_id: "",
    topic_id: "",
    question_text: "",
    question_format: "single_choice",
    difficulty: "medium",
    options: {} as Record<string, any>,
    correct_answer: "",
    explanation: "",
    marks: 1,
    contains_formula: false,
    formula_type: "plain" as "plain" | "latex" | "accounting",
    question_image_url: "",
    option_images: {} as Record<string, string>,
  });

  const { data: chapters } = useSubjectChapters(subjectId);
  const { data: topics } = useChapterTopics(questionForm.chapter_id);
  
  const filters = {
    subjectId,
    difficulty: filterDifficulty !== "all" ? filterDifficulty : undefined,
    isVerified: filterVerified === "verified" ? true : filterVerified === "pending" ? false : undefined,
  };

  const { data: questions, isLoading } = useSubjectQuestions(filters);
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const uploadImage = useUploadQuestionImage();
  const bulkImport = useBulkImportQuestions();

  const resetForm = () => {
    setQuestionForm({
      chapter_id: "",
      topic_id: "",
      question_text: "",
      question_format: "single_choice",
      difficulty: "medium",
      options: {},
      correct_answer: "",
      explanation: "",
      marks: 1,
      contains_formula: false,
      formula_type: "plain",
      question_image_url: "",
      option_images: {},
    });
  };

  const handleCreateQuestion = () => {
    const questionData: any = {
      topic_id: questionForm.topic_id || undefined,
      question_text: questionForm.question_text,
      question_type: questionForm.question_format,
      question_format: questionForm.question_format,
      options: questionForm.options,
      correct_answer: questionForm.correct_answer,
      explanation: questionForm.explanation,
      marks: questionForm.marks,
      difficulty: questionForm.difficulty,
      is_verified: false,
      is_ai_generated: false,
      contains_formula: questionForm.contains_formula,
      formula_type: questionForm.contains_formula ? questionForm.formula_type : undefined,
      question_image_url: questionForm.question_image_url || undefined,
      option_images: Object.keys(questionForm.option_images).length > 0 ? questionForm.option_images : undefined,
    };

    createQuestion.mutate(questionData, {
      onSuccess: () => {
        setIsAddManualOpen(false);
        resetForm();
      },
    });
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion) return;
    
    const updates: any = {
      question_text: questionForm.question_text,
      question_format: questionForm.question_format,
      options: questionForm.options,
      correct_answer: questionForm.correct_answer,
      explanation: questionForm.explanation,
      marks: questionForm.marks,
      difficulty: questionForm.difficulty,
      contains_formula: questionForm.contains_formula,
      formula_type: questionForm.contains_formula ? questionForm.formula_type : undefined,
      question_image_url: questionForm.question_image_url || undefined,
      option_images: Object.keys(questionForm.option_images).length > 0 ? questionForm.option_images : undefined,
    };

    updateQuestion.mutate(
      { id: editingQuestion.id, updates },
      {
        onSuccess: () => {
          setEditingQuestion(null);
          resetForm();
        },
      }
    );
  };

  const handleDeleteQuestion = () => {
    if (!deleteQuestionId) return;
    deleteQuestion.mutate(deleteQuestionId, {
      onSuccess: () => setDeleteQuestionId(null),
    });
  };

  const openRephraseModal = (
    text: string,
    type: "question" | "answer" | "explanation",
    callback: (text: string) => void
  ) => {
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

  const handleQuestionImageUpload = async (file: File) => {
    const url = await uploadImage.mutateAsync({
      file,
      questionId: editingQuestion?.id || `temp-${Date.now()}`,
    });
    setQuestionForm({ ...questionForm, question_image_url: url });
    return url;
  };

  const handleOptionImageUpload = async (file: File, optionKey: string) => {
    const url = await uploadImage.mutateAsync({
      file,
      questionId: editingQuestion?.id || `temp-${Date.now()}`,
    });
    setQuestionForm({
      ...questionForm,
      option_images: {
        ...questionForm.option_images,
        [optionKey]: url,
      },
    });
    return url;
  };

  const handleExcelImport = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    const questionsToImport = jsonData.map((row) => {
      const options: Record<string, any> = {};
      
      if (row.option_a) options.A = { text: row.option_a, image_url: row.option_a_image };
      if (row.option_b) options.B = { text: row.option_b, image_url: row.option_b_image };
      if (row.option_c) options.C = { text: row.option_c, image_url: row.option_c_image };
      if (row.option_d) options.D = { text: row.option_d, image_url: row.option_d_image };

      return {
        question_text: row.question_text,
        question_type: row.question_format || "single_choice",
        question_format: row.question_format || "single_choice",
        options,
        correct_answer: row.correct_answer,
        explanation: row.explanation || "",
        marks: parseInt(row.marks) || 1,
        difficulty: row.difficulty || "medium",
        is_verified: false,
        is_ai_generated: false,
        contains_formula: row.contains_formula === "TRUE" || row.contains_formula === true,
        formula_type: row.formula_type || undefined,
        question_image_url: row.question_image_url || undefined,
      };
    });

    const result = await bulkImport.mutateAsync({ questions: questionsToImport });
    return result;
  };

  // Render options based on question format
  const renderOptionsEditor = () => {
    switch (questionForm.question_format) {
      case "single_choice":
      case "multiple_choice":
        return (
          <div className="space-y-4">
            {["A", "B", "C", "D"].map((optionKey) => (
              <div key={optionKey} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="w-12">Option {optionKey}</Label>
                  {questionForm.question_format === "single_choice" ? (
                    <RadioGroup
                      value={questionForm.correct_answer}
                      onValueChange={(value) =>
                        setQuestionForm({ ...questionForm, correct_answer: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={optionKey} id={`radio-${optionKey}`} />
                        <Label htmlFor={`radio-${optionKey}`} className="text-xs">
                          Correct
                        </Label>
                      </div>
                    </RadioGroup>
                  ) : (
                    <Checkbox
                      checked={questionForm.correct_answer.includes(optionKey)}
                      onCheckedChange={(checked) => {
                        const current = questionForm.correct_answer.split(";").filter(Boolean);
                        const updated = checked
                          ? [...current, optionKey]
                          : current.filter((k) => k !== optionKey);
                        setQuestionForm({
                          ...questionForm,
                          correct_answer: updated.join(";"),
                        });
                      }}
                    />
                  )}
                </div>
                <Input
                  placeholder={`Enter option ${optionKey}`}
                  value={questionForm.options[optionKey]?.text || ""}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      options: {
                        ...questionForm.options,
                        [optionKey]: {
                          ...questionForm.options[optionKey],
                          text: e.target.value,
                        },
                      },
                    })
                  }
                />
                <ImageUploadWidget
                  label={`Option ${optionKey} Image (Optional)`}
                  value={questionForm.option_images[optionKey]}
                  onChange={(url) => {
                    if (!url) {
                      const { [optionKey]: removed, ...rest } = questionForm.option_images;
                      setQuestionForm({ ...questionForm, option_images: rest });
                    }
                  }}
                  onFileSelect={(file) => handleOptionImageUpload(file, optionKey)}
                />
              </div>
            ))}
          </div>
        );

      case "true_false":
        return (
          <RadioGroup
            value={questionForm.correct_answer}
            onValueChange={(value) =>
              setQuestionForm({ ...questionForm, correct_answer: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false">False</Label>
            </div>
          </RadioGroup>
        );

      case "fill_blank":
      case "numerical":
        return (
          <div className="space-y-2">
            <Label>Correct Answer</Label>
            <Input
              placeholder={
                questionForm.question_format === "numerical"
                  ? "Enter numerical answer (e.g., 42)"
                  : "Enter the correct answer"
              }
              type={questionForm.question_format === "numerical" ? "number" : "text"}
              value={questionForm.correct_answer}
              onChange={(e) =>
                setQuestionForm({ ...questionForm, correct_answer: e.target.value })
              }
            />
          </div>
        );

      case "subjective":
        return (
          <div className="space-y-2">
            <Label>Model Answer / Key Points</Label>
            <Textarea
              placeholder="Enter model answer or key points for evaluation..."
              rows={4}
              value={questionForm.correct_answer}
              onChange={(e) =>
                setQuestionForm({ ...questionForm, correct_answer: e.target.value })
              }
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Question Bank</CardTitle>
              <CardDescription>Manage questions for {subjectName}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsExcelImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
              <Dialog
                open={isAddManualOpen || !!editingQuestion}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsAddManualOpen(false);
                    setEditingQuestion(null);
                    resetForm();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setIsAddManualOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingQuestion ? "Edit Question" : "Add New Question"}
                    </DialogTitle>
                    <DialogDescription>
                      Create a comprehensive question with multiple formats and formula support
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="question" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="question">Question</TabsTrigger>
                      <TabsTrigger value="options">Options</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="question" className="space-y-4">
                      {/* Chapter & Topic Selection */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Chapter</Label>
                          <Select
                            value={questionForm.chapter_id}
                            onValueChange={(value) =>
                              setQuestionForm({ ...questionForm, chapter_id: value, topic_id: "" })
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
                          <Label>Topic (Optional)</Label>
                          <Select
                            value={questionForm.topic_id}
                            onValueChange={(value) =>
                              setQuestionForm({ ...questionForm, topic_id: value })
                            }
                            disabled={!questionForm.chapter_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select topic" />
                            </SelectTrigger>
                            <SelectContent>
                              {topics?.map((topic) => (
                                <SelectItem key={topic.id} value={topic.id}>
                                  {topic.topic_number}. {topic.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Question Format */}
                      <div className="space-y-2">
                        <Label>Question Format *</Label>
                        <Select
                          value={questionForm.question_format}
                          onValueChange={(value) =>
                            setQuestionForm({ ...questionForm, question_format: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_choice">Single Choice (Radio)</SelectItem>
                            <SelectItem value="multiple_choice">
                              Multiple Choice (Checkbox)
                            </SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                            <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                            <SelectItem value="numerical">Numerical Answer</SelectItem>
                            <SelectItem value="subjective">Subjective (Long Answer)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Formula Support */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="contains-formula"
                          checked={questionForm.contains_formula}
                          onCheckedChange={(checked) =>
                            setQuestionForm({
                              ...questionForm,
                              contains_formula: checked as boolean,
                            })
                          }
                        />
                        <Label htmlFor="contains-formula">
                          This question contains formulas (Math/Chemistry/Accounting)
                        </Label>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Question Text *</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openRephraseModal(
                                questionForm.question_text,
                                "question",
                                (text) => setQuestionForm({ ...questionForm, question_text: text })
                              )
                            }
                            disabled={!questionForm.question_text}
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            AI Rephrase
                          </Button>
                        </div>
                        {questionForm.contains_formula ? (
                          <FormulaEditor
                            value={questionForm.question_text}
                            onChange={(value, type) =>
                              setQuestionForm({
                                ...questionForm,
                                question_text: value,
                                formula_type: type,
                              })
                            }
                            formulaType={questionForm.formula_type}
                          />
                        ) : (
                          <Textarea
                            placeholder="Enter your question..."
                            rows={4}
                            value={questionForm.question_text}
                            onChange={(e) =>
                              setQuestionForm({ ...questionForm, question_text: e.target.value })
                            }
                          />
                        )}
                      </div>

                      {/* Question Image */}
                      <ImageUploadWidget
                        label="Question Image (Optional)"
                        value={questionForm.question_image_url}
                        onChange={(url) =>
                          setQuestionForm({ ...questionForm, question_image_url: url || "" })
                        }
                        onFileSelect={handleQuestionImageUpload}
                      />
                    </TabsContent>

                    <TabsContent value="options" className="space-y-4">
                      {renderOptionsEditor()}
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4">
                      {/* Explanation */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Explanation (Optional)</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openRephraseModal(
                                questionForm.explanation,
                                "explanation",
                                (text) => setQuestionForm({ ...questionForm, explanation: text })
                              )
                            }
                            disabled={!questionForm.explanation}
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            AI Rephrase
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Provide detailed explanation for the answer..."
                          rows={4}
                          value={questionForm.explanation}
                          onChange={(e) =>
                            setQuestionForm({ ...questionForm, explanation: e.target.value })
                          }
                        />
                      </div>

                      {/* Difficulty and Marks */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Difficulty</Label>
                          <Select
                            value={questionForm.difficulty}
                            onValueChange={(value) =>
                              setQuestionForm({ ...questionForm, difficulty: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Marks</Label>
                          <Input
                            type="number"
                            min={1}
                            value={questionForm.marks}
                            onChange={(e) =>
                              setQuestionForm({
                                ...questionForm,
                                marks: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddManualOpen(false);
                        setEditingQuestion(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
                      disabled={
                        !questionForm.question_text ||
                        !questionForm.correct_answer ||
                        createQuestion.isPending ||
                        updateQuestion.isPending
                      }
                    >
                      {createQuestion.isPending || updateQuestion.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : editingQuestion ? (
                        "Update Question"
                      ) : (
                        "Add Question"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label className="text-xs mb-2 block">Difficulty</Label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-2 block">Status</Label>
              <Select value={filterVerified} onValueChange={setFilterVerified}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Questions</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Questions Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : questions && questions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        {question.question_image_url && (
                          <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                        <span className="line-clamp-2">{question.question_text}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {question.question_format.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          question.difficulty === "easy"
                            ? "default"
                            : question.difficulty === "hard"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {question.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>{question.marks}</TableCell>
                    <TableCell>
                      {question.is_verified ? (
                        <Badge className="bg-green-500">Verified</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingQuestion(question);
                            setQuestionForm({
                              chapter_id: "",
                              topic_id: question.topic_id || "",
                              question_text: question.question_text,
                              question_format: question.question_format,
                              difficulty: question.difficulty,
                              options: question.options || {},
                              correct_answer: question.correct_answer,
                              explanation: question.explanation || "",
                              marks: question.marks,
                              contains_formula: question.contains_formula,
                              formula_type: (question.formula_type as any) || "plain",
                              question_image_url: question.question_image_url || "",
                              option_images: question.option_images || {},
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteQuestionId(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No questions added yet</p>
              <p className="text-sm mt-2">Click "Add Question" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the question. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion}>Delete</AlertDialogAction>
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
        title="Import Questions"
        templateUrl="#"
        onImport={handleExcelImport}
        instructions={[
          "Download the template and fill in question details",
          "Supported formats: single_choice, multiple_choice, true_false, fill_blank, numerical, subjective",
          "For multiple correct answers in multiple_choice, separate with semicolon (A;C)",
          "Mark contains_formula as TRUE if question has formulas",
          "Provide image URLs in respective columns",
          "Save as .xlsx file before uploading",
        ]}
      />
    </div>
  );
}
