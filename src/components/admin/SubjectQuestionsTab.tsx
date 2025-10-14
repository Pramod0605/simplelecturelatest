import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Brain, FileText, CheckCircle, XCircle, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface SubjectQuestionsTabProps {
  subjectId: string;
  subjectName: string;
}

export function SubjectQuestionsTab({ subjectId, subjectName }: SubjectQuestionsTabProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Question Bank</CardTitle>
              <CardDescription>
                Manage questions for {subjectName}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Brain className="mr-2 h-4 w-4" />
                    AI Generate
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Generate Questions with AI</DialogTitle>
                    <DialogDescription>
                      Use AI to automatically generate questions for selected topics
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Chapter</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a chapter" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="ch1">Chapter 1: Mechanics</SelectItem>
                          <SelectItem value="ch2">Chapter 2: Thermodynamics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Select Topic(s)</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose topic(s)" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="t1">Newton's Laws</SelectItem>
                          <SelectItem value="t2">Work & Energy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="num-questions">Number of Questions</Label>
                        <Input id="num-questions" type="number" defaultValue={10} min={1} max={50} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select defaultValue="mixed">
                          <SelectTrigger id="difficulty">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background">
                            <SelectItem value="mixed">Mixed</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="format">Question Format</Label>
                        <Select defaultValue="single_choice">
                          <SelectTrigger id="format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background">
                            <SelectItem value="single_choice">Single Choice</SelectItem>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                            <SelectItem value="subjective">Subjective</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted p-4">
                      <h4 className="font-medium mb-2">AI Generation Settings</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Model:</span>
                          <span className="font-medium text-foreground">Gemini 2.5 Flash</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Questions per topic:</span>
                          <span className="font-medium text-foreground">10</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Difficulty distribution:</span>
                          <span className="font-medium text-foreground">30% Easy, 50% Medium, 20% Hard</span>
                        </div>
                      </div>
                      <Button variant="link" size="sm" className="mt-2 h-auto p-0">
                        Modify in Settings
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsGenerateOpen(false)}>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate Questions
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddManualOpen} onOpenChange={setIsAddManualOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Manual
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Question Manually</DialogTitle>
                    <DialogDescription>
                      Create a new question for this subject
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="manual-chapter">Chapter *</Label>
                      <Select>
                        <SelectTrigger id="manual-chapter">
                          <SelectValue placeholder="Select chapter" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="ch1">Chapter 1: Mechanics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manual-topic">Topic *</Label>
                      <Select>
                        <SelectTrigger id="manual-topic">
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="t1">Newton's Laws</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question-text">Question Text *</Label>
                      <Textarea
                        id="question-text"
                        placeholder="Enter the question..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="question-type">Question Type *</Label>
                        <Select defaultValue="single_choice">
                          <SelectTrigger id="question-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background">
                            <SelectItem value="single_choice">Single Choice</SelectItem>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                            <SelectItem value="subjective">Subjective</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="manual-difficulty">Difficulty *</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="manual-difficulty">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background">
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Options</Label>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                          <Input key={i} placeholder={`Option ${i}`} />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="correct-answer">Correct Answer *</Label>
                      <Input id="correct-answer" placeholder="Enter correct answer" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="explanation">Explanation</Label>
                      <Textarea
                        id="explanation"
                        placeholder="Explain why this is the correct answer..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddManualOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddManualOpen(false)}>
                      Add Question
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background">
                  <DialogHeader>
                    <DialogTitle>Bulk Upload Questions</DialogTitle>
                    <DialogDescription>
                      Upload multiple questions from a CSV or Excel file
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your file here, or click to browse
                      </p>
                      <Button variant="outline" size="sm">
                        Choose File
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>File Format</Label>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: CSV, XLSX. Download the template file to ensure correct format.
                      </p>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        <FileText className="mr-2 h-4 w-4" />
                        Download Template
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsBulkUploadOpen(false)}>
                      Upload Questions
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All Questions</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="pending">Pending Review</TabsTrigger>
                <TabsTrigger value="ai-generated">AI Generated</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="all">All Difficulty</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              {questions.length === 0 ? (
                <div className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No questions yet</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setIsGenerateOpen(true)}>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate with AI
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddManualOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Manually
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Question list will be populated here */}
                </div>
              )}
            </TabsContent>

            <TabsContent value="verified">
              <p className="text-center text-muted-foreground py-8">No verified questions yet</p>
            </TabsContent>

            <TabsContent value="pending">
              <p className="text-center text-muted-foreground py-8">No questions pending review</p>
            </TabsContent>

            <TabsContent value="ai-generated">
              <p className="text-center text-muted-foreground py-8">No AI generated questions yet</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
