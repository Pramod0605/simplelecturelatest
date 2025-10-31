import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useCourseInstructors = (courseId?: string) => {
  return useQuery({
    queryKey: ["course-instructors", courseId],
    queryFn: async () => {
      if (!courseId) return [];

      // First get instructor_subjects entries for this course
      const { data: instructorSubjects, error: isError } = await supabase
        .from("instructor_subjects")
        .select("*")
        .eq("course_id", courseId);

      if (isError) throw isError;
      if (!instructorSubjects || instructorSubjects.length === 0) return [];

      // Get unique instructor and subject IDs
      const instructorIds = [...new Set(instructorSubjects.map(row => row.instructor_id))];
      const subjectIds = [...new Set(instructorSubjects.map(row => row.subject_id).filter(Boolean))];

      // Fetch teachers
      const { data: teachers, error: teachersError } = await supabase
        .from("teacher_profiles")
        .select(`
          id,
          full_name,
          email,
          phone_number,
          departments(id, name)
        `)
        .in("id", instructorIds);

      if (teachersError) throw teachersError;

      // Fetch subjects (try popular_subjects first, then subjects table)
      let subjects: any[] = [];
      if (subjectIds.length > 0) {
        const { data: subs, error: subsError } = await supabase
          .from("popular_subjects")
          .select("id, name")
          .in("id", subjectIds);
        
        if (!subsError && subs) {
          subjects = subs;
        }
      }

      // Map the data
      return instructorSubjects.map(is => {
        const teacher = teachers?.find(t => t.id === is.instructor_id);
        const subject = subjects.find(s => s.id === is.subject_id);
        
        return {
          ...is,
          teacher: teacher || null,
          subject: subject || null
        };
      });
    },
    enabled: !!courseId,
  });
};

export const useAddCourseInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      instructorId,
      subjectId,
    }: {
      courseId: string;
      instructorId: string;
      subjectId: string;
    }) => {
      const { data, error } = await supabase
        .from("instructor_subjects")
        .insert({
          course_id: courseId,
          instructor_id: instructorId,
          subject_id: subjectId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-instructors", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      toast({ title: "Success", description: "Instructor added to course" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveCourseInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      courseId,
    }: {
      id: string;
      courseId: string;
    }) => {
      const { error } = await supabase
        .from("instructor_subjects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { courseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course-instructors", data.courseId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      toast({ title: "Success", description: "Instructor removed from course" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
