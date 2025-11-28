import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Users, BookOpen } from "lucide-react";

const ProgramDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          course_categories(
            categories(*)
          ),
          course_subjects(
            id,
            popular_subjects(
              id,
              name,
              slug,
              thumbnail_url
            )
          ),
          course_faqs(*)
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
        <SEOHead title="Loading..." description="Loading program details..." />
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead title="Program Not Found" description="The program you're looking for doesn't exist or has been removed." />
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Program Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The program you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/programs">
            <Button>Browse All Programs</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title={course.name}
        description={course.short_description || course.description || ""}
        ogImage={course.thumbnail_url || undefined}
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.name}</h1>
                <p className="text-lg text-muted-foreground mb-6">
                  {course.short_description || course.description}
                </p>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  {course.duration_months && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{course.duration_months} months</span>
                    </div>
                  )}
                  {course.student_count && (
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span>{course.student_count.toLocaleString()} students</span>
                    </div>
                  )}
                  {course.rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">★</span>
                      <span>{course.rating} ({course.review_count || 0} reviews)</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="text-3xl font-bold">
                    ₹{course.price_inr?.toLocaleString()}
                    {course.original_price_inr && course.original_price_inr > course.price_inr && (
                      <span className="text-lg text-muted-foreground line-through ml-2">
                        ₹{course.original_price_inr.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Button size="lg" className="px-8">
                    Enroll Now
                  </Button>
                </div>
              </div>

              {course.thumbnail_url && (
                <div className="relative rounded-lg overflow-hidden shadow-2xl">
                  <img
                    src={course.thumbnail_url}
                    alt={course.name}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* What You'll Learn */}
        {course.what_you_learn && Array.isArray(course.what_you_learn) && (
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8">What You'll Learn</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {course.what_you_learn.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <span className="text-muted-foreground">
                      {typeof item === 'string' ? item : item.text || item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Course Includes */}
        {course.course_includes && Array.isArray(course.course_includes) && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8">This Course Includes</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {course.course_includes.map((item: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-6 flex items-center gap-3">
                      <BookOpen className="h-6 w-6 text-primary" />
                      <span>{typeof item === 'string' ? item : item.text || JSON.stringify(item)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Detailed Description */}
        {course.detailed_description && (
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8">About This Program</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground">{course.detailed_description}</p>
              </div>
            </div>
          </section>
        )}

        {/* FAQs */}
        {course.course_faqs && course.course_faqs.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {course.course_faqs.map((faq: any) => (
                  <Card key={faq.id}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of students already learning with us
            </p>
            <Button size="lg" variant="secondary" className="px-8">
              Enroll Now
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProgramDetail;
