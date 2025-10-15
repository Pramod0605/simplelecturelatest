import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCourseInstructors, useAddCourseInstructor, useRemoveCourseInstructor } from "@/hooks/useCourseInstructors";
import { useCourseSubjects } from "@/hooks/useCourseSubjects";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CourseInstructorsTabProps {
  courseId?: string;
}

export const CourseInstructorsTab = ({ courseId }: CourseInstructorsTabProps) => {
  const { data: courseInstructors, isLoading } = useCourseInstructors(courseId);
  const { data: courseSubjects } = useCourseSubjects(courseId);
  const addInstructor = useAddCourseInstructor();
  const removeInstructor = useRemoveCourseInstructor();
  
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch available instructors based on course subjects
  const subjectIds = courseSubjects?.map((cs: any) => cs.subject_id) || [];
  
  const { data: availableInstructors = [] } = useQuery({
    queryKey: ["available-instructors", courseId, subjectIds],
    queryFn: async () => {
      if (!courseId || subjectIds.length === 0) return [];

      const { data, error } = await supabase
        .from("instructor_subjects")
        .select(`
          instructor_id,
          subject_id,
          instructor:teacher_profiles!instructor_subjects_instructor_id_fkey (
            id,
            full_name,
            email
          ),
          subject:popular_subjects (
            id,
            name
          )
        `)
        .in("subject_id", subjectIds);

      if (error) throw error;

      // Deduplicate and format
      const instructorMap = new Map();
      data?.forEach((item: any) => {
        const key = `${item.instructor?.id}-${item.subject?.id}`;
        if (!instructorMap.has(key) && item.instructor && item.subject) {
          instructorMap.set(key, {
            id: item.instructor.id,
            name: item.instructor.full_name,
            email: item.instructor.email,
            subjectId: item.subject.id,
            subjectName: item.subject.name,
          });
        }
      });

      return Array.from(instructorMap.values());
    },
    enabled: !!courseId && subjectIds.length > 0,
  });

  const handleAddInstructor = () => {
    if (selectedInstructorId && selectedSubjectId && courseId) {
      addInstructor.mutate(
        { courseId, instructorId: selectedInstructorId, subjectId: selectedSubjectId },
        {
          onSuccess: () => {
            setSelectedInstructorId("");
            setSelectedSubjectId("");
            setDialogOpen(false);
          },
        }
      );
    }
  };

  const handleRemoveInstructor = (id: string) => {
    if (courseId) {
      removeInstructor.mutate({ id, courseId });
    }
  };

  if (!courseId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Save the course first to manage instructors
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Course Instructors</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Instructors are mapped based on subjects in this course
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!availableInstructors || availableInstructors.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Instructor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Instructor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Instructor</Label>
                  <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an instructor" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {availableInstructors
                        .filter((i) => i.subjectId === selectedSubjectId)
                        .map((instructor) => (
                          <SelectItem key={`${instructor.id}-${instructor.subjectId}`} value={instructor.id}>
                            {instructor.name} - {instructor.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>For Subject</Label>
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {courseSubjects?.map((cs) => (
                        <SelectItem key={cs.id} value={cs.subject_id}>
                          {cs.subject?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAddInstructor} 
                  disabled={!selectedInstructorId || !selectedSubjectId || addInstructor.isPending}
                >
                  {addInstructor.isPending ? "Adding..." : "Add Instructor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading instructors...</p>
        ) : courseInstructors && courseInstructors.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseInstructors.map((ci) => (
                <TableRow key={ci.id}>
                  <TableCell className="font-medium">{ci.teacher?.full_name || "N/A"}</TableCell>
                  <TableCell>{ci.subject?.name || "N/A"}</TableCell>
                  <TableCell>{ci.teacher?.email || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ci.role || "instructor"}</Badge>
                  </TableCell>
                  <TableCell>
                    {ci.is_primary ? <Badge>Primary</Badge> : <Badge variant="secondary">Secondary</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveInstructor(ci.id)}
                      disabled={removeInstructor.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No instructors assigned yet. Add subjects with instructors first.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
