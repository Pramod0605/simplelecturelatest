import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, MessageSquare, Headphones, ClipboardList, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SEOHead } from '@/components/SEO';

const Learning = () => {
  const { courseId, subjectId } = useParams();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Mock chapter/topic data
  const chapters = [
    {
      id: '1',
      title: 'Units and Measurements',
      topics: [
        { id: '1-1', title: 'Physical Quantities', duration: '30 min', completed: true },
        { id: '1-2', title: 'SI Units', duration: '25 min', completed: false },
        { id: '1-3', title: 'Dimensional Analysis', duration: '40 min', completed: false },
      ],
    },
    {
      id: '2',
      title: 'Motion in a Straight Line',
      topics: [
        { id: '2-1', title: 'Position and Displacement', duration: '25 min', completed: false },
        { id: '2-2', title: 'Velocity and Speed', duration: '30 min', completed: false },
      ],
    },
  ];

  return (
    <>
      <SEOHead title="Learning | SimpleLecture" description="Learn with AI-powered tools" />
      <div className="min-h-screen bg-background flex">
        {/* Sidebar - Chapters & Topics */}
        <div className="w-80 border-r bg-card overflow-y-auto">
          <div className="p-4 border-b">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h2 className="font-bold text-lg mt-4">Physics</h2>
            <Progress value={15} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">15% Complete</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {chapters.map((chapter) => (
              <AccordionItem key={chapter.id} value={chapter.id}>
                <AccordionTrigger className="px-4 text-sm font-semibold">
                  {chapter.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {chapter.topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic.id)}
                        className={`w-full text-left px-6 py-3 text-sm hover:bg-muted transition-colors ${
                          selectedTopic === topic.id ? 'bg-muted font-medium' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {topic.completed ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-muted-foreground">○</span>
                            )}
                            {topic.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{topic.duration}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {selectedTopic ? (
              <>
                <h1 className="text-3xl font-bold mb-6">Physical Quantities</h1>

                <Tabs defaultValue="tutorial" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="tutorial">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      AI Tutorial
                    </TabsTrigger>
                    <TabsTrigger value="assistant">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      AI Assistant
                    </TabsTrigger>
                    <TabsTrigger value="podcast">
                      <Headphones className="mr-2 h-4 w-4" />
                      Podcast
                    </TabsTrigger>
                    <TabsTrigger value="mcqs">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      MCQs
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                      <FileText className="mr-2 h-4 w-4" />
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="assignments">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Assignments
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tutorial" className="space-y-4 mt-6">
                    <Card className="aspect-video bg-muted flex items-center justify-center">
                      <PlayCircle className="h-24 w-24 text-primary" />
                    </Card>
                    <div className="flex gap-4">
                      <Button>Mark as Complete</Button>
                      <Button variant="outline">Next Topic</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="assistant" className="mt-6">
                    <Card className="p-6 h-[600px] flex flex-col">
                      <h3 className="font-bold mb-4">AI Doubt Clearing Assistant</h3>
                      <div className="flex-1 bg-muted rounded-lg p-4 mb-4 overflow-y-auto">
                        <p className="text-muted-foreground text-center mt-20">
                          Ask me anything about this topic...
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type your question..."
                          className="flex-1 px-4 py-2 border rounded-lg"
                        />
                        <Button>Send</Button>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="podcast" className="mt-6">
                    <Card className="p-6">
                      <h3 className="font-bold mb-4">Audio Summary</h3>
                      <div className="bg-muted rounded-lg p-8 text-center">
                        <Headphones className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground mb-4">Listen to AI-generated podcast summary</p>
                        <Button>Play Podcast</Button>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="mcqs" className="mt-6">
                    <Card className="p-6">
                      <h3 className="font-bold mb-4">Practice Questions</h3>
                      <p className="text-muted-foreground">10 questions available for this topic</p>
                      <Button className="mt-4">Start Practice Test</Button>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-6">
                    <Card className="p-6">
                      <h3 className="font-bold mb-4">Topic Notes</h3>
                      <div className="prose max-w-none">
                        <p>Detailed notes and formulas will be displayed here...</p>
                      </div>
                      <Button className="mt-4" variant="outline">Download PDF</Button>
                    </Card>
                  </TabsContent>

                  <TabsContent value="assignments" className="mt-6">
                    <Card className="p-6">
                      <h3 className="font-bold mb-4">Assignments</h3>
                      <p className="text-muted-foreground">No assignments for this topic yet</p>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-2xl font-bold mb-2">Select a topic to start learning</h2>
                  <p className="text-muted-foreground">Choose from the chapters on the left</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Learning;
