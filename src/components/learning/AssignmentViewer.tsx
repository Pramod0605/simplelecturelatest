import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { mockAssignments, mockQuestions } from "@/data/mockLearning";
import { useToast } from "@/hooks/use-toast";

interface AssignmentViewerProps {
  topicId: string;
}

export const AssignmentViewer = ({ topicId }: AssignmentViewerProps) => {
  const { toast } = useToast();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});

  const assignments = mockAssignments; // In real app, filter by topic_id

  const handleFileUpload = (assignmentId: string, newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles({
      ...files,
      [assignmentId]: [...(files[assignmentId] || []), ...Array.from(newFiles)]
    });
  };

  const handleSubmit = (assignmentId: string) => {
    toast({
      title: "Assignment Submitted",
      description: "Your assignment has been submitted successfully.",
    });
    // Here you would upload files and answers to the backend
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'submitted':
        return <AlertCircle className="h-4 w-4" />;
      case 'graded':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'destructive';
      case 'submitted':
        return 'secondary';
      case 'graded':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (!selectedAssignment) {
    return (
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader onClick={() => setSelectedAssignment(assignment.id)}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{assignment.description}</p>
                </div>
                <Badge variant={getStatusVariant(assignment.status)} className="flex items-center gap-1">
                  {getStatusIcon(assignment.status)}
                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <span className="text-muted-foreground">
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </span>
                  <span className="text-muted-foreground">
                    Total Marks: {assignment.total_marks}
                  </span>
                </div>
                {assignment.score !== undefined && (
                  <span className="font-semibold text-primary">
                    Score: {assignment.score}/{assignment.total_marks}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const assignment = assignments.find(a => a.id === selectedAssignment);
  if (!assignment) return null;

  const questions = mockQuestions.filter(q => assignment.questions.includes(q.id));

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => setSelectedAssignment(null)}>
        ← Back to Assignments
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{assignment.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{assignment.description}</p>
            </div>
            <Badge variant={getStatusVariant(assignment.status)}>
              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </Badge>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground pt-2">
            <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            <span>Total Marks: {assignment.total_marks}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {assignment.status === 'graded' ? (
            <div className="space-y-4">
              <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">Your Score</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {assignment.score}/{assignment.total_marks}
                      </p>
                    </div>
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  {assignment.feedback && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-semibold">Instructor Feedback:</p>
                      <p className="text-sm mt-1">{assignment.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Show questions with correct answers */}
              {questions.map((question, idx) => (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{question.question_text}</p>
                    <div className="space-y-1">
                      {question.options.map((option, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded ${
                            option === question.correct_answer
                              ? 'bg-green-100 dark:bg-green-900 border border-green-500'
                              : 'bg-muted/50'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm font-semibold">Explanation:</p>
                      <p className="text-sm text-muted-foreground">{question.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : assignment.status === 'submitted' ? (
            <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="font-semibold">Assignment Submitted</p>
                <p className="text-sm text-muted-foreground">
                  Submitted on {new Date(assignment.submitted_date!).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your assignment is being graded. Results will be available soon.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Questions to answer */}
              {questions.map((question, idx) => (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="font-medium">{question.question_text}</p>
                    <div className="space-y-2">
                      <Label>Your Answer</Label>
                      <Textarea
                        placeholder="Type your answer here..."
                        value={answers[question.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* File upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attachments (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <Label htmlFor={`file-${assignment.id}`} className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">
                        Click to upload files
                      </span>
                      <span className="text-sm text-muted-foreground"> or drag and drop</span>
                    </Label>
                    <Input
                      id={`file-${assignment.id}`}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(assignment.id, e.target.files)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Images, or Text files (Max 10MB)
                    </p>
                  </div>

                  {files[assignment.id]?.length > 0 && (
                    <div className="space-y-2">
                      {files[assignment.id].map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm flex-1">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Save Draft
                </Button>
                <Button className="flex-1" onClick={() => handleSubmit(assignment.id)}>
                  Submit Assignment
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
