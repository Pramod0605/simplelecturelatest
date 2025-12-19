import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, CheckCircle, FolderOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CourseChapter {
  id: string;
  name: string;
  progress: number;
  topics: string[];
}

interface CourseSubject {
  id: string;
  name: string;
  chapters: CourseChapter[];
}

interface CourseData {
  id: string;
  name: string;
  subjects: CourseSubject[];
}

export const MyCoursesTab = ({ student }: { student: any }) => {
  // Fetch detailed course data with chapters and topics
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['my-courses-detailed', student?.courses?.map((c: any) => c.id)],
    queryFn: async () => {
      if (!student?.courses?.length) return [];

      const courseIds = student.courses.map((c: any) => c.id);
      
      // Fetch course subjects with chapters and topics
      const { data: courseSubjects, error } = await supabase
        .from('course_subjects')
        .select(`
          course_id,
          popular_subjects (
            id,
            name,
            subject_chapters (
              id,
              name,
              display_order,
              subject_topics (
                id,
                name
              )
            )
          )
        `)
        .in('course_id', courseIds);

      if (error) {
        console.error("Error fetching course subjects:", error);
        return [];
      }

      // Fetch student progress
      const { data: { user } } = await supabase.auth.getUser();
      let progressMap: Record<string, boolean> = {};
      
      if (user) {
        const { data: progress } = await supabase
          .from('student_progress')
          .select('chapter_id, is_completed')
          .eq('student_id', user.id);
        
        if (progress) {
          progressMap = progress.reduce((acc: Record<string, boolean>, p: any) => {
            acc[p.chapter_id] = p.is_completed;
            return acc;
          }, {});
        }
      }

      // Group by course
      const coursesMap: Record<string, CourseData> = {};
      
      student.courses.forEach((course: any) => {
        coursesMap[course.id] = {
          id: course.id,
          name: course.name,
          subjects: []
        };
      });

      (courseSubjects || []).forEach((cs: any) => {
        const subjectData = Array.isArray(cs.popular_subjects) 
          ? cs.popular_subjects[0] 
          : cs.popular_subjects;
        
        if (!subjectData || !coursesMap[cs.course_id]) return;

        const chapters = (subjectData.subject_chapters || []).map((chapter: any) => {
          const topics = (chapter.subject_topics || []).map((t: any) => t.name);
          const isCompleted = progressMap[chapter.id] || false;
          
          return {
            id: chapter.id,
            name: chapter.name,
            progress: isCompleted ? 100 : 0,
            topics
          };
        }).sort((a: CourseChapter, b: CourseChapter) => a.name.localeCompare(b.name));

        coursesMap[cs.course_id].subjects.push({
          id: subjectData.id,
          name: subjectData.name,
          chapters
        });
      });

      return Object.values(coursesMap);
    },
    enabled: !!student?.courses?.length,
    staleTime: 0
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Empty state
  if (!student?.courses?.length || !coursesData?.length) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Courses Enrolled</h3>
            <p className="text-muted-foreground mb-4">
              You haven't enrolled in any courses yet. Browse our catalog to get started!
            </p>
            <Link to="/">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {coursesData.map((course) => (
        <Card key={course.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {course.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects added to this course yet.</p>
            ) : (
              course.subjects.map((subject) => (
                <div key={subject.id} className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {subject.name}
                    <Badge variant="secondary">{subject.chapters.length} Chapters</Badge>
                  </h3>
                  
                  {subject.chapters.length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-4">No chapters available yet.</p>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {subject.chapters.map((chapter) => (
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
                              {chapter.topics.length > 0 ? (
                                <div className="text-sm text-muted-foreground">
                                  <p className="font-medium mb-2">Topics:</p>
                                  <ul className="list-disc list-inside space-y-1 ml-2">
                                    {chapter.topics.map((topic: string, idx: number) => (
                                      <li key={idx}>{topic}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No topics added yet.</p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
