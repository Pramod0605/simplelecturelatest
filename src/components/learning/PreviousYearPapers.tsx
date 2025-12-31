import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Clock,
  Play,
  Download,
  CheckCircle,
  XCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Timer,
  AlertCircle,
  Star,
  Upload,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePreviousYearPapersForSubject,
  usePreviousYearPaperQuestions,
  PaperQuestion,
} from "@/hooks/usePreviousYearPaperQuestions";
import { useUploadAnswerImage, useSubmitWrittenAnswer } from "@/hooks/useStudentAnswers";
import { MathpixRenderer } from "@/components/admin/MathpixRenderer";
import { toast } from "@/hooks/use-toast";

interface PreviousYearPapersProps {
  subjectId: string | null;
  topicId?: string | null;
  chapterId?: string | null;
  chapterOnly?: boolean;
}

type TestState = "papers" | "setup" | "testing" | "results";

const QUESTION_OPTIONS = [5, 10, 15, 20, 25] as const;
const TIME_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "Unlimited", value: 0 },
] as const;

export function PreviousYearPapers({ subjectId, topicId, chapterId, chapterOnly }: PreviousYearPapersProps) {
  const [testState, setTestState] = useState<TestState>("papers");
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(10);
  const [selectedTime, setSelectedTime] = useState<number>(30);
  const [testQuestions, setTestQuestions] = useState<PaperQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answerImages, setAnswerImages] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [questionFilter, setQuestionFilter] = useState<"all" | "important">("all");

  const { data: papers, isLoading: papersLoading } = usePreviousYearPapersForSubject(subjectId, topicId, chapterId, chapterOnly);
  const { data: paperQuestions, isLoading: questionsLoading } = usePreviousYearPaperQuestions(
    selectedPaper?.id || null
  );
  const uploadAnswerImage = useUploadAnswerImage();
  const submitWrittenAnswer = useSubmitWrittenAnswer();

  // Timer effect
  useEffect(() => {
    if (testState !== "testing" || timeRemaining === null || timeRemaining === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        if (prev === 1) {
          // Auto-submit when time runs out
          setTestState("results");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testState, timeRemaining]);

  const handleStartSetup = (paper: any) => {
    setSelectedPaper(paper);
    setTestState("setup");
  };

  const handleStartTest = () => {
    if (!paperQuestions || paperQuestions.length === 0) return;

    // Shuffle and select questions
    const shuffled = [...paperQuestions].sort(() => Math.random() - 0.5);
    const count = selectedQuestionCount === -1 ? shuffled.length : Math.min(selectedQuestionCount, shuffled.length);
    setTestQuestions(shuffled.slice(0, count));
    setAnswers({});
    setAnswerImages({});
    setFlaggedQuestions(new Set());
    setCurrentQuestionIndex(0);
    setTimeRemaining(selectedTime === 0 ? null : selectedTime * 60);
    setTestState("testing");
  };

  // Check if paper is a written answer type
  const isWrittenAnswerPaper = selectedPaper?.document_type === "practice" || 
                               selectedPaper?.document_type === "proficiency";

  // Check if question requires written answer
  const isWrittenAnswerQuestion = (question: PaperQuestion): boolean => {
    // If paper type is practice/proficiency, all questions are written
    if (isWrittenAnswerPaper) return true;
    // Otherwise check question format
    return question.question_format === "subjective" && 
           (!question.options || Object.keys(question.options).length === 0);
  };

  const handleImageUpload = async (questionId: string, file: File) => {
    if (!selectedPaper) return;
    
    setUploadingImage(questionId);
    try {
      const imageUrl = await uploadAnswerImage.mutateAsync({ file, questionId });
      setAnswerImages(prev => ({ ...prev, [questionId]: imageUrl }));
      
      // Also save to database
      await submitWrittenAnswer.mutateAsync({
        questionId,
        paperId: selectedPaper.id,
        answerImageUrl: imageUrl,
      });
      
      toast({ title: "Image uploaded", description: "Your answer image has been saved" });
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setUploadingImage(null);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    setTestState("results");
  };

  const handleRetake = () => {
    setTestState("setup");
  };

  const handleBackToPapers = () => {
    setTestState("papers");
    setSelectedPaper(null);
    setTestQuestions([]);
    setAnswers({});
    setAnswerImages({});
    setFlaggedQuestions(new Set());
  };

  const calculateScore = useCallback(() => {
    let correct = 0;
    testQuestions.forEach((q) => {
      const userAnswer = answers[q.id]?.trim();
      const correctAnswer = q.correct_answer?.trim();
      if (userAnswer && correctAnswer && userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
        correct++;
      }
    });
    return correct;
  }, [testQuestions, answers]);

  const isIntegerQuestion = (question: PaperQuestion): boolean => {
    return question.question_type === "integer" || 
           !question.options || 
           Object.keys(question.options).length === 0;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getOptionText = (question: PaperQuestion, key: string): string => {
    const opt = question.options?.[key];
    if (typeof opt === "string") return opt;
    if (opt && typeof opt === "object" && "text" in opt) return opt.text;
    return "";
  };

  // Render Papers List
  if (testState === "papers") {
    if (papersLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!papers || papers.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Mock Tests or PYQs</h3>
            <p className="text-muted-foreground">
              No mock tests or previous year questions are available for this subject yet.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mock & PYQs</h2>
          <Badge variant="secondary">{papers.length} Papers</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <Card key={paper.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {paper.exam_name} {paper.year}
                    </CardTitle>
                    {paper.paper_type && (
                      <CardDescription>{paper.paper_type}</CardDescription>
                    )}
                  </div>
                  <Badge variant="outline">{paper.year}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{paper.total_questions || "N/A"} Questions</span>
                  </div>
                  {paper.document_type && paper.document_type !== "mcq" && (
                    <Badge variant="secondary" className="text-xs">
                      {paper.document_type === "practice" ? (
                        <><Pencil className="h-3 w-3 mr-1" /> Written</>
                      ) : (
                        <><Pencil className="h-3 w-3 mr-1" /> Proficiency</>
                      )}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {paper.pdf_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(paper.pdf_url, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStartSetup(paper)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start to Solve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render Setup Dialog
  if (testState === "setup") {
    const availableQuestions = paperQuestions?.length || 0;

    return (
      <Dialog open={true} onOpenChange={() => handleBackToPapers()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPaper?.exam_name} {selectedPaper?.year}
            </DialogTitle>
          </DialogHeader>

          {questionsLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : availableQuestions === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No questions available for this paper yet.
              </p>
              <Button className="mt-4" onClick={handleBackToPapers}>
                Back to Papers
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-base font-medium">Number of Questions</Label>
                <p className="text-sm text-muted-foreground">
                  {availableQuestions} questions available
                </p>
                <RadioGroup
                  value={selectedQuestionCount.toString()}
                  onValueChange={(v) => setSelectedQuestionCount(parseInt(v))}
                  className="flex flex-wrap gap-2"
                >
                  {QUESTION_OPTIONS.map((count) => (
                    <div key={count}>
                      <RadioGroupItem
                        value={count.toString()}
                        id={`q-${count}`}
                        className="peer sr-only"
                        disabled={count > availableQuestions}
                      />
                      <Label
                        htmlFor={`q-${count}`}
                        className={cn(
                          "flex items-center justify-center px-4 py-2 rounded-md border cursor-pointer transition-colors",
                          "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground",
                          "hover:bg-accent",
                          count > availableQuestions && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {count}
                      </Label>
                    </div>
                  ))}
                  <div>
                    <RadioGroupItem
                      value="-1"
                      id="q-all"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="q-all"
                      className={cn(
                        "flex items-center justify-center px-4 py-2 rounded-md border cursor-pointer transition-colors",
                        "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground",
                        "hover:bg-accent"
                      )}
                    >
                      All ({availableQuestions})
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Time Limit</Label>
                <RadioGroup
                  value={selectedTime.toString()}
                  onValueChange={(v) => setSelectedTime(parseInt(v))}
                  className="flex flex-wrap gap-2"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <div key={opt.value}>
                      <RadioGroupItem
                        value={opt.value.toString()}
                        id={`t-${opt.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`t-${opt.value}`}
                        className={cn(
                          "flex items-center justify-center px-3 py-2 rounded-md border cursor-pointer transition-colors",
                          "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground",
                          "hover:bg-accent"
                        )}
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button className="w-full" onClick={handleStartTest}>
                <Play className="h-4 w-4 mr-2" />
                Start Test
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Render Test Interface
  if (testState === "testing") {
    const importantQuestionsCount = testQuestions.filter(q => q.is_important).length;
    const displayedQuestions = questionFilter === "important" 
      ? testQuestions.filter(q => q.is_important)
      : testQuestions;
    const currentQuestion = displayedQuestions[currentQuestionIndex];
    const progress = displayedQuestions.length > 0 
      ? ((currentQuestionIndex + 1) / displayedQuestions.length) * 100 
      : 0;

    // Guard for invalid index when switching tabs
    if (!currentQuestion && displayedQuestions.length > 0) {
      setCurrentQuestionIndex(0);
      return null;
    }

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setTestState("results")}>
              Submit Test
            </Button>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {displayedQuestions.length}
            </span>
          </div>
          {timeRemaining !== null && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-md",
              timeRemaining < 60 ? "bg-destructive/10 text-destructive" : "bg-muted"
            )}>
              <Timer className="h-4 w-4" />
              <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Question Filter Tabs */}
        <Tabs value={questionFilter} onValueChange={(v) => {
          setQuestionFilter(v as "all" | "important");
          setCurrentQuestionIndex(0);
        }}>
          <TabsList>
            <TabsTrigger value="all">
              All Questions ({testQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="important" disabled={importantQuestionsCount === 0}>
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
              Important ({importantQuestionsCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Progress value={progress} className="h-2" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Question Card */}
          <Card className="lg:col-span-3">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline">
                      {currentQuestion.difficulty}
                    </Badge>
                    {currentQuestion.is_important && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                        Important
                      </Badge>
                    )}
                  </div>
                  <div className="text-lg">
                    <MathpixRenderer mmdText={currentQuestion.question_text} inline />
                  </div>
                </div>
                <Button
                  variant={flaggedQuestions.has(currentQuestion.id) ? "default" : "ghost"}
                  size="icon"
                  onClick={() => toggleFlag(currentQuestion.id)}
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>

              {isWrittenAnswerQuestion(currentQuestion) ? (
                // Written answer question - show textarea and image upload
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Pencil className="h-4 w-4" />
                    <span>Write your answer below or upload an image of your handwritten solution</span>
                  </div>
                  
                  <Textarea
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    className="min-h-[120px]"
                  />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">OR</span>
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
                    {uploadingImage === currentQuestion.id ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      </div>
                    ) : answerImages[currentQuestion.id] ? (
                      <div className="space-y-3">
                        <img 
                          src={answerImages[currentQuestion.id]} 
                          alt="Your answer" 
                          className="max-h-48 mx-auto rounded-lg shadow-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAnswerImages(prev => {
                              const next = { ...prev };
                              delete next[currentQuestion.id];
                              return next;
                            });
                          }}
                        >
                          Remove & Upload New
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">Click to upload image</span>
                        <span className="text-xs text-muted-foreground">
                          JPG, PNG up to 10MB
                        </span>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(currentQuestion.id, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ) : isIntegerQuestion(currentQuestion) ? (
                // Integer type question - show text input
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">
                    Enter your numeric answer:
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter your answer (e.g., 42, -5, 3.14)"
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    className="text-lg font-mono"
                  />
                </div>
              ) : (
                // MCQ question - show radio buttons
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {Object.keys(currentQuestion.options || {}).sort().map((key) => (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center space-x-3 p-4 rounded-lg border transition-colors",
                        answers[currentQuestion.id] === key
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      )}
                    >
                      <RadioGroupItem value={key} id={`opt-${key}`} />
                      <Label htmlFor={`opt-${key}`} className="flex-1 cursor-pointer flex items-start">
                        <span className="font-medium mr-2">{key}.</span>
                        <MathpixRenderer mmdText={getOptionText(currentQuestion, key)} inline className="inline" />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((i) => i - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                {currentQuestionIndex === displayedQuestions.length - 1 ? (
                  <Button onClick={handleSubmit}>Submit Test</Button>
                ) : (
                  <Button onClick={() => setCurrentQuestionIndex((i) => i + 1)}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Palette */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Question Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {displayedQuestions.map((q, idx) => (
                  <Button
                    key={q.id}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 relative",
                      idx === currentQuestionIndex && "ring-2 ring-primary",
                      answers[q.id] && "bg-primary text-primary-foreground",
                      flaggedQuestions.has(q.id) && "border-orange-500 border-2"
                    )}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    {idx + 1}
                    {q.is_important && (
                      <Star className="absolute -top-1 -right-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
                    )}
                  </Button>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border bg-primary" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-orange-500 border-2" />
                  <span>Flagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span>Important</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border" />
                  <span>Not Answered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty state for Important tab */}
        {questionFilter === "important" && displayedQuestions.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No important questions marked in this paper.</p>
                <Button 
                  variant="link" 
                  onClick={() => setQuestionFilter("all")}
                  className="mt-2"
                >
                  View all questions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Render Results
  if (testState === "results") {
    const score = calculateScore();
    const percentage = Math.round((score / testQuestions.length) * 100);

    return (
      <div className="space-y-6">
        {/* Score Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className={cn(
                "inline-flex items-center justify-center h-24 w-24 rounded-full text-3xl font-bold",
                percentage >= 70 ? "bg-green-100 text-green-700" : 
                percentage >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
              )}>
                {percentage}%
              </div>
              <div>
                <h3 className="text-xl font-semibold">Test Completed!</h3>
                <p className="text-muted-foreground">
                  You scored {score} out of {testQuestions.length} questions
                </p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={handleRetake}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Test
                </Button>
                <Button onClick={handleBackToPapers}>
                  Back to Papers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Review */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detailed Review</h3>
          {testQuestions.map((q, idx) => {
            const userAnswer = answers[q.id]?.trim();
            const correctAnswer = q.correct_answer?.trim();
            const isCorrect = userAnswer && correctAnswer && userAnswer.toUpperCase() === correctAnswer.toUpperCase();
            const isInteger = isIntegerQuestion(q);

            return (
              <Card key={q.id} className={cn(
                "border-l-4",
                isCorrect ? "border-l-green-500" : "border-l-red-500"
              )}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-muted-foreground">
                        Question {idx + 1}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {isInteger ? "Integer" : "MCQ"}
                      </Badge>
                      {q.is_important && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                          Important
                        </Badge>
                      )}
                    </div>
                    {isCorrect ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Correct
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Incorrect
                      </Badge>
                    )}
                  </div>
                  <div>
                    <MathpixRenderer mmdText={q.question_text} inline />
                  </div>
                  
                  {isInteger ? (
                    // Integer question review
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 text-sm">
                        <div className={cn(
                          "p-3 rounded",
                          isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          <span className="font-medium">Your answer:</span> {userAnswer || "Not answered"}
                        </div>
                        {!isCorrect && (
                          <div className="p-3 rounded bg-green-100 text-green-800">
                            <span className="font-medium">Correct answer:</span> {correctAnswer}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // MCQ question review
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.keys(q.options || {}).sort().map((key) => (
                        <div
                          key={key}
                          className={cn(
                            "p-2 rounded text-sm",
                            key.toUpperCase() === correctAnswer?.toUpperCase() && "bg-green-100 text-green-800",
                            userAnswer?.toUpperCase() === key.toUpperCase() && 
                            key.toUpperCase() !== correctAnswer?.toUpperCase() && "bg-red-100 text-red-800"
                          )}
                        >
                          <span className="font-medium">{key}.</span> <MathpixRenderer mmdText={getOptionText(q, key)} inline className="inline" />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!userAnswer && (
                    <p className="text-sm text-muted-foreground italic">Not answered</p>
                  )}
                  {q.explanation && (
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <span className="font-medium">Explanation:</span>
                      <MathpixRenderer mmdText={q.explanation} inline className="inline ml-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
