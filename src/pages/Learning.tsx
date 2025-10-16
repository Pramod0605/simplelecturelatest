import { useState } from "react";
import { useParams } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Circle } from "lucide-react";
import { useChapters } from "@/hooks/useChapters";
import { SubjectNavigationBar } from "@/components/learning/SubjectNavigationBar";
import { PodcastPlayer } from "@/components/learning/PodcastPlayer";
import { MCQTest } from "@/components/learning/MCQTest";
import { NotesViewer } from "@/components/learning/NotesViewer";
import { AssignmentViewer } from "@/components/learning/AssignmentViewer";
import { DPTTest } from "@/components/learning/DPTTest";
import { RecordedVideos } from "@/components/learning/RecordedVideos";
import { AIAssistant } from "@/components/learning/AIAssistant";
import { SEOHead } from "@/components/SEO";

export default function Learning() {
  const { courseId, subjectId } = useParams();
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const { data: chapters, isLoading } = useChapters(courseId, subjectId);

  const mockSubjects = [
    { name: "Physics", slug: "physics" },
    { name: "Chemistry", slug: "chemistry" },
    { name: "Mathematics", slug: "mathematics" }
  ];

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <>
      <SEOHead title="Learning | SimpleLecture" description="Learn with AI-powered tools" />
      <div className="flex flex-col h-screen">
        <SubjectNavigationBar subjects={mockSubjects} />
        
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 border-r bg-card overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">{subjectId?.toUpperCase()}</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {chapters?.map((chapter: any) => (
                  <AccordionItem key={chapter.id} value={chapter.id}>
                    <AccordionTrigger className="hover:bg-accent px-3 rounded">
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{chapter.title}</div>
                        <Progress value={chapter.progress || 0} className="mt-2 h-1" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-4">
                        {chapter.topics?.map((topic: any) => (
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
                            <span className="flex-1 text-left">{topic.title}</span>
                            <span className="text-xs text-muted-foreground">{topic.duration}</span>
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-6">
            {selectedTopic ? (
              <Tabs defaultValue="ai-assistant" className="space-y-4">
                <TabsList className="grid w-full grid-cols-8">
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                  <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
                  <TabsTrigger value="podcast">Podcast</TabsTrigger>
                  <TabsTrigger value="mcqs">MCQs</TabsTrigger>
                  <TabsTrigger value="dpt">DPT</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>

                <TabsContent value="videos">
                  <RecordedVideos topicId={selectedTopic.id} />
                </TabsContent>

                <TabsContent value="ai-assistant">
                  <AIAssistant topicId={selectedTopic.id} courseContext={selectedTopic.title} />
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
                  <NotesViewer content={selectedTopic.content} title={selectedTopic.title} />
                </TabsContent>

                <TabsContent value="assignments">
                  <AssignmentViewer topicId={selectedTopic.id} />
                </TabsContent>

                <TabsContent value="content">
                  <div className="prose dark:prose-invert max-w-none">
                    <h1>{selectedTopic.title}</h1>
                    <div dangerouslySetInnerHTML={{ __html: selectedTopic.content }} />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a topic to start learning</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
