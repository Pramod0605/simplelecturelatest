import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { StudentFilters } from "@/components/admin/students/StudentFilters";
import { StudentStatsCards } from "@/components/admin/students/StudentStatsCards";
import { StudentListTable } from "@/components/admin/students/StudentListTable";
import { StudentDetailView } from "@/components/admin/students/StudentDetailView";
import { useStudents } from "@/hooks/useStudents";
import { useStudentDetails } from "@/hooks/useStudentDetails";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersList() {
  const [filters, setFilters] = useState({});
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useStudents({ ...filters, page: currentPage, limit: 20 });
  const { data: studentDetails, isLoading: isLoadingDetails } = useStudentDetails(
    selectedStudentId || ""
  );

  if (selectedStudentId && studentDetails && !isLoadingDetails) {
    return (
      <div className="p-8">
        <StudentDetailView
          student={studentDetails}
          onClose={() => setSelectedStudentId(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">
            Comprehensive view of all students with advanced analytics
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <StudentStatsCards />

      <Card className="p-6 space-y-6">
        <StudentFilters onFilterChange={setFilters} />

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <>
            <StudentListTable
              students={data?.students || []}
              onStudentClick={setSelectedStudentId}
            />

            {data && data.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {[...Array(data.totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(data.totalPages, currentPage + 1))}
                      className={currentPage === data.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <p className="text-sm text-muted-foreground text-center">
              Showing {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, data?.total || 0)} of {data?.total || 0} students
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
