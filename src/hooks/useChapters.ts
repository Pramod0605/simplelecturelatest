import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getChaptersBySubject } from "@/data/mockLearning";

export const useChapters = (courseId?: string, subjectName?: string) => {
  return useQuery({
    queryKey: ['chapters', courseId, subjectName],
    queryFn: async () => {
      if (!courseId || !subjectName) return [];

      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .eq('subject', subjectName)
        .order('sequence_order');
      
      if (error) {
        console.log('No database chapters found, using mock data');
        return getChaptersBySubject(subjectName);
      }

      // If no data from database, use mock data
      if (!data || data.length === 0) {
        return getChaptersBySubject(subjectName);
      }

      return data;
    },
    enabled: !!courseId && !!subjectName,
  });
};
