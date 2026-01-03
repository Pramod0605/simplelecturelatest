import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Flag,
  ChevronLeft,
  ChevronRight,
  Timer,
  AlertCircle,
  Star,
  Upload,
  Pencil,
  Loader2,
  Trophy,
  CheckCircle,
  Eye,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  usePreviousYearPapersForSubject,
  usePreviousYearPaperQuestions,
  PaperQuestion,
} from "@/hooks/usePreviousYearPaperQuestions";
import { useUploadAnswerImage, useSubmitWrittenAnswer } from "@/hooks/useStudentAnswers";
import { useSubmitPaperTestResult, useUpdatePaperTestResult } from "@/hooks/usePaperTestResults";
import { useExtractImageAnswer } from "@/hooks/useExtractImageAnswer";
import { MathpixRenderer } from "@/components/admin/MathpixRenderer";
import { PaperTestResults } from "./PaperTestResults";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PreviousYearPapersProps {
  subjectId: string | null;
  topicId?: string | null;
  chapterId?: string | null;
  chapterOnly?: boolean;
  onViewResults?: () => void;
}

type TestState = "papers" | "setup" | "testing" | "results";
type PaperCategory = "previous_year" | "proficiency" | "exam";

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

export function PreviousYearPapers({ subjectId, topicId, chapterId, chapterOnly, onViewResults }: PreviousYearPapersProps) {
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
  const [activeCategory, setActiveCategory] = useState<PaperCategory>("previous_year");

  const { data: papers, isLoading: papersLoading } = usePreviousYearPapersForSubject(subjectId, topicId, chapterId, chapterOnly);
  const { data: paperQuestions, isLoading: questionsLoading } = usePreviousYearPaperQuestions(
    selectedPaper?.id || null
  );
  const uploadAnswerImage = useUploadAnswerImage();
  const submitWrittenAnswer = useSubmitWrittenAnswer();
  const submitPaperTestResult = useSubmitPaperTestResult();
  const updatePaperTestResult = useUpdatePaperTestResult();
  const extractImageAnswer = useExtractImageAnswer();
  
  // Track extracted text from images
  const [extractedImageAnswers, setExtractedImageAnswers] = useState<Record<string, string>>({});
  const [isExtractingImages, setIsExtractingImages] = useState(false);

  // Track test start time for duration calculation
  const [testStartTime, setTestStartTime] = useState<number | null>(null);

  // Filter papers by category
  const filteredPapers = useMemo(() => {
    if (!papers) return [];
    return papers.filter(p => (p.paper_category || "previous_year") === activeCategory);
  }, [papers, activeCategory]);

  // Count papers by category
  const paperCounts = useMemo(() => {
    if (!papers) return { previous_year: 0, proficiency: 0, exam: 0 };
    return papers.reduce((acc, p) => {
      const category = (p.paper_category || "previous_year") as PaperCategory;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, { previous_year: 0, proficiency: 0, exam: 0 } as Record<PaperCategory, number>);
  }, [papers]);

  // Fetch user's submitted papers for status display
  const { data: submittedPapers } = useQuery({
    queryKey: ["submitted-papers", subjectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from("paper_test_results")
        .select("paper_id, submitted_at, score, percentage, grading_status")
        .eq("student_id", user.id)
        .order("submitted_at", { ascending: false });
      
      return data || [];
    },
  });

  // Create a lookup map: paper_id -> latest submission info
  const submittedPaperMap = useMemo(() => {
    if (!submittedPapers) return new Map();
    const map = new Map();
    submittedPapers.forEach((s: any) => {
      // Only keep the latest submission per paper
      if (!map.has(s.paper_id)) {
        map.set(s.paper_id, s);
      }
    });
    return map;
  }, [submittedPapers]);

  // Format date helper
  const formatSubmissionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

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
    
    // For proficiency tests and exams, set defaults for auto-start
    if (paper.paper_category === 'proficiency' || paper.paper_category === 'exam') {
      setSelectedQuestionCount(-1); // All questions
      setSelectedTime(0); // Unlimited time
    }
    
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
    setExtractedImageAnswers({});
    setFlaggedQuestions(new Set());
    setCurrentQuestionIndex(0);
    setTimeRemaining(selectedTime === 0 ? null : selectedTime * 60);
    setTestStartTime(Date.now());
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

  const handleSubmit = async () => {
    // Calculate time taken
    const timeTakenSeconds = testStartTime ? Math.floor((Date.now() - testStartTime) / 1000) : null;
    
    // First, extract text from any image answers that don't have text
    setIsExtractingImages(true);
    const imageAnswersToExtract = testQuestions.filter(q => {
      const hasImageAnswer = !!answerImages[q.id];
      const hasTextAnswer = !!answers[q.id]?.trim();
      const alreadyExtracted = !!extractedImageAnswers[q.id];
      return hasImageAnswer && !hasTextAnswer && !alreadyExtracted;
    });

    const newExtractedAnswers: Record<string, string> = { ...extractedImageAnswers };
    
    if (imageAnswersToExtract.length > 0) {
      toast({
        title: "Processing images...",
        description: `Extracting answers from ${imageAnswersToExtract.length} image(s)`,
      });

      // Process image answers sequentially to avoid rate limits
      for (const question of imageAnswersToExtract) {
        try {
          const result = await extractImageAnswer.mutateAsync({
            imageUrl: answerImages[question.id],
            questionContext: question.question_text?.substring(0, 200),
          });
          
          if (result.extracted_text && result.extracted_text !== 'UNREADABLE') {
            newExtractedAnswers[question.id] = result.extracted_text;
            
            // Also save the extracted text to database
            await submitWrittenAnswer.mutateAsync({
              questionId: question.id,
              paperId: selectedPaper.id,
              answerText: result.extracted_text,
              answerImageUrl: answerImages[question.id],
            });
          }
        } catch (error) {
          console.error(`Failed to extract answer for question ${question.id}:`, error);
        }
      }
      
      setExtractedImageAnswers(newExtractedAnswers);
    }
    setIsExtractingImages(false);

    // Now calculate score using both text answers and extracted image answers
    let correct = 0;
    testQuestions.forEach((q) => {
      // Prefer typed answer, then extracted image answer
      const userAnswer = answers[q.id]?.trim() || newExtractedAnswers[q.id]?.trim();
      const correctAnswer = q.correct_answer?.trim();
      if (fastIsCorrect(userAnswer, correctAnswer)) {
        correct++;
      }
    });
    
    const percentage = Math.round((correct / testQuestions.length) * 100);
    const paperCategory = (selectedPaper?.paper_category || "previous_year") as "previous_year" | "proficiency" | "exam";
    
    // Check if any answers need AI grading (including extracted image answers)
    const needsAiGrading = testQuestions.some((q) => {
      const userAnswer = answers[q.id]?.trim() || newExtractedAnswers[q.id]?.trim();
      const correctAnswer = q.correct_answer?.trim();
      const isInteger = isIntegerQuestion(q);
      return isInteger && userAnswer && correctAnswer && !fastIsCorrect(userAnswer, correctAnswer);
    });

    // Merge text answers with extracted image answers for storage
    const allAnswers = { ...answers };
    Object.entries(newExtractedAnswers).forEach(([qId, extractedText]) => {
      if (!allAnswers[qId]?.trim() && extractedText) {
        allAnswers[qId] = extractedText;
      }
    });

    // Save to database
    try {
      const result = await submitPaperTestResult.mutateAsync({
        paper_id: selectedPaper.id,
        subject_id: subjectId,
        paper_category: paperCategory,
        score: correct,
        total_questions: testQuestions.length,
        percentage,
        time_taken_seconds: timeTakenSeconds,
        answers: allAnswers,
        grading_status: needsAiGrading ? "pending" : "graded",
      });

      // If needs AI grading, run it in background and update the result
      if (needsAiGrading && result?.id) {
        runAiGradingAndUpdate(result.id, correct, testQuestions.length, newExtractedAnswers);
      }

      // Reset and go back to papers list with results tab selected
      setTestState("papers");
      setActiveCategory("previous_year"); // Will switch to results
      setSelectedPaper(null);
      setTestQuestions([]);
      setAnswers({});
      setAnswerImages({});
      setExtractedImageAnswers({});
      setFlaggedQuestions(new Set());
      setTestStartTime(null);
      
      // Switch to results tab
      setTimeout(() => {
        setActiveCategory("previous_year");
      }, 100);
      
    } catch (error) {
      console.error("Failed to save test result:", error);
    }
  };

  // Run AI grading in background and update the result in DB
  const runAiGradingAndUpdate = async (
    resultId: string,
    initialScore: number,
    totalQuestions: number,
    extractedAnswers: Record<string, string> = {}
  ) => {
    const needsAiCheck: { id: string; user_answer: string; correct_answer: string }[] = [];
    
    testQuestions.forEach((q) => {
      const userAnswer = answers[q.id]?.trim() || extractedAnswers[q.id]?.trim();
      const correctAnswer = q.correct_answer?.trim();
      const isInteger = isIntegerQuestion(q);
      
      if (isInteger && userAnswer && correctAnswer && !fastIsCorrect(userAnswer, correctAnswer)) {
        needsAiCheck.push({
          id: q.id,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
        });
      }
    });

    if (needsAiCheck.length === 0) {
      // No AI check needed, mark as graded
      try {
        await updatePaperTestResult.mutateAsync({
          id: resultId,
          updates: {
            grading_status: "ai_graded",
            graded_at: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error('Failed to update grading status:', err);
      }
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-compare-math-answers', {
        body: { items: needsAiCheck },
      });

      if (error) {
        console.error('AI grading error:', error);
        return;
      }

      // Count additional correct answers from AI
      let additionalCorrect = 0;
      if (data?.results && Array.isArray(data.results)) {
        data.results.forEach((result: { id: string; is_equivalent: boolean }) => {
          if (result.is_equivalent) additionalCorrect++;
        });
      }

      // Calculate final score and percentage
      const finalScore = initialScore + additionalCorrect;
      const finalPercentage = Math.round((finalScore / totalQuestions) * 100);

      // Update the result in database
      await updatePaperTestResult.mutateAsync({
        id: resultId,
        updates: {
          score: finalScore,
          percentage: finalPercentage,
          grading_status: "ai_graded",
          graded_at: new Date().toISOString(),
        },
      });

      console.log(`AI grading complete: ${additionalCorrect} additional correct, final score: ${finalScore}/${totalQuestions}`);
    } catch (err) {
      console.error('AI grading failed:', err);
    }
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
    setExtractedImageAnswers({});
    setFlaggedQuestions(new Set());
  };

  // Normalize math notation for answer comparison (e.g., 5² ↔ 5^2, $x^2$ ↔ x^2)
  const normalizeAnswer = (answer: string): string => {
    if (!answer) return '';
    
    let normalized = answer.trim();
    
    // Remove LaTeX math delimiters
    normalized = normalized
      .replace(/\$\$/g, '')     // display math $$...$$
      .replace(/\$/g, '')       // inline math $...$
      .replace(/\\\(/g, '')     // \( ... \)
      .replace(/\\\)/g, '')
      .replace(/\\\[/g, '')     // \[ ... \]
      .replace(/\\\]/g, '');
    
    // Remove LaTeX formatting tokens
    normalized = normalized
      .replace(/\\left/g, '')
      .replace(/\\right/g, '')
      .replace(/\\displaystyle/g, '')
      .replace(/\\text\{([^}]*)\}/g, '$1')  // \text{abc} → abc
      .replace(/\\mathrm\{([^}]*)\}/g, '$1')
      .replace(/\\mathbf\{([^}]*)\}/g, '$1');
    
    // Convert LaTeX operators to plain equivalents
    normalized = normalized
      .replace(/\\times/g, '*')
      .replace(/\\cdot/g, '*')
      .replace(/\\div/g, '/')
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')  // \frac{a}{b} → (a)/(b)
      .replace(/\\lt/g, '<')
      .replace(/\\gt/g, '>')
      .replace(/\\leq/g, '<=')
      .replace(/\\le/g, '<=')
      .replace(/\\geq/g, '>=')
      .replace(/\\ge/g, '>=')
      .replace(/\\neq/g, '!=')
      .replace(/\\ne/g, '!=')
      .replace(/\\pm/g, '+-')
      .replace(/\\sqrt/g, 'SQRT')
      .replace(/\\infty/g, 'INF')
      .replace(/\\pi/g, 'PI');
    
    // Remove braces (so a^{2} becomes a^2)
    normalized = normalized.replace(/[{}]/g, '');
    
    // Uppercase for case-insensitive comparison
    normalized = normalized.toUpperCase();
    
    // Superscript mappings: ⁰¹²³⁴⁵⁶⁷⁸⁹ → ^0 ^1 ^2 etc.
    const superscriptMap: Record<string, string> = {
      '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
      '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
      'ⁿ': '^N', 'ⁱ': '^I', 'ˣ': '^X',
    };
    
    // Subscript mappings: ₀₁₂₃₄₅₆₇₈₉ → _0 _1 _2 etc.
    const subscriptMap: Record<string, string> = {
      '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4',
      '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9',
      'ₙ': '_N', 'ₓ': '_X',
    };
    
    // Apply superscript normalization
    Object.entries(superscriptMap).forEach(([unicode, caret]) => {
      normalized = normalized.replace(new RegExp(unicode, 'g'), caret);
    });
    
    // Apply subscript normalization
    Object.entries(subscriptMap).forEach(([unicode, underscore]) => {
      normalized = normalized.replace(new RegExp(unicode, 'g'), underscore);
    });
    
    // Normalize Unicode math symbols
    normalized = normalized
      .replace(/×/g, '*')      // multiplication
      .replace(/÷/g, '/')      // division
      .replace(/−/g, '-')      // minus sign (unicode)
      .replace(/±/g, '+-')     // plus-minus
      .replace(/√/g, 'SQRT')   // square root
      .replace(/∞/g, 'INF')    // infinity
      .replace(/π/g, 'PI')     // pi
      .replace(/≤/g, '<=')     // less than or equal
      .replace(/≥/g, '>=')     // greater than or equal
      .replace(/≠/g, '!=')     // not equal
      .replace(/\s+/g, '');    // remove all whitespace
    
    return normalized;
  };

  // Check if fast normalization matches
  const fastIsCorrect = (userAnswer: string | undefined, correctAnswer: string | undefined): boolean => {
    if (!userAnswer || !correctAnswer) return false;
    return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
  };

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
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
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
        
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as PaperCategory)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="previous_year" className="gap-2">
              Previous Year
              {paperCounts.previous_year > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{paperCounts.previous_year}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="proficiency" className="gap-2">
              Proficiency
              {paperCounts.proficiency > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{paperCounts.proficiency}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exam" className="gap-2">
              Exam
              {paperCounts.exam > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{paperCounts.exam}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Paper Categories Content */}
          <TabsContent value={activeCategory} className="mt-4">
            {filteredPapers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPapers.map((paper) => {
                    const submission = submittedPaperMap.get(paper.id);
                    const isSubmitted = !!submission;
                    const isProficiencyOrExam = paper.paper_category === 'proficiency' || paper.paper_category === 'exam';

                    return (
                      <Card 
                        key={paper.id} 
                        className={cn(
                          "hover:shadow-md transition-shadow",
                          isSubmitted && isProficiencyOrExam && "border-green-500/30 bg-green-50/30 dark:bg-green-950/20"
                        )}
                      >
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
                            <div className="flex gap-2">
                              {isSubmitted && isProficiencyOrExam && (
                                <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Submitted
                                </Badge>
                              )}
                              <Badge variant="outline">{paper.year}</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Show submission info if submitted */}
                          {isSubmitted && isProficiencyOrExam && (
                            <div className="flex items-center gap-3 text-sm bg-green-50 dark:bg-green-900/30 p-2 rounded-md border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="font-medium">{submission.percentage}%</span>
                              </div>
                              <div className="text-muted-foreground text-xs">
                                Submitted {formatSubmissionDate(submission.submitted_at)}
                              </div>
                            </div>
                          )}

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

                          {/* Different buttons based on submission status */}
                          <div className="flex gap-2">
                            {isSubmitted && isProficiencyOrExam ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => onViewResults?.()}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Result
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartSetup(paper)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Retry
                                </Button>
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No {activeCategory === "previous_year" ? "previous year papers" : activeCategory === "proficiency" ? "proficiency tests" : "exam papers"} available</p>
                </div>
              )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Render Setup Dialog
  if (testState === "setup") {
    const availableQuestions = paperQuestions?.length || 0;
    const isProficiencyOrExam = selectedPaper?.paper_category === 'proficiency' || 
                                 selectedPaper?.paper_category === 'exam';

    // Auto-start for proficiency tests and exams when questions are loaded
    if (isProficiencyOrExam && !questionsLoading && availableQuestions > 0) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        handleStartTest();
      }, 0);
      
      return (
        <Dialog open={true} onOpenChange={() => handleBackToPapers()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedPaper?.exam_name} {selectedPaper?.year}
              </DialogTitle>
            </DialogHeader>
            <div className="py-8 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Starting test with {availableQuestions} questions...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

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
                  <Button onClick={handleSubmit} disabled={isExtractingImages}>
                    {isExtractingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Images...
                      </>
                    ) : (
                      "Submit Test"
                    )}
                  </Button>
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
                {displayedQuestions.map((q, idx) => {
                  // Question is answered if it has text answer OR image answer OR extracted image answer
                  const isAnswered = !!answers[q.id] || !!answerImages[q.id] || !!extractedImageAnswers[q.id];
                  
                  return (
                    <Button
                      key={q.id}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 relative",
                        idx === currentQuestionIndex && "ring-2 ring-primary",
                        isAnswered && "bg-primary text-primary-foreground",
                        flaggedQuestions.has(q.id) && "border-orange-500 border-2"
                      )}
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                      {q.is_important && (
                        <Star className="absolute -top-1 -right-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
                      )}
                    </Button>
                  );
                })}
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

  return null;
}
