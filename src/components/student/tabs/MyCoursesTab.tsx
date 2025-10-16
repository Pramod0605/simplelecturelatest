import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, CheckCircle } from "lucide-react";
import { mockCourses } from "@/data/mockDashboard";

export const MyCoursesTab = ({ student }: { student: any }) => {
  return (
    <div className="space-y-6">
      {mockCourses.map((enrollment) => {
        const course = enrollment.courses;
        return (
          <Card key={enrollment.course_id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {course.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(course.chapters).map(([subject, chapters]: [string, any[]]) => (
                <div key={subject} className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {subject}
                    <Badge variant="secondary">{chapters.length} Chapters</Badge>
                  </h3>
                  
                  <Accordion type="single" collapsible className="w-full">
                    {chapters.map((chapter) => (
                      <AccordionItem key={chapter.id} value={chapter.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className={`h-4 w-4 ${chapter.progress === 100 ? 'text-green-600' : 'text-muted-foreground'}`} />
                              <span className="font-medium">{chapter.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{chapter.progress}%</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2 space-y-2">
                            <Progress value={chapter.progress} className="h-2" />
                            <div className="text-sm text-muted-foreground">
                              <p className="font-medium mb-2">Topics:</p>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                {chapter.topics.map((topic: string, idx: number) => (
                                  <li key={idx}>{topic}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
