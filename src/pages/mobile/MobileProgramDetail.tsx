import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Share2, Star, Clock, Users, Award, HelpCircle, ChevronDown, PlayCircle, FileDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEOHead } from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";
import { formatINR } from "@/lib/utils";
import { mockProgramDetails } from "@/data/mockProgramDetails";

const MobileProgramDetail = () => {
  const { programId } = useParams();
  const [selectedTab, setSelectedTab] = useState("information");
  const [showContentDetail, setShowContentDetail] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(0);

  // Get program based on ID (default to PUC+NEET if not found)
  const program = programId === 'puc-neet-integrated-2026' 
    ? mockProgramDetails.puc_neet_integrated 
    : programId === 'sslc-complete-2026'
    ? mockProgramDetails.sslc_complete
    : programId === 'jee-main-advanced-2026'
    ? mockProgramDetails.jee_complete
    : mockProgramDetails.puc_neet_integrated; // default

  const faqs = [
    {
      question: "What is the duration of this program?",
      answer: `This program is ${program.duration_months} months long with flexible learning schedule.`
    },
    {
      question: "Do I get a certificate?",
      answer: "Yes, you'll receive an industry-recognized certificate upon completion."
    },
    {
      question: "Is this program suitable for beginners?",
      answer: "This program is designed for all levels, from beginners to advanced learners."
    }
  ];

  if (showContentDetail) {
    return (
      <>
      <SEOHead 
        title={`${program.subjects[selectedSubject].name} - Content | SimpleLecture`} 
        description={program.subjects[selectedSubject].description}
      />
        
        <div className="min-h-screen bg-background pb-20">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-background border-b">
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="icon" onClick={() => setShowContentDetail(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-semibold text-base flex-1 mx-3 line-clamp-1">
                {program.subjects[selectedSubject].name}
              </h1>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content Detail */}
          <div className="p-4 space-y-4">
            {program.subjects[selectedSubject].chapters.map((chapter, chapterIndex) => (
              <Card key={chapter.id} className="overflow-hidden">
                <div className="bg-muted p-4">
                  <h3 className="font-semibold">Section {chapterIndex + 1}: {chapter.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{chapter.duration}</p>
                </div>
                <div className="divide-y">
                  {chapter.topics.map((topic) => (
                    <div key={topic.id} className="p-4 flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {topic.isLocked ? (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <PlayCircle className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{topic.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{topic.duration}</span>
                          <span className="text-xs text-muted-foreground">• 4.10 MB</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {/* Certificate Section */}
            <Card className="p-4 bg-primary/5">
              <div className="flex items-center gap-3">
                <Award className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-semibold">Certificate of Completion</p>
                  <p className="text-sm text-muted-foreground">Complete all sections to earn</p>
                </div>
              </div>
            </Card>
          </div>

          <BottomNav />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title={`${program.name} | SimpleLecture`} description={program.description} />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <Link to="/mobile/programs">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-base flex-1 mx-3 line-clamp-1">{program.name}</h1>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="aspect-video bg-muted flex items-center justify-center">
          <PlayCircle className="h-16 w-16 text-primary" />
        </div>

        {/* Price & Enroll */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-2xl font-bold text-foreground">{formatINR(program.price_inr)}</span>
              <span className="text-sm text-muted-foreground line-through ml-2">{formatINR(program.originalPrice)}</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {Math.round((1 - program.price_inr / program.originalPrice) * 100)}% off
            </Badge>
          </div>
          <Button className="w-full" size="lg">Enroll Now</Button>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 sticky top-[57px] z-30 bg-background rounded-none border-b">
            <TabsTrigger value="information">Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="comments">Q&A</TabsTrigger>
          </TabsList>

          <TabsContent value="information" className="p-4 space-y-6">
            {/* Course Count */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {program.subjects.length} Course{program.subjects.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">About this program</h3>
              <p className="text-sm text-muted-foreground">{program.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-3 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold text-sm">{program.duration_months}m</p>
              </Card>
              <Card className="p-3 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="font-semibold text-sm">{(program.studentCount / 1000).toFixed(1)}k</p>
              </Card>
              <Card className="p-3 text-center">
                <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="font-semibold text-sm">{program.rating}</p>
              </Card>
            </div>

            {/* Progress */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm text-muted-foreground">0% Completed</span>
              </div>
              <Progress value={0} className="h-2" />
              <Button variant="outline" className="w-full mt-3" size="sm">
                Go to Learning Page
              </Button>
            </Card>

            {/* FAQs */}
            <div>
              <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
              <Accordion type="single" collapsible>
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-sm">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="content" className="p-4 space-y-4">
            <h3 className="font-semibold">All Courses in this Program</h3>
            {program.subjects.map((subject, index) => (
              <Card
                key={subject.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedSubject(index);
                  setShowContentDetail(true);
                }}
              >
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-primary" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm flex-1">{subject.name}</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{subject.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < Math.floor(program.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{program.rating}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">Free</span>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reviews" className="p-4 space-y-4">
            <h3 className="font-semibold">Student Reviews</h3>
            {program.reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <img src={review.avatar} alt={review.userName} className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{review.userName}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="comments" className="p-4">
            <Card className="p-6 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No questions yet</p>
              <Button variant="outline" className="mt-4">Ask a Question</Button>
            </Card>
          </TabsContent>
        </Tabs>

        <BottomNav />
      </div>
    </>
  );
};

export default MobileProgramDetail;
