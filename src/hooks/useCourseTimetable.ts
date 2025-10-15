import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CourseTimetableEntry {
  id: string;
  course_id: string;
  subject_id: string | null;
  instructor_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_number: string | null;
  academic_year: string;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  subject?: { name: string };
  instructor?: { full_name: string };
}

export const useCourseTimetable = (courseId?: string) => {
  return useQuery({
    queryKey: ["course-timetable", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      const { data, error } = await supabase
        .from("course_timetables")
        .select(`
          *,
          subject:popular_subjects(name),
          instructor:teacher_profiles(full_name)
        `)
        .eq("course_id", courseId)
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      return data as CourseTimetableEntry[];
    },
    enabled: !!courseId,
  });
};

export const useCreateCourseTimetableEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<CourseTimetableEntry, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("course_timetables")
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-timetable"] });
      toast.success("Timetable entry created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create timetable entry");
    },
  });
};

export const useUpdateCourseTimetableEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...entry }: Partial<CourseTimetableEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("course_timetables")
        .update(entry)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-timetable"] });
      toast.success("Timetable entry updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update timetable entry");
    },
  });
};

export const useDeleteCourseTimetableEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("course_timetables")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-timetable"] });
      toast.success("Timetable entry deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete timetable entry");
    },
  });
};
