import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  CheckCircle2, 
  Target,
  GraduationCap,
  Sparkles,
  ShoppingCart,
  Play,
  FileText,
  Award,
  TrendingUp,
  Zap,
  Globe,
  HeadphonesIcon
} from "lucide-react";

const ProgramDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: course, isLoading } = useQuery({
    queryKey: ["program-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          course_categories (
            categories (
              id,
              name,
              slug
            )
          ),
          course_subjects (
            display_order,
            popular_subjects (
              id,
              name,
              slug,
              description,
              thumbnail_url
            )
          ),
          course_faqs (
            id,
            question,
            answer,
            display_order
          )
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-12">
            <Skeleton className="h-96 mb-8 rounded-xl" />
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-96" />
              </div>
              <Skeleton className="h-[600px]" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Program Not Found</h1>
            <p className="text-muted-foreground text-lg">The program you're looking for doesn't exist.</p>
            <Button asChild size="lg">
              <Link to="/programs">Browse All Programs</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const subjects = course.course_subjects
    ?.map((cs: any) => cs.popular_subjects)
    .filter(Boolean)
    .sort((a: any, b: any) => {
      const orderA = course.course_subjects.find((cs: any) => cs.popular_subjects?.id === a.id)?.display_order || 0;
      const orderB = course.course_subjects.find((cs: any) => cs.popular_subjects?.id === b.id)?.display_order || 0;
      return orderA - orderB;
    }) || [];

  const categories = course.course_categories?.map((cc: any) => cc.categories).filter(Boolean) || [];
  const faqs = course.course_faqs?.sort((a: any, b: any) => a.display_order - b.display_order) || [];

  const learningPoints = course.what_you_learn ? 
    (Array.isArray(course.what_you_learn) ? course.what_you_learn : []) : [];
  
  const courseIncludes = course.course_includes ? 
    (Array.isArray(course.course_includes) ? course.course_includes : []) : [];

  const features = [
    { icon: Play, title: "Live Classes", description: "Interactive sessions with expert instructors" },
    { icon: FileText, title: "Study Materials", description: "Comprehensive notes and resources" },
    { icon: Target, title: "Practice Tests", description: "Regular assessments and mock tests" },
    { icon: HeadphonesIcon, title: "Doubt Support", description: "24/7 AI-powered doubt clearing" },
    { icon: Award, title: "Certificates", description: "Get certified upon completion" },
    { icon: TrendingUp, title: "Progress Tracking", description: "Monitor your learning journey" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`${course.name} | SimpleLecture`}
        description={course.short_description || course.detailed_description || `Learn ${course.name} with expert guidance`}
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section with Gradient */}
        <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="container mx-auto px-4 py-6 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat: any) => (
                      <Badge key={cat.id} variant="secondary" className="text-sm px-3 py-1">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  {course.name}
                </h1>
                
                {course.short_description && (
                  <p className="text-xl md:text-2xl opacity-90 leading-relaxed">
                    {course.short_description}
                  </p>
                )}

                {/* Stats - Conditional Display */}
                <div className="flex flex-wrap gap-6 pt-4">
                  {course.rating > 0 && course.review_count > 1000 && course.rating >= 4.5 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{course.rating}</span>
                      </div>
                      <span className="text-sm opacity-80">({course.review_count.toLocaleString()} reviews)</span>
                    </div>
                  )}
                  
                  {course.student_count > 20000 && (
                    <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">{course.student_count.toLocaleString()} students</span>
                    </div>
                  )}
                  
                  {course.duration_months && (
                    <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                      <Clock className="h-5 w-5" />
                      <span className="font-semibold">{course.duration_months} months</span>
                    </div>
                  )}
                </div>

                {/* Price and CTA */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <div>
                    {course.price_inr > 0 ? (
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold">₹{course.price_inr.toLocaleString()}</span>
                        {course.original_price_inr && course.original_price_inr > course.price_inr && (
                          <>
                            <span className="text-xl line-through opacity-60">
                              ₹{course.original_price_inr.toLocaleString()}
                            </span>
                            <Badge variant="secondary" className="bg-green-500 text-white">
                              {Math.round((1 - course.price_inr / course.original_price_inr) * 100)}% OFF
                            </Badge>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-4xl font-bold text-green-400">Free</span>
                    )}
                  </div>
                  
                  <Button size="lg" variant="secondary" className="text-lg px-8 shadow-xl hover:shadow-2xl">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Enroll Now
                  </Button>
                </div>
              </div>

              {/* Right Image */}
              {course.thumbnail_url && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/50 to-transparent rounded-2xl" />
                  <img
                    src={course.thumbnail_url}
                    alt={course.name}
                    className="rounded-2xl shadow-2xl w-full h-auto border-4 border-white/20"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-white text-foreground rounded-xl p-4 shadow-xl">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Program */}
              {course.detailed_description && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <BookOpen className="h-6 w-6 text-primary" />
                      About This Program
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                      {course.detailed_description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* What You'll Learn */}
              {learningPoints.length > 0 && (
                <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Target className="h-6 w-6 text-primary" />
                      What You'll Learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {learningPoints.map((point: any, index: number) => {
                        const text = typeof point === 'string' ? point : point.text || point.title || '';
                        return (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-muted-foreground">{text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subjects Covered - Highlighted */}
              {subjects.length > 0 && (
                <Card className="border-2 border-primary/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <GraduationCap className="h-6 w-6 text-primary" />
                      Subjects You'll Master
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                      Comprehensive coverage of {subjects.length} subjects designed for success
                    </p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {subjects.map((subject: any) => (
                        <Link 
                          key={subject.id}
                          to={`/subject/${subject.slug}`}
                          className="group"
                        >
                          <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary/40">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                {subject.thumbnail_url ? (
                                  <img
                                    src={subject.thumbnail_url}
                                    alt={subject.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <BookOpen className="h-8 w-8 text-primary" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-lg group-hover:text-primary transition-colors mb-1">
                                    {subject.name}
                                  </h4>
                                  {subject.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {subject.description}
                                    </p>
                                  )}
                                  <Button variant="link" className="px-0 h-auto mt-2">
                                    View Details →
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Features Grid */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Zap className="h-6 w-6 text-primary" />
                    Course Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <feature.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* FAQs */}
              {faqs.length > 0 && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Globe className="h-6 w-6 text-primary" />
                      Frequently Asked Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {faqs.map((faq: any) => (
                        <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="text-left font-medium">{faq.question}</span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground pt-2">{faq.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Sticky */}
            <div className="lg:sticky lg:top-24 h-fit space-y-6">
              {/* Course Includes */}
              {courseIncludes.length > 0 && (
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                    <CardTitle className="text-xl">This Course Includes</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {courseIncludes.map((item: any, index: number) => {
                        const text = typeof item === 'string' ? item : item.text || item.title || '';
                        return (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">{text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
                <CardHeader>
                  <CardTitle className="text-xl">Course Highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subjects.length > 0 && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">Subjects</span>
                      <span className="font-semibold text-lg">{subjects.length}</span>
                    </div>
                  )}
                  {course.duration_months && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-semibold text-lg">{course.duration_months} months</span>
                    </div>
                  )}
                  {course.student_count > 0 && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">Students</span>
                      <span className="font-semibold text-lg">{course.student_count.toLocaleString()}</span>
                    </div>
                  )}
                  {course.rating > 0 && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-lg">{course.rating}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA Card */}
              <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-background shadow-xl">
                <CardContent className="pt-6 text-center space-y-4">
                  <div>
                    {course.price_inr > 0 ? (
                      <>
                        <div className="text-3xl font-bold mb-1">
                          ₹{course.price_inr.toLocaleString()}
                        </div>
                        {course.original_price_inr && course.original_price_inr > course.price_inr && (
                          <div className="text-sm text-muted-foreground">
                            <span className="line-through">₹{course.original_price_inr.toLocaleString()}</span>
                            <Badge variant="secondary" className="ml-2 bg-green-500 text-white">
                              Save ₹{(course.original_price_inr - course.price_inr).toLocaleString()}
                            </Badge>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    )}
                  </div>
                  <Button size="lg" className="w-full text-lg shadow-lg">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Enroll Now
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    30-day money-back guarantee
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Learning Journey?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of students who have achieved their goals with {course.name}
            </p>
            <Button size="lg" variant="secondary" className="text-lg px-8 shadow-xl">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Get Started Today
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProgramDetail;
