import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCourseSubjects, useAddCourseSubject, useRemoveCourseSubject, useUpdateCourseSubjectOrder } from "@/hooks/useCourseSubjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, GripVertical } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CourseSubjectsTabProps {
  courseId?: string;
  selectedCategories: string[];
}

export const CourseSubjectsTab = ({ courseId, selectedCategories }: CourseSubjectsTabProps) => {
  const { data: courseSubjects } = useCourseSubjects(courseId);
  const addSubject = useAddCourseSubject();
  const removeSubject = useRemoveCourseSubject();
  const updateOrder = useUpdateCourseSubjectOrder();
  
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // Fetch subjects filtered by selected categories
  const { data: availableSubjects } = useQuery({
    queryKey: ["filtered-subjects", selectedCategories],
    queryFn: async () => {
      if (selectedCategories.length === 0) return [];
      
      const { data, error } = await supabase
        .from("popular_subjects")
        .select(`
          *,
          subject_categories!inner(category_id)
        `)
        .in("subject_categories.category_id", selectedCategories)
        .eq("is_active", true);
      
      if (error) throw error;
      
      // Remove duplicates
      const unique = data.filter((subject, index, self) => 
        index === self.findIndex(s => s.id === subject.id)
      );
      
      return unique;
    },
    enabled: selectedCategories.length > 0,
  });

  const handleAddSubject = () => {
    if (!courseId || !selectedSubjectId) return;
    
    const nextOrder = (courseSubjects?.length || 0) + 1;
    addSubject.mutate({
      courseId,
      subjectId: selectedSubjectId,
      displayOrder: nextOrder,
    });
    setSelectedSubjectId("");
  };

  const handleRemoveSubject = (id: string) => {
    if (!courseId) return;
    removeSubject.mutate({ id, courseId });
  };

  const handleUpdateOrder = (id: string, newOrder: number) => {
    if (!courseId) return;
    updateOrder.mutate({ id, displayOrder: newOrder, courseId });
  };

  if (!courseId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please save the course first before adding subjects
      </div>
    );
  }

  if (selectedCategories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select categories first in the Categories tab
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>Add Subject</Label>
        <div className="flex gap-2 mt-2">
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {availableSubjects?.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddSubject} type="button" disabled={addSubject.isPending}>
            Add
          </Button>
        </div>
      </div>

      <div>
        <Label>Course Subjects</Label>
        {courseSubjects && courseSubjects.length > 0 ? (
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-24">Order</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseSubjects.map((cs: any) => (
                <TableRow key={cs.id}>
                  <TableCell>
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>{cs.subject?.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={cs.display_order}
                      onChange={(e) => handleUpdateOrder(cs.id, parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSubject(cs.id)}
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">No subjects added yet</p>
        )}
      </div>
    </div>
  );
};