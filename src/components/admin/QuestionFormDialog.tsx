import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateQuestion } from "@/hooks/useSubjectQuestions";
import { toast } from "sonner";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useCourses } from "@/hooks/useCourses";
import { useCourseSubjects } from "@/hooks/useCourseSubjects";
import { useSubjectChapters, useChapterTopics } from "@/hooks/useSubjectManagement";

interface QuestionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionFormDialog({ isOpen, onClose }: QuestionFormDialogProps) {
  const [formData, setFormData] = useState({
    categoryId: "",
    courseId: "",
    chapterId: "",
    topicId: "",
    question_text: "",
    question_format: "single_choice",
    question_type: "objective",
    difficulty: "medium",
    marks: 1,
    correct_answer: "",
    explanation: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
  });

  const { data: categories } = useAdminCategories();
  const { data: allCourses } = useCourses();
  const { data: courseSubjects } = useCourseSubjects(formData.courseId);
  const { data: chapters } = useSubjectChapters(courseSubjects?.[0]?.subject_id || "");
  const { data: topics } = useChapterTopics(formData.chapterId);
  const createQuestionMutation = useCreateQuestion();

  const courses = allCourses?.filter(course => {
    if (!formData.categoryId) return true;
    return course.course_categories?.some(cc => cc.category_id === formData.categoryId);
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question_text || !formData.correct_answer) {
      toast.error("Question text and correct answer are required");
      return;
    }

    const options: any = {};
    if (formData.option_a) options.A = formData.option_a;
    if (formData.option_b) options.B = formData.option_b;
    if (formData.option_c) options.C = formData.option_c;
    if (formData.option_d) options.D = formData.option_d;

    try {
      await createQuestionMutation.mutateAsync({
        question_text: formData.question_text,
        question_format: formData.question_format,
        question_type: formData.question_type,
        difficulty: formData.difficulty,
        marks: formData.marks,
        correct_answer: formData.correct_answer.toUpperCase(),
        explanation: formData.explanation || null,
        options: Object.keys(options).length > 0 ? options : null,
        topic_id: formData.topicId || null,
        is_verified: false,
        is_ai_generated: false,
        contains_formula: false,
      });

      toast.success("Question created successfully");
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create question");
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: "",
      courseId: "",
      chapterId: "",
      topicId: "",
      question_text: "",
      question_format: "single_choice",
      question_type: "objective",
      difficulty: "medium",
      marks: 1,
      correct_answer: "",
      explanation: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
          <DialogDescription>Create a new question for the question bank</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category & Course */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.categoryId} onValueChange={(v) => handleChange("categoryId", v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Course *</Label>
              <Select value={formData.courseId} onValueChange={(v) => handleChange("courseId", v)} disabled={!formData.categoryId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chapter & Topic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chapter (Optional)</Label>
              <Select value={formData.chapterId} onValueChange={(v) => handleChange("chapterId", v)} disabled={!formData.courseId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {chapters?.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Topic (Optional)</Label>
              <Select value={formData.topicId} onValueChange={(v) => handleChange("topicId", v)} disabled={!formData.chapterId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {topics?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <Label>Question Text *</Label>
            <Textarea
              value={formData.question_text}
              onChange={(e) => handleChange("question_text", e.target.value)}
              placeholder="Enter the question"
              rows={3}
            />
          </div>

          {/* Format, Type, Difficulty, Marks */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={formData.question_format} onValueChange={(v) => handleChange("question_format", v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="single_choice">Single Choice</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="fill_blank">Fill Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.question_type} onValueChange={(v) => handleChange("question_type", v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="objective">Objective</SelectItem>
                  <SelectItem value="subjective">Subjective</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(v) => handleChange("difficulty", v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
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
                value={formData.marks}
                onChange={(e) => handleChange("marks", parseInt(e.target.value))}
                min={1}
              />
            </div>
          </div>

          {/* Options */}
          {formData.question_format !== "fill_blank" && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Option A" value={formData.option_a} onChange={(e) => handleChange("option_a", e.target.value)} />
                <Input placeholder="Option B" value={formData.option_b} onChange={(e) => handleChange("option_b", e.target.value)} />
                <Input placeholder="Option C" value={formData.option_c} onChange={(e) => handleChange("option_c", e.target.value)} />
                <Input placeholder="Option D" value={formData.option_d} onChange={(e) => handleChange("option_d", e.target.value)} />
              </div>
            </div>
          )}

          {/* Correct Answer */}
          <div className="space-y-2">
            <Label>Correct Answer *</Label>
            <Input
              value={formData.correct_answer}
              onChange={(e) => handleChange("correct_answer", e.target.value)}
              placeholder="e.g., A or B,C for multiple choice"
            />
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label>Explanation (Optional)</Label>
            <Textarea
              value={formData.explanation}
              onChange={(e) => handleChange("explanation", e.target.value)}
              placeholder="Explain the correct answer"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createQuestionMutation.isPending}>
              {createQuestionMutation.isPending ? "Creating..." : "Create Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}