import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { usePendingQuestions } from "@/hooks/usePendingQuestions";
import { useUploadedDocuments } from "@/hooks/useUploadedDocuments";
import { useBulkAutoAssignChapters } from "@/hooks/useBulkAutoAssignChapters";
import { useMarkDocumentVerified } from "@/hooks/useMarkDocumentVerified";
import { ChapterTopicSelector } from "@/components/admin/ChapterTopicSelector";
import { useUpdateQuestionAssignment } from "@/hooks/useUpdateQuestionAssignment";
import { MathpixRenderer } from "@/components/admin/MathpixRenderer";
import { useState } from "react";

export default function DocumentVerificationDetail() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const { data: documents } = useUploadedDocuments({});
  const document = documents?.find((d: any) => d.id === documentId);
  
  const { data: questions } = usePendingQuestions({ documentId });
  const bulkAssignMutation = useBulkAutoAssignChapters();
  const verifyMutation = useMarkDocumentVerified();
  const updateAssignmentMutation = useUpdateQuestionAssignment();

  const handleBulkAutoAssign = () => {
    if (documentId) {
      bulkAssignMutation.mutate({ documentId });
    }
  };

  const handleCompleteVerification = () => {
    if (documentId) {
      const approvedCount = questions?.filter((q: any) => q.is_approved).length || 0;
      const avgConfidence = questions?.reduce((sum: number, q: any) => sum + (q.llm_confidence_score || 0), 0) / (questions?.length || 1);
      const qualityScore = avgConfidence * (approvedCount / (questions?.length || 1));

      verifyMutation.mutate({
        documentId,
        verificationType: 'human',
        qualityScore,
        notes: 'Verification completed'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/question-bank/verify')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Verify Questions</h2>
          <p className="text-muted-foreground">{document?.questions_file_name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bulk Actions</span>
            <div className="flex gap-2">
              <Button onClick={handleBulkAutoAssign} disabled={bulkAssignMutation.isPending}>
                {bulkAssignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Auto-Assign All
              </Button>
              <Button onClick={handleCompleteVerification} disabled={verifyMutation.isPending}>
                {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Complete Verification
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {questions?.map((q: any, index: number) => (
          <Card key={q.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge>Question {index + 1}</Badge>
                  <Badge variant="outline">{q.question_format}</Badge>
                  <Badge variant="outline">{q.difficulty}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Question:</h4>
                <MathpixRenderer text={q.question_text} />
              </div>

              {document && (
                <ChapterTopicSelector
                  questionText={q.question_text}
                  subjectId={document.subject_id}
                  subjectName={document.popular_subjects?.name}
                  categoryName={document.categories?.name}
                  currentChapterId={q.chapter_id}
                  currentTopicId={q.topic_id}
                  currentSubtopicId={q.subtopic_id}
                  onAssignmentChange={(chapterId, topicId, subtopicId) => {
                    updateAssignmentMutation.mutate({
                      questionId: q.id,
                      chapterId,
                      topicId,
                      subtopicId
                    });
                  }}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
