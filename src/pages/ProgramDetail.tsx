import { useParams } from "react-router-dom";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, Video, FileText, Award, Clock, Smartphone, Bot, ShoppingCart, ChevronRight, PlayCircle, Lock, CheckCircle } from "lucide-react";
import { mockProgramDetails } from "@/data/mockProgramDetails";
import { formatINR } from "@/lib/utils";

const ProgramDetail = () => {
  const { programId } = useParams();
  const [selectedSubject, setSelectedSubject] = useState(0);
  
  // For demo, use multiSubject program
  const program = mockProgramDetails.multiSubject;
  const hasMultipleSubjects = program.subjects.length > 1;

  return (
    <>
      <SEOHead
        title={`${program.name} | SimpleLecture`}
        description={program.description}
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section */}
          <div className="border-b bg-muted/30">
            <div className="container mx-auto px-4 py-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>{program.category}</span>
                    <ChevronRight className="h-4 w-4" />
                    <span>{program.sub_category}</span>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {program.name}
                  </h1>
                  
                  <p className="text-lg text-muted-foreground mb-4">
                    {program.description}
                  </p>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-foreground">{program.rating}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(program.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">({program.reviewCount.toLocaleString()} reviews)</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{program.studentCount.toLocaleString()} students</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <img src={program.instructor.avatar} alt={program.instructor.name} className="h-12 w-12 rounded-full" />
                    <div>
                      <p className="font-medium text-foreground">{program.instructor.name}</p>
                      <p className="text-sm text-muted-foreground">{program.instructor.title}</p>
                    </div>
                  </div>
                </div>
                
                {/* Price Card - Desktop */}
                <div className="hidden lg:block">
                  <Card className="p-6 sticky top-4">
                    <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                      <PlayCircle className="h-16 w-16 text-primary" />
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-foreground">{formatINR(program.price_inr)}</span>
                        <span className="text-lg text-muted-foreground line-through">{formatINR(program.originalPrice)}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {Math.round((1 - program.price_inr / program.originalPrice) * 100)}% off
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Button className="w-full" size="lg">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Add to cart
                      </Button>
                      <Button variant="outline" className="w-full" size="lg">
                        Buy now
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Tabs defaultValue="information" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="information">Information</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="information" className="mt-6 space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-4">What you'll learn</h2>
                      <div className="grid md:grid-cols-2 gap-3">
                        {program.whatYouLearn.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-4">This course includes</h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        {program.courseIncludes.map((item, index) => {
                          const IconComponent = item.icon === "Video" ? Video :
                                              item.icon === "FileText" ? FileText :
                                              item.icon === "Award" ? Award :
                                              item.icon === "Clock" ? Clock :
                                              item.icon === "Smartphone" ? Smartphone :
                                              item.icon === "Bot" ? Bot : Video;
                          return (
                            <div key={index} className="flex gap-3 items-center">
                              <IconComponent className="h-5 w-5 text-primary" />
                              <span className="text-muted-foreground">{item.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="content" className="mt-6">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Course Content</h2>
                    
                    {hasMultipleSubjects && (
                      <div className="mb-6">
                        <p className="text-sm text-muted-foreground mb-2">Select subject:</p>
                        <div className="flex gap-2 flex-wrap">
                          {program.subjects.map((subject, index) => (
                            <Button
                              key={subject.id}
                              variant={selectedSubject === index ? "default" : "outline"}
                              onClick={() => setSelectedSubject(index)}
                            >
                              {subject.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Accordion type="single" collapsible className="w-full">
                      {program.subjects[selectedSubject].chapters.map((chapter, chapterIndex) => (
                        <AccordionItem key={chapter.id} value={chapter.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span className="font-semibold text-foreground">
                                Chapter {chapterIndex + 1}: {chapter.title}
                              </span>
                              <span className="text-sm text-muted-foreground">{chapter.duration}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pl-4">
                              {chapter.topics.map((topic) => (
                                <div key={topic.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                  <div className="flex items-center gap-3">
                                    {topic.isLocked ? (
                                      <Lock className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <PlayCircle className="h-4 w-4 text-primary" />
                                    )}
                                    <div>
                                      <p className="font-medium text-foreground">{topic.title}</p>
                                      <div className="flex gap-2 mt-1">
                                        {topic.features.map((feature) => (
                                          <Badge key={feature} variant="secondary" className="text-xs">
                                            {feature}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-sm text-muted-foreground">{topic.duration}</span>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="mt-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Student Reviews</h2>
                    <div className="space-y-6">
                      {program.reviews.map((review) => (
                        <Card key={review.id} className="p-6">
                          <div className="flex items-start gap-4">
                            <img src={review.avatar} alt={review.userName} className="h-12 w-12 rounded-full" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-foreground">{review.userName}</p>
                                <span className="text-sm text-muted-foreground">{review.date}</span>
                              </div>
                              <div className="flex mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <p className="text-muted-foreground">{review.comment}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="comments" className="mt-6">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Questions & Answers</h2>
                    <Card className="p-6">
                      <p className="text-muted-foreground text-center">No questions yet. Be the first to ask!</p>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Mobile Price Card */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-2xl font-bold text-foreground">{formatINR(program.price_inr)}</span>
                    <span className="text-sm text-muted-foreground line-through ml-2">{formatINR(program.originalPrice)}</span>
                  </div>
                  <Button size="lg">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ProgramDetail;
