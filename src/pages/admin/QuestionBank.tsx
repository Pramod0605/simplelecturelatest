import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Download, Upload } from "lucide-react";
import { useAdminPopularSubjects } from "@/hooks/useAdminPopularSubjects";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useSubjectChapters, useChapterTopics } from "@/hooks/useSubjectManagement";
import { useSubjectQuestions } from "@/hooks/useSubjectQuestions";
import { QuestionPreview } from "@/components/admin/QuestionPreview";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { EnhancedExcelImportModal } from "@/components/admin/EnhancedExcelImportModal";
import { QuestionFormDialog } from "@/components/admin/QuestionFormDialog";
import * as XLSX from 'xlsx';

export default function QuestionBank() {
  // State for filters and search
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [questionFormat, setQuestionFormat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);

  const { data: categories } = useAdminCategories();
  const { data: subjects } = useAdminPopularSubjects();
  const { data: chapters } = useSubjectChapters(selectedSubject !== "all" ? selectedSubject : undefined);
  const { data: topics } = useChapterTopics(selectedChapter !== "all" ? selectedChapter : undefined);

  // Prepare filters for questions query
  const questionFilters: any = {};
  if (selectedCategory !== "all") {
    questionFilters.categoryId = selectedCategory;
  }
  if (selectedSubject !== "all") {
    questionFilters.subjectId = selectedSubject;
  }
  if (selectedTopic !== "all") {
    questionFilters.topicId = selectedTopic;
  } else if (selectedChapter !== "all") {
    questionFilters.chapterId = selectedChapter;
  }
  if (difficulty !== "all") {
    questionFilters.difficulty = difficulty;
  }

  const { data: questions, isLoading } = useSubjectQuestions(questionFilters);

  // Client-side filtering for search and format
  const filteredQuestions = questions?.filter(q => {
    if (searchQuery && !q.question_text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (questionFormat !== "all" && q.question_format !== questionFormat) {
      return false;
    }
    return true;
  });

  const activeFilterCount = [
    selectedCategory !== "all",
    selectedSubject !== "all",
    selectedChapter !== "all",
    selectedTopic !== "all",
    difficulty !== "all",
    questionFormat !== "all",
    searchQuery.length > 0
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedSubject("all");
    setSelectedChapter("all");
    setSelectedTopic("all");
    setDifficulty("all");
    setQuestionFormat("all");
    setSearchQuery("");
  };

  const handleVerifyQuestion = (id: string, verified: boolean) => {
    // TODO: Implement verify mutation
    toast.success(verified ? "Question verified" : "Verification removed");
  };

  const handleExport = () => {
    if (!filteredQuestions || filteredQuestions.length === 0) {
      toast.error("No questions to export");
      return;
    }

    const exportData = filteredQuestions.map(q => ({
      question_text: q.question_text,
      question_format: q.question_format,
      option_a: q.options?.A || "",
      option_b: q.options?.B || "",
      option_c: q.options?.C || "",
      option_d: q.options?.D || "",
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
      difficulty: q.difficulty,
      marks: q.marks,
      question_type: q.question_type,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, `questions_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${filteredQuestions.length} questions`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
            <p className="text-muted-foreground">
              Centralized repository for all questions across subjects
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button size="sm" onClick={() => setIsAddQuestionOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Filters</CardTitle>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount} active</Badge>
                )}
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select 
                  value={selectedSubject} 
                  onValueChange={setSelectedSubject}
                  disabled={selectedCategory === "all"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Chapter</Label>
                <Select 
                  value={selectedChapter} 
                  onValueChange={setSelectedChapter}
                  disabled={selectedSubject === "all"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chapters</SelectItem>
                    {chapters?.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        Ch {chapter.chapter_number}: {chapter.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Topic</Label>
                <Select 
                  value={selectedTopic} 
                  onValueChange={setSelectedTopic}
                  disabled={selectedChapter === "all"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topics?.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
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

              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={questionFormat} onValueChange={setQuestionFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="single_choice">Single Choice</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="fill_blank">Fill in Blank</SelectItem>
                    <SelectItem value="numerical">Numerical</SelectItem>
                    <SelectItem value="subjective">Subjective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              Questions ({filteredQuestions?.length || 0})
            </CardTitle>
            <CardDescription>
              Showing all matching questions from the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading questions...
              </div>
            ) : filteredQuestions && filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <div key={question.id}>
                    <QuestionPreview
                      question={question}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onVerify={handleVerifyQuestion}
                    />
                    {index < filteredQuestions.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2">No questions found</p>
                <p className="text-sm">
                  {activeFilterCount > 0 
                    ? "Try adjusting your filters or add new questions" 
                    : "Start by adding your first question"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <EnhancedExcelImportModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />

        <QuestionFormDialog
          isOpen={isAddQuestionOpen}
          onClose={() => setIsAddQuestionOpen(false)}
        />
      </div>
  );
}
