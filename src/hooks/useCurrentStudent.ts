import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockStudents } from "@/data/mockStudents";

export const useCurrentStudent = () => {
  return useQuery({
    queryKey: ["current-student"],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Find student by email in mock data
      const student = mockStudents.find(s => s.email === user.email);
      
      if (!student) {
        throw new Error("Student data not found");
      }

      return student;
    },
  });
};
