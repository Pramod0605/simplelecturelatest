import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateQuestion } from "@/hooks/useSubjectQuestions";
import { toast } from "sonner";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useCourses } from "@/hooks/useCourses";
import { useCourseSubjects } from "@/hooks/useCourseSubjects";
import { useSubjectChapters, useChapterTopics } from "@/hooks/useSubjectManagement";
import { QuestionTabContent } from "./question/QuestionTabContent";
import { OptionsTabContent } from "./question/OptionsTabContent";
import { DetailsTabContent } from "./question/DetailsTabContent";

interface QuestionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionFormDialog({ isOpen, onClose }: QuestionFormDialogProps) {
  const [activeTab, setActiveTab] = useState("question");
  const [formData, setFormData] = useState({
    id: "",
    categoryId: "",
    courseId: "",
    chapter_id: "",
    topic_id: "",
    question_text: "",
    question_format: "single_choice",
    question_type: "objective",
    difficulty: "medium",
    marks: 1,
    correct_answer: "",
    explanation: "",
    contains_formula: false,
    options: {} as Record<string, string>,
    question_images: [] as string[],
    option_images: {} as Record<string, string[]>,
    explanation_images: [] as string[],
  });

  const { data: categories } = useAdminCategories();
  const { data: allCourses } = useCourses();
  const { data: courseSubjects } = useCourseSubjects(formData.courseId);
  const { data: chapters } = useSubjectChapters(courseSubjects?.[0]?.subject_id || "");
  const { data: topics } = useChapterTopics(formData.chapter_id);
  const createQuestionMutation = useCreateQuestion();

  const courses = allCourses?.filter(course => {
    if (!formData.categoryId) return true;
    return course.course_categories?.some(cc => cc.category_id === formData.categoryId);
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-determine question_type based on format
      if (field === 'question_format') {
        if (['single_choice', 'multiple_choice', 'true_false'].includes(value)) {
          updated.question_type = 'objective';
        } else if (['fill_blank', 'short_answer'].includes(value)) {
          updated.question_type = 'subjective';
        }
      }
      
      return updated;
    });
  };

  const handleOptionChange = (option: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: { ...prev.options, [option]: value }
    }));
  };

  const handleOptionImageChange = (option: string, images: string[]) => {
    setFormData(prev => ({
      ...prev,
      option_images: { ...prev.option_images, [option]: images }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question_text || !formData.correct_answer) {
      toast.error("Question text and correct answer are required");
      return;
    }

    if (!formData.topic_id) {
      toast.error("Please select a topic");
      return;
    }

    try {
      // Get primary image URL from images array
      const question_image_url = formData.question_images?.[0] || null;
      
      // Convert option_images arrays to single URLs (first image of each)
      const option_images_obj: Record<string, string> = {};
      Object.entries(formData.option_images || {}).forEach(([key, images]) => {
        if (images && images.length > 0) {
          option_images_obj[key] = images[0];
        }
      });

      await createQuestionMutation.mutateAsync({
        question_text: formData.question_text,
        question_format: formData.question_format,
        question_type: formData.question_type,
        difficulty: formData.difficulty,
        marks: formData.marks,
        correct_answer: formData.correct_answer.toUpperCase(),
        explanation: formData.explanation || null,
        options: Object.keys(formData.options).length > 0 ? formData.options : null,
        topic_id: formData.topic_id,
        is_verified: false,
        is_ai_generated: false,
        contains_formula: formData.contains_formula,
        question_image_url,
        option_images: Object.keys(option_images_obj).length > 0 ? option_images_obj : null,
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
      id: "",
      categoryId: "",
      courseId: "",
      chapter_id: "",
      topic_id: "",
      question_text: "",
      question_format: "single_choice",
      question_type: "objective",
      difficulty: "medium",
      marks: 1,
      correct_answer: "",
      explanation: "",
      contains_formula: false,
      options: {},
      question_images: [],
      option_images: {},
      explanation_images: [],
    });
    setActiveTab("question");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
          <DialogDescription>
            Create a new question with rich content and image support
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="question">Question</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="question" className="space-y-4 mt-4">
              <QuestionTabContent
                formData={formData}
                onChange={handleChange}
                chapters={chapters || []}
                topics={topics || []}
              />
            </TabsContent>

            <TabsContent value="options" className="space-y-4 mt-4">
              <OptionsTabContent
                formData={formData}
                onChange={handleChange}
                onOptionChange={handleOptionChange}
                onOptionImageChange={handleOptionImageChange}
              />
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <DetailsTabContent
                formData={formData}
                onChange={handleChange}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createQuestionMutation.isPending}>
              {createQuestionMutation.isPending ? "Creating..." : "Create Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}