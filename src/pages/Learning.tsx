import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Circle, Lock, AlertCircle, PanelLeftClose, PanelLeft, FolderOpen } from "lucide-react";
import { SubjectNavigationBar } from "@/components/learning/SubjectNavigationBar";
import { MCQTest } from "@/components/learning/MCQTest";
import { AssignmentViewer } from "@/components/learning/AssignmentViewer";
import { RecordedVideos } from "@/components/learning/RecordedVideos";
import { AITeachingAssistant } from "@/components/learning/AITeachingAssistant";
import { PreviousYearPapers } from "@/components/learning/PreviousYearPapers";
import { PaperTestResults } from "@/components/learning/PaperTestResults";
import { CourseWelcomeCards } from "@/components/learning/CourseWelcomeCards";
import { SEOHead } from "@/components/SEO";
import { useLearningCourse, useSubjectChapters } from "@/hooks/useLearningCourse";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Learning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [chapterTab, setChapterTab] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");

  const { data: learningData, isLoading: courseLoading } = useLearningCourse(courseId);
  const { data: chapters, isLoading: chaptersLoading } = useSubjectChapters(selectedSubjectId || undefined);

  // Handle URL query params for subject and tab
  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    const tabParam = searchParams.get('tab');
    
    if (subjectParam && learningData?.subjects?.some(s => s.id === subjectParam)) {
      setSelectedSubjectId(subjectParam);
    }
    
    if (tabParam) {
      setActiveTab(tabParam);
      if (tabParam === 'ai-assistant') {
        setSidebarCollapsed(true);
      }
    }
  }, [searchParams, learningData?.subjects]);

  // Set first subject as default when subjects load (only if no URL param)
  useEffect(() => {
    if (learningData?.subjects?.length && !selectedSubjectId && !searchParams.get('subject')) {
      setSelectedSubjectId(learningData.subjects[0].id);
    }
  }, [learningData?.subjects, selectedSubjectId, searchParams]);

  // Auto-collapse sidebar when AI Assistant tab is selected
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (value === "ai-assistant") {
      setSidebarCollapsed(true);
    }
  }, []);

  // Handle access control
  if (courseLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-14 border-b bg-card">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex flex-1 p-6 gap-6">
          <Skeleton className="w-80 h-full" />
          <Skeleton className="flex-1 h-96" />
        </div>
      </div>
    );
  }

  if (learningData?.error === "not_authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">
              Please login to access your courses.
            </p>
            <Button onClick={() => navigate("/auth")}>
              Login / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (learningData?.error === "not_enrolled") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You are not enrolled in this course. Please enroll to access the learning content.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate("/my-courses")}>
                My Courses
              </Button>
              <Button onClick={() => navigate("/programs")}>
                Browse Programs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (learningData?.error === "course_not_found") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/my-courses")}>
              Go to My Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subjects = learningData?.subjects || [];
  const course = learningData?.course;
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopic(null);
    setSelectedChapter(null);
    setChapterTab(null);
  };

  const handleChapterTabClick = (chapter: any, tab: string) => {
    setSelectedChapter(chapter);
    setChapterTab(tab);
    setSelectedTopic(null);
    setActiveTab(tab);
    if (tab === "ai-assistant") {
      setSidebarCollapsed(true);
    }
  };

  return (
    <>
      <SEOHead 
        title={`${course?.name || "Learning"} | SimpleLecture`} 
        description="Learn with AI-powered tools" 
      />
      <div className="flex flex-col h-screen">
        <SubjectNavigationBar 
          subjects={subjects.map(s => ({ name: s.name, slug: s.slug, id: s.id }))} 
          selectedSubjectId={selectedSubjectId}
          onSubjectChange={handleSubjectChange}
          courseName={course?.name}
        />
        
        <div className="flex flex-1 overflow-hidden relative">
          {/* Expand button when collapsed - top left position */}
          {sidebarCollapsed && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-2 z-10 bg-gradient-to-br from-primary/20 to-primary/5 shadow-md hover:shadow-lg border-primary/20 hover:bg-primary/15 transition-all duration-300"
              onClick={() => setSidebarCollapsed(false)}
              title="Expand sidebar"
            >
              <PanelLeft className="h-4 w-4 text-primary" />
            </Button>
          )}

          <aside className={cn(
            "border-r overflow-y-auto transition-all duration-300 flex flex-col",
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
          )}>
            <div className="p-4 flex-1">
              {/* Header with title and collapse button */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
                <h2 className="text-lg font-bold text-foreground">{selectedSubject?.name || "Select Subject"}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-primary/10 h-8 w-8 text-primary"
                  onClick={() => setSidebarCollapsed(true)}
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
              
              {chaptersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : chapters && chapters.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-3">
                  {chapters.map((chapter: any) => (
                    <AccordionItem key={chapter.id} value={chapter.id} className="border-0 rounded-xl overflow-hidden shadow-sm">
                      <AccordionTrigger className="hover:bg-primary/15 px-4 py-3 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 transition-all duration-300 hover:shadow-md">
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-sm text-foreground">
                            Ch {chapter.chapter_number}: {chapter.title}
                          </div>
                          <Progress value={chapter.progress || 0} className="mt-2 h-1.5 bg-primary/20" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-3 px-2">
                        {/* Chapter Content button */}
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-sm mb-3 rounded-lg transition-all duration-300",
                            selectedChapter?.id === chapter.id && !selectedTopic 
                              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md" 
                              : "bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10"
                          )}
                          onClick={() => {
                            setSelectedChapter(chapter);
                            setSelectedTopic(null);
                            setChapterTab(null);
                            setActiveTab("videos");
                          }}
                        >
                          <div className={cn(
                            "p-1.5 rounded-lg mr-2",
                            selectedChapter?.id === chapter.id && !selectedTopic 
                              ? "bg-primary-foreground/20" 
                              : "bg-primary/10"
                          )}>
                            <FolderOpen className="h-4 w-4" />
                          </div>
                          Chapter Content
                        </Button>

                        {/* Topics section */}
                        <div className="space-y-1 pl-2 ml-2 border-l-2 border-primary/20">
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Topics</p>
                          {chapter.topics?.length > 0 ? (
                            chapter.topics.map((topic: any) => (
                              <Button
                                key={topic.id}
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start text-sm rounded-lg transition-all duration-300",
                                  selectedTopic?.id === topic.id 
                                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md" 
                                    : "hover:bg-primary/10"
                                )}
                                onClick={() => {
                                  setSelectedTopic(topic);
                                  setSelectedChapter(null);
                                  setChapterTab(null);
                                }}
                              >
                                {topic.completed ? (
                                  <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 mr-2">
                                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                                  </div>
                                ) : (
                                  <div className={cn(
                                    "p-1 rounded-full mr-2",
                                    selectedTopic?.id === topic.id 
                                      ? "bg-primary-foreground/20" 
                                      : "bg-primary/10"
                                  )}>
                                    <Circle className="h-3 w-3" />
                                  </div>
                                )}
                                <span className="flex-1 text-left truncate">{topic.title}</span>
                                {topic.estimated_duration_minutes && (
                                  <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                    selectedTopic?.id === topic.id 
                                      ? "bg-primary-foreground/20 text-primary-foreground" 
                                      : "bg-primary/10 text-primary"
                                  )}>
                                    {topic.estimated_duration_minutes}m
                                  </span>
                                )}
                              </Button>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground py-2">
                              No topics available
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {selectedSubjectId ? "No chapters available for this subject" : "Select a subject to view chapters"}
                  </p>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-6">
            {selectedTopic ? (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList className="grid w-full grid-cols-6 p-1.5 h-auto bg-slate-100/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                  <TabsTrigger 
                    value="videos"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Classes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ai-assistant"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    AI Assistant
                  </TabsTrigger>
                  <TabsTrigger 
                    value="mcqs"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 hover:text-green-600 dark:hover:text-green-400"
                  >
                    MCQs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assignments"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    Assignments
                  </TabsTrigger>
                  <TabsTrigger 
                    value="previous-year"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Mock & PYQs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="my-results"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    My Results
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="videos">
                  <RecordedVideos 
                    topicId={selectedTopic.id}
                    topicVideoId={selectedTopic.video_id}
                    topicVideoPlatform={selectedTopic.video_platform}
                    topicTitle={selectedTopic.title}
                    aiGeneratedVideoUrl={selectedTopic.ai_generated_video_url}
                  />
                </TabsContent>

                <TabsContent value="ai-assistant">
                  <AITeachingAssistant 
                    topicId={selectedTopic.id} 
                    chapterId={selectedTopic.chapter_id}
                    topicTitle={selectedTopic.title}
                    subjectName={selectedSubject?.name}
                  />
                </TabsContent>

                <TabsContent value="mcqs">
                  <MCQTest topicId={selectedTopic.id} />
                </TabsContent>

                <TabsContent value="assignments">
                  <AssignmentViewer topicId={selectedTopic.id} />
                </TabsContent>

                <TabsContent value="previous-year">
                  <PreviousYearPapers 
                    subjectId={selectedSubjectId} 
                    topicId={selectedTopic?.id}
                    onViewResults={() => setActiveTab("my-results")}
                  />
                </TabsContent>

                <TabsContent value="my-results">
                  <PaperTestResults subjectId={selectedSubjectId} />
                </TabsContent>
              </Tabs>
            ) : selectedChapter ? (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-semibold">
                    Ch {selectedChapter.chapter_number}: {selectedChapter.title}
                  </h2>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                    Chapter Level
                  </span>
                </div>
                
                <TabsList className="grid w-full grid-cols-6 p-1.5 h-auto bg-slate-100/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                  <TabsTrigger 
                    value="videos"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Classes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ai-assistant"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    AI Assistant
                  </TabsTrigger>
                  <TabsTrigger 
                    value="mcqs"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 hover:text-green-600 dark:hover:text-green-400"
                  >
                    MCQs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assignments"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    Assignments
                  </TabsTrigger>
                  <TabsTrigger 
                    value="previous-year"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Mock & PYQs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="my-results"
                    className="py-2.5 rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    My Results
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="videos">
                  <RecordedVideos 
                    chapterId={selectedChapter.id}
                    topicTitle={`Ch ${selectedChapter.chapter_number}: ${selectedChapter.title}`}
                    aiGeneratedVideoUrl={selectedChapter.ai_generated_video_url}
                  />
                </TabsContent>

                <TabsContent value="ai-assistant">
                  <AITeachingAssistant 
                    chapterId={selectedChapter.id}
                    topicTitle={`Ch ${selectedChapter.chapter_number}: ${selectedChapter.title}`}
                    subjectName={selectedSubject?.name}
                  />
                </TabsContent>

                <TabsContent value="mcqs">
                  <MCQTest chapterId={selectedChapter.id} chapterOnly />
                </TabsContent>

                <TabsContent value="assignments">
                  <AssignmentViewer chapterId={selectedChapter.id} />
                </TabsContent>

                <TabsContent value="previous-year">
                  <PreviousYearPapers 
                    subjectId={selectedSubjectId} 
                    chapterId={selectedChapter.id}
                    chapterOnly
                    onViewResults={() => setActiveTab("my-results")}
                  />
                </TabsContent>

                <TabsContent value="my-results">
                  <PaperTestResults subjectId={selectedSubjectId} />
                </TabsContent>
              </Tabs>
            ) : (
              <CourseWelcomeCards courseName={course?.name || "this course"} />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
