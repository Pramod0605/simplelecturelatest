import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSubjectDetail, useSubjectChapterTopics, useCheckSubjectEnrollment } from "@/hooks/useSubjectDetail";
import { 
  BookOpen, 
  Clock, 
  Lock, 
  CheckCircle2, 
  Brain, 
  MessageCircle, 
  FileQuestion, 
  Target, 
  Calendar,
  FileText,
  ClipboardCheck,
  PlayCircle,
  FileDown
} from "lucide-react";

const SubjectDetail = () => {
  const { subjectSlug } = useParams<{ subjectSlug: string }>();
  
  const { data: subject, isLoading: loadingSubject } = useSubjectDetail(subjectSlug);
  const { data: chaptersData, isLoading: loadingChapters } = useSubjectChapterTopics(subject?.id);
  const { data: enrollmentData } = useCheckSubjectEnrollment(subject?.id);

  const isEnrolled = enrollmentData?.isEnrolled || false;
  const enrolledCourses = enrollmentData?.courses || [];

  if (loadingSubject || loadingChapters) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-64 mb-8" />
            <Skeleton className="h-12 w-96 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Subject Not Found</h1>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const features = [
    { icon: Brain, title: "AI-Based Tutorial", description: "Personalized learning with AI assistance" },
    { icon: MessageCircle, title: "Instant AI Assistance", description: "Get answers to your doubts instantly" },
    { icon: FileQuestion, title: "Question Bank", description: "Extensive collection of practice questions" },
    { icon: Target, title: "Practice Sessions", description: "Interactive practice with instant feedback" },
    { icon: Calendar, title: "Daily Practice Tests (DPT)", description: "Regular assessments to track progress" },
    { icon: FileText, title: "Detailed Notes", description: "Comprehensive study materials" },
    { icon: ClipboardCheck, title: "Assignments", description: "Homework and graded assignments" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={subject.name}
        description={subject.description || `Learn ${subject.name} with comprehensive chapters and topics`}
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{subject.name}</h1>
                {subject.description && (
                  <p className="text-xl text-muted-foreground mb-6">
                    {subject.description}
                  </p>
                )}
                
                <div className="flex gap-4 mb-6">
                  <Badge variant="secondary" className="text-base py-2 px-4">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {chaptersData?.length || 0} Chapters
                  </Badge>
                  <Badge variant="secondary" className="text-base py-2 px-4">
                    <FileText className="h-4 w-4 mr-2" />
                    {chaptersData?.reduce((acc: number, ch: any) => acc + (ch.subject_topics?.length || 0), 0) || 0} Topics
                  </Badge>
                </div>

                {isEnrolled ? (
                  <div className="space-y-2">
                    <Badge variant="default" className="text-base py-2 px-4">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Enrolled
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Via: {enrolledCourses.map((c: any) => c.name).join(", ")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-5 w-5" />
                      <span>Enroll in a course to unlock all content</span>
                    </div>
                    <Button size="lg" asChild>
                      <Link to="/programs">Browse Courses</Link>
                    </Button>
                  </div>
                )}
              </div>

              {subject.thumbnail_url && (
                <div className="rounded-lg overflow-hidden shadow-xl">
                  <img
                    src={subject.thumbnail_url}
                    alt={subject.name}
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">What You'll Get</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <feature.icon className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                    {!isEnrolled && (
                      <Lock className="h-4 w-4 text-muted-foreground mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Curriculum Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Curriculum</h2>
            
            {!chaptersData || chaptersData.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No content available yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {chaptersData.map((chapter: any, index: number) => (
                  <Card key={chapter.id}>
                    <AccordionItem value={`chapter-${chapter.id}`} className="border-0">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-start gap-4 text-left flex-1">
                          <Badge variant="outline" className="shrink-0">
                            Ch {chapter.chapter_number}
                          </Badge>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{chapter.chapter_name}</h3>
                            {chapter.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {chapter.description}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {chapter.subject_topics?.length || 0} Topics
                              </Badge>
                              {chapter.pdf_url && (
                                <Badge variant="secondary" className="text-xs">
                                  <FileDown className="h-3 w-3 mr-1" />
                                  PDF
                                </Badge>
                              )}
                              {chapter.video_id && (
                                <Badge variant="secondary" className="text-xs">
                                  <PlayCircle className="h-3 w-3 mr-1" />
                                  Video
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!isEnrolled && <Lock className="h-5 w-5 text-muted-foreground" />}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="px-6 pb-4 space-y-2">
                          {chapter.subject_topics?.map((topic: any) => (
                            <div key={topic.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3 flex-1">
                                <Badge variant="outline" className="text-xs">
                                  {topic.topic_number}
                                </Badge>
                                <div className="flex-1">
                                  <p className="font-medium">{topic.topic_name}</p>
                                  {topic.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {topic.description}
                                    </p>
                                  )}
                                  <div className="flex gap-2 mt-1">
                                    {topic.estimated_duration_minutes && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {topic.estimated_duration_minutes} min
                                      </span>
                                    )}
                                    {topic.pdf_url && (
                                      <Badge variant="secondary" className="text-xs">
                                        <FileDown className="h-3 w-3 mr-1" />
                                        PDF
                                      </Badge>
                                    )}
                                    {topic.video_id && (
                                      <Badge variant="secondary" className="text-xs">
                                        <PlayCircle className="h-3 w-3 mr-1" />
                                        Video
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {!isEnrolled && <Lock className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Card>
                ))}
              </Accordion>
            )}
          </div>
        </section>

        {/* CTA Section */}
        {!isEnrolled && (
          <section className="py-12 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
              <p className="text-xl mb-8 opacity-90">
                Enroll in a course to unlock all {subject.name} content and features
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/programs">View Courses</Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SubjectDetail;
