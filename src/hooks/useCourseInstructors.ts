import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useCourseInstructors = (courseId?: string) => {
  return useQuery({
    queryKey: ["course-instructors", courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from("course_instructors")
        .select(`
          *,
          teacher:teacher_profiles!course_instructors_teacher_id_fkey (
            id,
            full_name,
            email
          ),
          subject:popular_subjects (
            id,
            name
          )
        `)
        .eq("course_id", courseId);

      if (error) throw error;
      return data;
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
        .from("course_instructors")
        .insert({
          course_id: courseId,
          teacher_id: instructorId,
          subject_id: subjectId,
          role: "instructor",
          is_primary: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-instructors", variables.courseId] });
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
        .from("course_instructors")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { courseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course-instructors", data.courseId] });
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
