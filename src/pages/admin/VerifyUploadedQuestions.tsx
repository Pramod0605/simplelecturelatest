import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckSquare, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCategoriesWithSubjects } from "@/hooks/useCategoriesWithSubjects";
import { useAdminPopularSubjects } from "@/hooks/useAdminPopularSubjects";
import { useSubjectChapters, useChapterTopics } from "@/hooks/useSubjectManagement";
import { useSubtopics } from "@/hooks/useSubtopics";
import { 
  usePendingQuestions, 
  useUpdateQuestionDifficulty, 
  useUpdateQuestionComments, 
  useLLMVerifyQuestions, 
  useApproveAndTransfer 
} from "@/hooks/usePendingQuestions";
import { DifficultyBadge } from "@/components/admin/DifficultyBadge";
import { MathpixRenderer } from "@/components/admin/MathpixRenderer";
import { toast } from "sonner";

export default function VerifyUploadedQuestions() {
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [llmStatusFilter, setLlmStatusFilter] = useState("all");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const { data: categories } = useCategoriesWithSubjects();
  const { data: allSubjects } = useAdminPopularSubjects();
  const { data: chapters } = useSubjectChapters(subjectId);
  const { data: topics } = useChapterTopics(chapterId);
  const { data: subtopics } = useSubtopics(topicId);

  const subjects = allSubjects?.filter((s) => s.category_id === categoryId) || [];

  const { data: questions, isLoading } = usePendingQuestions({
    categoryId,
    subjectId,
    chapterId,
    topicId,
    subtopicId,
    llmStatus: llmStatusFilter && llmStatusFilter !== 'all' ? llmStatusFilter : undefined,
    isApproved: false,
  });

  const updateDifficultyMutation = useUpdateQuestionDifficulty();
  const updateCommentsMutation = useUpdateQuestionComments();
  const llmVerifyMutation = useLLMVerifyQuestions();
  const approveTransferMutation = useApproveAndTransfer();

  const handleSelectAll = (checked: boolean) => {
    if (checked && questions) {
      setSelectedQuestions(questions.map((q: any) => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions([...selectedQuestions, questionId]);
    } else {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    }
  };

  const handleBulkVerify = async () => {
    if (selectedQuestions.length === 0) {
      toast.error("Please select questions to verify");
      return;
    }

    await llmVerifyMutation.mutateAsync({ questionIds: selectedQuestions });
  };

  const handleBulkApprove = async () => {
    if (selectedQuestions.length === 0) {
      toast.error("Please select questions to approve");
      return;
    }

    const confirmApproval = confirm(
      `Are you sure you want to approve and transfer ${selectedQuestions.length} questions to the main question bank?\n\nThis action will:\n- Mark questions as approved\n- Record your instructor ID\n- Capture current timestamp\n- Log your IP address\n- Transfer to main question bank`
    );

    if (!confirmApproval) return;

    await approveTransferMutation.mutateAsync({ questionIds: selectedQuestions });
    setSelectedQuestions([]);
  };

  const handleDifficultyChange = (questionId: string, difficulty: string) => {
    updateDifficultyMutation.mutate({ questionId, difficulty });
  };

  const handleCommentChange = (questionId: string, comments: string) => {
    updateCommentsMutation.mutate({ questionId, comments });
  };

  const getLLMBadgeVariant = (status: string) => {
    switch (status) {
      case 'correct':
        return 'success';
      case 'medium':
        return 'warning';
      case 'wrong':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const renderQuestionOptions = (question: any) => {
    const format = question.question_format;
    const options = question.options || {};

    if (format === 'single_choice') {
      return (
        <RadioGroup value={question.correct_answer} className="space-y-2">
          {Object.entries(options).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-center space-x-2">
              <RadioGroupItem value={key} id={`${question.id}-${key}`} disabled />
              <Label htmlFor={`${question.id}-${key}`} className="font-normal">
                {key}. {value}
                {key === question.correct_answer && (
                  <Badge className="ml-2 bg-green-100 text-green-800">✅ Correct</Badge>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    if (format === 'multiple_choice') {
      const correctAnswers = question.correct_answer.split(',').map((a: string) => a.trim());
      return (
        <div className="space-y-2">
          {Object.entries(options).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox checked={correctAnswers.includes(key)} disabled />
              <Label className="font-normal">
                {key}. {value}
                {correctAnswers.includes(key) && (
                  <Badge className="ml-2 bg-green-100 text-green-800">✅ Correct</Badge>
                )}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    if (format === 'true_false') {
      return (
        <RadioGroup value={question.correct_answer} className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="True" id={`${question.id}-true`} disabled />
            <Label htmlFor={`${question.id}-true`} className="font-normal">
              True
              {question.correct_answer === 'True' && (
                <Badge className="ml-2 bg-green-100 text-green-800">✅ Correct</Badge>
              )}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="False" id={`${question.id}-false`} disabled />
            <Label htmlFor={`${question.id}-false`} className="font-normal">
              False
              {question.correct_answer === 'False' && (
                <Badge className="ml-2 bg-green-100 text-green-800">✅ Correct</Badge>
              )}
            </Label>
          </div>
        </RadioGroup>
      );
    }

    if (format === 'fill_blank') {
      return (
        <div className="space-y-2">
          <Label>Correct Answer:</Label>
          <div className="px-4 py-2 bg-muted rounded-md font-mono">
            {question.correct_answer}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label>Correct Answer:</Label>
        <div className="px-4 py-2 bg-muted rounded-md whitespace-pre-wrap">
          {question.correct_answer}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Verify Uploaded Questions</h2>
          <p className="text-muted-foreground">
            Review and approve questions extracted from uploaded documents
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter questions by complete hierarchy and LLM status</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={(value) => {
                setCategoryId(value);
                setSubjectId("");
                setChapterId("");
                setTopicId("");
                setSubtopicId("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.display_name || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={(value) => {
                setSubjectId(value);
                setChapterId("");
                setTopicId("");
                setSubtopicId("");
              }} disabled={!categoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select value={chapterId} onValueChange={(value) => {
                setChapterId(value);
                setTopicId("");
                setSubtopicId("");
              }} disabled={!subjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {chapters?.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={topicId} onValueChange={(value) => {
                setTopicId(value);
                setSubtopicId("");
              }} disabled={!chapterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {topics?.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subtopic</Label>
              <Select value={subtopicId} onValueChange={setSubtopicId} disabled={!topicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subtopic" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {subtopics?.map((subtopic) => (
                    <SelectItem key={subtopic.id} value={subtopic.id}>
                      {subtopic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>LLM Status</Label>
              <Select value={llmStatusFilter} onValueChange={setLlmStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="correct">🟢 Correct</SelectItem>
                  <SelectItem value="medium">🟠 Needs Review</SelectItem>
                  <SelectItem value="wrong">🔴 Issues Found</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedQuestions.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedQuestions.length === questions?.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-semibold">{selectedQuestions.length} questions selected</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBulkVerify}
                  disabled={llmVerifyMutation.isPending}
                >
                  {llmVerifyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Run LLM Verification
                </Button>
                <Button
                  onClick={handleBulkApprove}
                  disabled={approveTransferMutation.isPending}
                >
                  {approveTransferMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Check className="h-4 w-4 mr-2" />
                  Approve & Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ) : questions && questions.length > 0 ? (
            questions.map((question: any, index: number) => (
              <Card key={question.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedQuestions.includes(question.id)}
                        onCheckedChange={(checked) => handleSelectQuestion(question.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg">Q{index + 1}</CardTitle>
                        <CardDescription>{question.question_format.replace('_', ' ').toUpperCase()}</CardDescription>
                        {/* Hierarchy Breadcrumb */}
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {question.categories?.name}
                            {' > '}
                            {question.popular_subjects?.name}
                            {' > '}
                            {question.subject_chapters?.title}
                            {' > '}
                            <span className="font-semibold">{question.subject_topics?.title}</span>
                            {question.subtopics?.title && (
                              <>
                                {' > '}
                                <span className="text-muted-foreground">{question.subtopics.title}</span>
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Difficulty Selector */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Difficulty:</Label>
                      <Select
                        value={question.difficulty}
                        onValueChange={(value) => handleDifficultyChange(question.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">
                            <DifficultyBadge level="Low" />
                          </SelectItem>
                          <SelectItem value="Medium">
                            <DifficultyBadge level="Medium" />
                          </SelectItem>
                          <SelectItem value="Intermediate">
                            <DifficultyBadge level="Intermediate" />
                          </SelectItem>
                          <SelectItem value="Advanced">
                            <DifficultyBadge level="Advanced" />
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Show LLM suggestion if different */}
                      {question.llm_suggested_difficulty &&
                        question.llm_suggested_difficulty !== question.difficulty && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary" className="text-xs">
                                🤖 LLM: {question.llm_suggested_difficulty}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{question.llm_difficulty_reasoning}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Question Text with LaTeX Rendering */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Question:</Label>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                      <MathpixRenderer mmdText={question.question_text} inline={true} />
                    </div>
                  </div>

                  {/* Question Images */}
                  {question.question_images && question.question_images.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Question Images:</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {question.question_images.map((img: string, idx: number) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Question image ${idx + 1}`}
                            className="rounded border max-h-64 object-contain"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div>
                    <Label className="text-base font-semibold">Options:</Label>
                    <div className="mt-2">
                      {renderQuestionOptions(question)}
                    </div>
                  </div>

                  {/* Explanation with LaTeX Rendering */}
                  {question.explanation && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Solution:</Label>
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-md">
                        <MathpixRenderer mmdText={question.explanation} inline={true} />
                      </div>
                    </div>
                  )}

                  {/* Explanation Images */}
                  {question.explanation_images && question.explanation_images.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Solution Images:</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {question.explanation_images.map((img: string, idx: number) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Solution image ${idx + 1}`}
                            className="rounded border max-h-64 object-contain"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LLM Verification Status */}
                  {question.llm_verified && (
                    <Alert variant={question.llm_verification_status === 'correct' ? 'default' : 'destructive'}>
                      <div className="flex items-center gap-2">
                        {question.llm_verification_status === 'correct' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {question.llm_verification_status === 'medium' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        {question.llm_verification_status === 'wrong' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        <AlertTitle className="mb-0">
                          {question.llm_verification_status === 'correct' && '🟢 LLM: Correct'}
                          {question.llm_verification_status === 'medium' && '🟠 LLM: Needs Review'}
                          {question.llm_verification_status === 'wrong' && '🔴 LLM: Issues Found'}
                        </AlertTitle>
                        <span className="text-sm ml-auto">
                          Confidence: {(question.llm_confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      {question.llm_verification_comments && (
                        <AlertDescription className="mt-2">
                          {question.llm_verification_comments}
                        </AlertDescription>
                      )}
                    </Alert>
                  )}

                  {/* Instructor Approval Section */}
                  <div className="mt-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                    <h4 className="font-semibold mb-2">👤 Instructor Approval</h4>

                    <Textarea
                      placeholder="Add your review comments (optional)..."
                      value={question.instructor_comments || ''}
                      onChange={(e) => handleCommentChange(question.id, e.target.value)}
                      className="mb-3"
                    />

                    {/* Show approval metadata if already approved */}
                    {question.is_approved ? (
                      <div className="mt-3 p-2 bg-green-50 rounded text-xs">
                        <p>✅ Approved by: {question.approved_by_name || 'Instructor'}</p>
                        <p>📅 At: {new Date(question.approved_at).toLocaleString()}</p>
                        <p>🌐 From IP: {question.approved_ip_address}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`approve-${question.id}`}
                          checked={selectedQuestions.includes(question.id)}
                          onCheckedChange={(checked) => handleSelectQuestion(question.id, checked as boolean)}
                        />
                        <Label htmlFor={`approve-${question.id}`} className="cursor-pointer">
                          Select for approval
                        </Label>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending questions found</p>
                <p className="text-sm">Try adjusting your filters or upload a new document</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
