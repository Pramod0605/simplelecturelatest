import { useQuery } from "@tanstack/react-query";
import { mockStudents } from "@/data/mockStudents";

interface StudentFilters {
  search?: string;
  subject?: string;
  course?: string;
  category?: string;
  enrollmentDateFrom?: string;
  enrollmentDateTo?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const useStudents = (filters: StudentFilters = {}) => {
  return useQuery({
    queryKey: ["students", filters],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let filtered = [...mockStudents];

      // Apply filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          s =>
            s.full_name.toLowerCase().includes(searchLower) ||
            s.email.toLowerCase().includes(searchLower) ||
            s.phone.includes(searchLower)
        );
      }

      if (filters.course) {
        filtered = filtered.filter(s =>
          s.courses.some(c => c.id === filters.course)
        );
      }

      if (filters.status) {
        filtered = filtered.filter(s => s.status === filters.status);
      }

      if (filters.enrollmentDateFrom) {
        filtered = filtered.filter(
          s => s.enrollment_date >= filters.enrollmentDateFrom!
        );
      }

      if (filters.enrollmentDateTo) {
        filtered = filtered.filter(
          s => s.enrollment_date <= filters.enrollmentDateTo!
        );
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        students: filtered.slice(start, end),
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      };
    },
  });
};
