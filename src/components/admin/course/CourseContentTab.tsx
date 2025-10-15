import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCourseSubjects } from "@/hooks/useCourseSubjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface CourseContentTabProps {
  courseId?: string;
}

export const CourseContentTab = ({ courseId }: CourseContentTabProps) => {
  const { data: courseSubjects } = useCourseSubjects(courseId);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const { data: chapters } = useQuery({
    queryKey: ["subject-chapters", selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      
      const { data, error } = await supabase
        .from("subject_chapters")
        .select(`
          *,
          subject_topics(*)
        `)
        .eq("subject_id", selectedSubjectId)
        .order("sequence_order");
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSubjectId,
  });

  if (!courseId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please save the course first
      </div>
    );
  }

  if (!courseSubjects || courseSubjects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please add subjects first in the Subjects tab
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>Select Subject</Label>
        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select a subject to view content" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {courseSubjects.map((cs: any) => (
              <SelectItem key={cs.id} value={cs.subject_id}>
                {cs.subject?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSubjectId && (
        <div>
          <Label>Chapters & Topics</Label>
          {chapters && chapters.length > 0 ? (
            <Accordion type="single" collapsible className="mt-2">
              {chapters.map((chapter: any) => (
                <AccordionItem key={chapter.id} value={chapter.id}>
                  <AccordionTrigger>
                    Chapter {chapter.chapter_number}: {chapter.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    {chapter.subject_topics && chapter.subject_topics.length > 0 ? (
                      <ul className="space-y-1 ml-4">
                        {chapter.subject_topics.map((topic: any) => (
                          <li key={topic.id} className="text-sm">
                            • Topic {topic.topic_number}: {topic.title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground ml-4">No topics yet</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">No chapters found for this subject</p>
          )}
        </div>
      )}
    </div>
  );
};