import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface QuestionPreviewProps {
  question: any;
  onEdit: (question: any) => void;
  onDelete: (id: string) => void;
  onVerify: (id: string, verified: boolean) => void;
}

export function QuestionPreview({ question, onEdit, onDelete, onVerify }: QuestionPreviewProps) {
  const [showFullPreview, setShowFullPreview] = useState(false);

  const renderContent = (content: string, containsFormula: boolean) => {
    if (!content) return null;
    
    // For now, render as-is. In production, you'd parse LaTeX/MathML
    return (
      <div className="prose prose-sm max-w-none">
        {containsFormula ? (
          <div className="font-mono bg-muted p-2 rounded text-sm">{content}</div>
        ) : (
          <p>{content}</p>
        )}
      </div>
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-base line-clamp-2">
                {question.question_text}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty}
                </Badge>
                {question.is_verified ? (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-orange-500 text-orange-700">
                    Pending
                  </Badge>
                )}
                {question.is_ai_generated && (
                  <Badge variant="secondary">AI Generated</Badge>
                )}
                {question.contains_formula && (
                  <Badge variant="outline">Contains Formula</Badge>
                )}
                <Badge variant="outline">{question.marks} mark(s)</Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullPreview(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(question)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(question.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Format: {question.question_format?.replace(/_/g, " ")}
            </div>
            {question.options && Object.keys(question.options).length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Options: </span>
                {Object.keys(question.options).length} choices
              </div>
            )}
            <div className="text-sm">
              <span className="font-medium">Correct Answer: </span>
              <span className="text-green-600">{question.correct_answer}</span>
            </div>
            {!question.is_verified && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={() => onVerify(question.id, true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verify Question
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Preview Modal */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Question */}
            <div>
              <h4 className="font-semibold mb-2">Question:</h4>
              {renderContent(question.question_text, question.contains_formula)}
              {question.question_image_url && (
                <img 
                  src={question.question_image_url} 
                  alt="Question" 
                  className="mt-2 max-w-full h-auto rounded border"
                />
              )}
            </div>

            {/* Options */}
            {question.options && Object.keys(question.options).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Options:</h4>
                <div className="space-y-2">
                  {Object.entries(question.options).map(([key, value]: [string, any]) => (
                    <div 
                      key={key} 
                      className={`p-3 rounded border ${
                        key === question.correct_answer 
                          ? "bg-green-50 border-green-500" 
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-medium">{key}.</span>
                        <div className="flex-1">
                          {renderContent(value.text, question.contains_formula)}
                          {question.option_images?.[key] && (
                            <img 
                              src={question.option_images[key]} 
                              alt={`Option ${key}`} 
                              className="mt-2 max-w-sm h-auto rounded border"
                            />
                          )}
                        </div>
                        {key === question.correct_answer && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correct Answer */}
            <div>
              <h4 className="font-semibold mb-2">Correct Answer:</h4>
              <Badge className="bg-green-100 text-green-800 text-base px-3 py-1">
                {question.correct_answer}
              </Badge>
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div>
                <h4 className="font-semibold mb-2">Explanation:</h4>
                {renderContent(question.explanation, question.contains_formula)}
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4 text-sm text-muted-foreground">
              <div className="grid grid-cols-2 gap-2">
                <div>Difficulty: <span className="font-medium">{question.difficulty}</span></div>
                <div>Marks: <span className="font-medium">{question.marks}</span></div>
                <div>Format: <span className="font-medium">{question.question_format}</span></div>
                <div>Type: <span className="font-medium">{question.question_type}</span></div>
                {question.contains_formula && (
                  <div>Formula Type: <span className="font-medium">{question.formula_type || 'plain'}</span></div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
