import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useSubjectInstructors = (subjectId?: string) => {
  return useQuery({
    queryKey: ["subject-instructors", subjectId],
    queryFn: async () => {
      if (!subjectId) return [];

      const { data, error } = await supabase
        .from("instructor_subjects")
        .select(`
          *,
          teacher:teacher_profiles!instructor_id (
            id,
            full_name,
            email,
            phone_number,
            department:departments (
              id,
              name
            )
          )
        `)
        .eq("subject_id", subjectId);

      if (error) throw error;
      return data;
    },
    enabled: !!subjectId,
  });
};

export const useAddSubjectInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subjectId,
      instructorId,
    }: {
      subjectId: string;
      instructorId: string;
    }) => {
      const { data, error } = await supabase
        .from("instructor_subjects")
        .insert({
          subject_id: subjectId,
          instructor_id: instructorId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subject-instructors", variables.subjectId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      toast({ title: "Success", description: "Instructor added successfully" });
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

export const useRemoveSubjectInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subjectId,
      instructorId,
    }: {
      subjectId: string;
      instructorId: string;
    }) => {
      const { error } = await supabase
        .from("instructor_subjects")
        .delete()
        .eq("subject_id", subjectId)
        .eq("instructor_id", instructorId);

      if (error) throw error;
      return { subjectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subject-instructors", data.subjectId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      toast({ title: "Success", description: "Instructor removed successfully" });
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
