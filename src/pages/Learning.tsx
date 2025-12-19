import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Circle, Lock, AlertCircle, PanelLeftClose, PanelLeft } from "lucide-react";
import { SubjectNavigationBar } from "@/components/learning/SubjectNavigationBar";
import { PodcastPlayer } from "@/components/learning/PodcastPlayer";
import { MCQTest } from "@/components/learning/MCQTest";
import { NotesViewer } from "@/components/learning/NotesViewer";
import { AssignmentViewer } from "@/components/learning/AssignmentViewer";
import { DPTTest } from "@/components/learning/DPTTest";
import { RecordedVideos } from "@/components/learning/RecordedVideos";
import { AITeachingAssistant } from "@/components/learning/AITeachingAssistant";
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
              className="absolute left-2 top-2 z-10 bg-card shadow-md hover:bg-accent"
              onClick={() => setSidebarCollapsed(false)}
              title="Expand sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}

          <aside className={cn(
            "border-r bg-card overflow-y-auto transition-all duration-300 flex flex-col",
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
          )}>
            <div className="p-4 flex-1">
              {/* Header with title and collapse button */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{selectedSubject?.name || "Select Subject"}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent h-8 w-8"
                  onClick={() => setSidebarCollapsed(true)}
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
              
              {chaptersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : chapters && chapters.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-2">
                  {chapters.map((chapter: any) => (
                    <AccordionItem key={chapter.id} value={chapter.id} className="border-b-0">
                      <AccordionTrigger className="hover:bg-accent/50 px-3 py-2 rounded-lg bg-primary/10">
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-sm text-foreground">
                            Ch {chapter.chapter_number}: {chapter.title}
                          </div>
                          <Progress value={chapter.progress || 0} className="mt-2 h-1" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 pl-4">
                          {chapter.topics?.length > 0 ? (
                            chapter.topics.map((topic: any) => (
                              <Button
                                key={topic.id}
                                variant={selectedTopic?.id === topic.id ? "secondary" : "ghost"}
                                className="w-full justify-start text-sm"
                                onClick={() => setSelectedTopic(topic)}
                              >
                                {topic.completed ? (
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                ) : (
                                  <Circle className="h-4 w-4 mr-2" />
                                )}
                                <span className="flex-1 text-left truncate">{topic.title}</span>
                                {topic.estimated_duration_minutes && (
                                  <span className="text-xs text-muted-foreground ml-2">
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
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                  <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
                  <TabsTrigger value="podcast">Podcast</TabsTrigger>
                  <TabsTrigger value="mcqs">MCQs</TabsTrigger>
                  <TabsTrigger value="dpt">DPT</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="videos">
                  <RecordedVideos 
                    topicId={selectedTopic.id}
                    topicVideoId={selectedTopic.video_id}
                    topicVideoPlatform={selectedTopic.video_platform}
                    topicTitle={selectedTopic.title}
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

                <TabsContent value="podcast">
                  <PodcastPlayer topicId={selectedTopic.id} />
                </TabsContent>

                <TabsContent value="mcqs">
                  <MCQTest topicId={selectedTopic.id} />
                </TabsContent>

                <TabsContent value="dpt">
                  <DPTTest />
                </TabsContent>

                <TabsContent value="notes">
                  <NotesViewer content={selectedTopic.content_markdown} title={selectedTopic.title} />
                </TabsContent>

                <TabsContent value="assignments">
                  <AssignmentViewer topicId={selectedTopic.id} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Welcome to {course?.name}</h3>
                  <p className="text-muted-foreground">
                    Select a topic from the sidebar to start learning
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
