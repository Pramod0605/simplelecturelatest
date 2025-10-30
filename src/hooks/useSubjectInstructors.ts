import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useSubjectInstructors = (subjectId?: string) => {
  return useQuery({
    queryKey: ["subject-instructors", subjectId],
    queryFn: async () => {
      if (!subjectId) return [];

      try {
        // Step 1: Get instructor_subjects rows
        const { data: instructorSubjects, error: isError } = await supabase
          .from("instructor_subjects")
          .select("id, instructor_id, subject_id, category_id, created_at")
          .eq("subject_id", subjectId);

        if (isError) throw isError;
        if (!instructorSubjects || instructorSubjects.length === 0) return [];

        // Step 2: Get unique instructor IDs
        const instructorIds = [...new Set(instructorSubjects.map(row => row.instructor_id))];

        // Step 3: Fetch teacher profiles with departments
        const { data: teachers, error: teachersError } = await supabase
          .from("teacher_profiles")
          .select(`
            id,
            full_name,
            email,
            phone_number,
            department_id,
            departments!teacher_profiles_department_id_fkey (
              id,
              name
            )
          `)
          .in("id", instructorIds);

        if (teachersError) throw teachersError;

        // Step 4: Get categories if any
        const categoryIds = [...new Set(instructorSubjects.map(row => row.category_id).filter(Boolean))];
        let categories = [];
        if (categoryIds.length > 0) {
          const { data: cats, error: catsError } = await supabase
            .from("categories")
            .select("id, name")
            .in("id", categoryIds);
          
          if (!catsError && cats) {
            categories = cats;
          }
        }

        // Step 5: Map the data to expected shape
        return instructorSubjects.map(is => {
          const teacher = teachers?.find(t => t.id === is.instructor_id);
          const category = categories.find(c => c.id === is.category_id);
          
          return {
            ...is,
            teacher: teacher ? {
              id: teacher.id,
              full_name: teacher.full_name,
              email: teacher.email,
              phone_number: teacher.phone_number,
              department: teacher.departments
            } : null,
            category: category || null
          };
        });
      } catch (error) {
        console.error("Error fetching subject instructors:", error);
        throw error;
      }
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
