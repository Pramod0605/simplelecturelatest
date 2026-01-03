import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Calendar,
  Trophy,
  AlertCircle,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePaperTestResults, PaperTestResult } from "@/hooks/usePaperTestResults";
import { usePreviousYearPaperQuestions, PaperQuestion } from "@/hooks/usePreviousYearPaperQuestions";
import { useStudentAnswers } from "@/hooks/useStudentAnswers";
import { MathpixRenderer } from "@/components/admin/MathpixRenderer";
import { format } from "date-fns";

interface PaperTestResultsProps {
  subjectId: string | null;
}

type ResultCategory = "all" | "previous_year" | "proficiency" | "exam";

export function PaperTestResults({ subjectId }: PaperTestResultsProps) {
  const [activeCategory, setActiveCategory] = useState<ResultCategory>("all");
  const [selectedResult, setSelectedResult] = useState<PaperTestResult | null>(null);
  
  const { data: results, isLoading } = usePaperTestResults(subjectId);
  const { data: paperQuestions } = usePreviousYearPaperQuestions(selectedResult?.paper_id || null);
  const { data: studentAnswers } = useStudentAnswers(selectedResult?.paper_id || null);

  // Build a lookup for student answers by question ID
  const studentAnswersByQuestionId = useMemo(() => {
    if (!studentAnswers) return {};
    return studentAnswers.reduce((acc, sa) => {
      acc[sa.question_id] = sa;
      return acc;
    }, {} as Record<string, typeof studentAnswers[0]>);
  }, [studentAnswers]);

  const filteredResults = results?.filter(r => 
    activeCategory === "all" || r.paper_category === activeCategory
  ) || [];

  const getCategoryCount = (category: ResultCategory) => {
    if (!results) return 0;
    if (category === "all") return results.length;
    return results.filter(r => r.paper_category === category).length;
  };

  const getStatusBadge = (result: PaperTestResult) => {
    if (result.grading_status === "pending") {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Pending
        </Badge>
      );
    }
    if (result.grading_status === "ai_graded") {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          AI Graded
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        Graded
      </Badge>
    );
  };

  const getScoreColor = (percentage: number | null) => {
    if (percentage === null) return "text-muted-foreground";
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Test Results Yet</h3>
          <p className="text-muted-foreground">
            Complete a test from Previous Year, Proficiency, or Exam tabs to see your results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ResultCategory)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1.5 h-auto bg-slate-100/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
          <TabsTrigger 
            value="all" 
            className="gap-2 py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            All
            {getCategoryCount("all") > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{getCategoryCount("all")}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="previous_year" 
            className="gap-2 py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            PYQ
            {getCategoryCount("previous_year") > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{getCategoryCount("previous_year")}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="proficiency" 
            className="gap-2 py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 hover:text-purple-600 dark:hover:text-purple-400"
          >
            Proficiency
            {getCategoryCount("proficiency") > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{getCategoryCount("proficiency")}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="exam" 
            className="gap-2 py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 hover:text-amber-600 dark:hover:text-amber-400"
          >
            Exam
            {getCategoryCount("exam") > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{getCategoryCount("exam")}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {filteredResults.length > 0 ? (
            <div className="space-y-3">
              {filteredResults.map((result) => {
                const scoreGradient = result.percentage === null 
                  ? 'from-slate-50 to-gray-50/50 dark:from-slate-950/40 dark:to-gray-950/30 before:from-slate-500 before:to-gray-500'
                  : result.percentage >= 70 
                    ? 'from-green-50 to-emerald-50/50 dark:from-green-950/40 dark:to-emerald-950/30 before:from-green-500 before:to-emerald-500'
                    : result.percentage >= 40 
                      ? 'from-yellow-50 to-amber-50/50 dark:from-yellow-950/40 dark:to-amber-950/30 before:from-yellow-500 before:to-amber-500'
                      : 'from-red-50 to-rose-50/50 dark:from-red-950/40 dark:to-rose-950/30 before:from-red-500 before:to-rose-500';
                
                const iconBg = result.percentage === null 
                  ? 'bg-slate-100 dark:bg-slate-900/50'
                  : result.percentage >= 70 
                    ? 'bg-green-100 dark:bg-green-900/50'
                    : result.percentage >= 40 
                      ? 'bg-yellow-100 dark:bg-yellow-900/50'
                      : 'bg-red-100 dark:bg-red-900/50';
                
                const iconColor = result.percentage === null 
                  ? 'text-slate-600 dark:text-slate-400'
                  : result.percentage >= 70 
                    ? 'text-green-600 dark:text-green-400'
                    : result.percentage >= 40 
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400';

                return (
                  <Card 
                    key={result.id} 
                    className={`group relative overflow-hidden transition-all duration-300 border-0 shadow-md hover:shadow-xl bg-gradient-to-br before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r ${scoreGradient}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Icon Container */}
                        <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${iconBg}`}>
                          <Trophy className={`h-6 w-6 ${iconColor}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                            <div>
                              <h3 className="font-semibold text-base">
                                {result.paper?.exam_name || "Unknown Paper"} {result.paper?.year || ""}
                              </h3>
                              <Badge variant="outline" className="text-xs capitalize mt-1">
                                {result.paper_category.replace("_", " ")}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {result.grading_status === "pending" ? (
                                <div className="flex items-center gap-2 text-yellow-600">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="text-sm">Grading...</span>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <div className={cn("text-2xl font-bold", getScoreColor(result.percentage))}>
                                    {result.percentage !== null ? `${Math.round(result.percentage)}%` : "N/A"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {result.score}/{result.total_questions} correct
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Metadata Pills */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(result.submitted_at), "MMM d, yyyy h:mm a")}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                              <Clock className="h-3 w-3" />
                              {formatDuration(result.time_taken_seconds)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                              <FileText className="h-3 w-3" />
                              {result.total_questions} Questions
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4">
                            {getStatusBadge(result)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedResult(result)}
                              className="ml-auto"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No results for this category</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedResult?.paper?.exam_name} {selectedResult?.paper?.year} - Review
            </DialogTitle>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-4">
              {/* Score Summary */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Score</p>
                      <p className={cn("text-3xl font-bold", getScoreColor(selectedResult.percentage))}>
                        {selectedResult.percentage !== null ? `${Math.round(selectedResult.percentage)}%` : "Pending"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Correct Answers</p>
                      <p className="text-xl font-semibold">
                        {selectedResult.score ?? "?"}/{selectedResult.total_questions}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Time Taken</p>
                      <p className="text-xl font-semibold">
                        {formatDuration(selectedResult.time_taken_seconds)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions Review */}
              {paperQuestions && paperQuestions.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Question Review</h4>
                  {paperQuestions.map((q, idx) => {
                    const textAnswer = selectedResult.answers[q.id];
                    const studentAnswer = studentAnswersByQuestionId[q.id];
                    const imageAnswer = studentAnswer?.answer_image_url;
                    
                    // Has any answer if text answer OR image answer exists
                    const hasAnyAnswer = !!textAnswer || !!imageAnswer;
                    const displayAnswer = textAnswer || studentAnswer?.answer_text;
                    const isCorrect = displayAnswer?.toUpperCase() === q.correct_answer?.toUpperCase();
                    
                    return (
                      <Card key={q.id} className={cn(
                        "border-l-4",
                        !hasAnyAnswer ? "border-l-gray-300" :
                        isCorrect ? "border-l-green-500" : "border-l-red-500"
                      )}>
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Q{idx + 1}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {q.difficulty}
                              </Badge>
                            </div>
                            {!hasAnyAnswer ? (
                              <Badge variant="outline" className="text-gray-500">
                                Not Answered
                              </Badge>
                            ) : imageAnswer && !displayAnswer ? (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                <Image className="h-3 w-3 mr-1" />
                                Image Submitted
                              </Badge>
                            ) : isCorrect ? (
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
                          <div className="text-sm">
                            <MathpixRenderer mmdText={q.question_text} inline />
                          </div>
                          
                          {/* Show image answer if exists */}
                          {imageAnswer && (
                            <div className="mt-2">
                              <span className="text-sm text-muted-foreground">Your uploaded answer:</span>
                              <img 
                                src={imageAnswer} 
                                alt="Your answer" 
                                className="mt-1 max-h-48 rounded-lg border shadow-sm"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = document.createElement('div');
                                  fallback.className = 'mt-1 p-4 rounded-lg border bg-muted text-muted-foreground text-sm';
                                  fallback.textContent = 'Image could not be loaded';
                                  target.parentNode?.appendChild(fallback);
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="flex gap-4 text-sm flex-wrap">
                            <div className="flex items-baseline gap-1">
                              <span className="text-muted-foreground">Your answer: </span>
                              <span className={cn(
                                "font-medium",
                                isCorrect ? "text-green-600" : "text-red-600"
                              )}>
                                {displayAnswer ? (
                                  <MathpixRenderer mmdText={displayAnswer} inline className="inline" />
                                ) : (imageAnswer ? "(see image above)" : "—")}
                              </span>
                            </div>
                            {!isCorrect && q.correct_answer && (
                              <div className="flex items-baseline gap-1">
                                <span className="text-muted-foreground">Correct: </span>
                                <span className="font-medium text-green-600">
                                  <MathpixRenderer mmdText={q.correct_answer} inline className="inline" />
                                </span>
                              </div>
                            )}
                          </div>
                          {q.explanation && (
                            <div className="bg-muted p-2 rounded text-sm">
                              <span className="font-medium">Explanation: </span>
                              <MathpixRenderer mmdText={q.explanation} inline className="inline" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                  <p>Loading questions...</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
