import { useQuery } from "@tanstack/react-query";
import { mockStudents, mockProgressData, mockTestHistory, mockAIActivity, mockFollowups, mockActivityLog } from "@/data/mockStudents";

export const useStudentDetails = (studentId: string) => {
  return useQuery({
    queryKey: ["student-details", studentId],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const student = mockStudents.find(s => s.id === studentId);
      if (!student) throw new Error("Student not found");

      return {
        ...student,
        progressData: mockProgressData[studentId] || {},
        testHistory: mockTestHistory[studentId] || {},
        aiActivity: mockAIActivity[studentId] || {},
        followups: mockFollowups[studentId] || [],
        activityLog: mockActivityLog[studentId] || [],
      };
    },
    enabled: !!studentId,
  });
};
