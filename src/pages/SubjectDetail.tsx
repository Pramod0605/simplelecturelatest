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
        {/* Hero Section - Enhanced */}
        <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="container mx-auto px-4 py-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {subject.categories && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {subject.categories.name}
                  </Badge>
                )}
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  {subject.name}
                </h1>
                
                {subject.description && (
                  <p className="text-xl md:text-2xl opacity-90 leading-relaxed">
                    {subject.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                    <BookOpen className="h-5 w-5" />
                    <span className="font-semibold">{chaptersData?.length || 0} Chapters</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">
                      {chaptersData?.reduce((acc: number, ch: any) => acc + (ch.subject_topics?.length || 0), 0) || 0} Topics
                    </span>
                  </div>
                </div>

                {isEnrolled ? (
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-2 bg-green-500/20 text-white border-2 border-white/30 rounded-full px-4 py-2 w-fit">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">You're Enrolled</span>
                    </div>
                    <p className="text-sm opacity-80">
                      Available via: {enrolledCourses.map((c: any) => c.name).join(", ")}
                    </p>
                    <Button size="lg" variant="secondary" asChild className="mt-4">
                      <Link to="/dashboard">Start Learning</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3 bg-white/20 rounded-lg px-4 py-3">
                      <Lock className="h-6 w-6" />
                      <span className="text-lg">Unlock all content by enrolling in a course</span>
                    </div>
                    <Button size="lg" variant="secondary" asChild className="shadow-xl">
                      <Link to="/programs">
                        <Target className="h-5 w-5 mr-2" />
                        Explore Courses
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {subject.thumbnail_url && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/50 to-transparent rounded-2xl" />
                  <img
                    src={subject.thumbnail_url}
                    alt={subject.name}
                    className="rounded-2xl shadow-2xl w-full h-auto border-4 border-white/20"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section - Enhanced */}
        <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Learning Experience</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to master {subject.name} in one comprehensive package
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="relative border-2 hover:shadow-xl transition-all hover:scale-[1.02] group">
                  <CardContent className="p-6">
                    <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                    {!isEnrolled && (
                      <div className="absolute top-4 right-4 p-2 bg-muted rounded-full">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Curriculum Section - Enhanced */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Course Curriculum</h2>
              <p className="text-lg text-muted-foreground">
                Structured learning path with {chaptersData?.length || 0} comprehensive chapters covering all essential topics
              </p>
            </div>
            
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
                            <h3 className="text-lg font-semibold">{chapter.title}</h3>
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
                                  <p className="font-medium">{topic.title}</p>
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

        {/* CTA Section - Enhanced */}
        {!isEnrolled && (
          <section className="py-16 bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-3xl mx-auto space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Ready to Master {subject.name}?
                </h2>
                <p className="text-xl md:text-2xl opacity-90">
                  Join thousands of students and unlock complete access to all chapters, topics, practice tests, and AI-powered learning tools
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button size="lg" variant="secondary" asChild className="shadow-xl text-lg px-8">
                    <Link to="/programs">
                      <Target className="h-5 w-5 mr-2" />
                      Explore Courses
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg px-8">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Talk to Advisor
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SubjectDetail;
