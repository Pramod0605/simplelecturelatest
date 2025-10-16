import { useState } from "react";
import { ChevronRight, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  courses: any[];
  total_progress: number;
  tests_taken: number;
  avg_test_score: number;
  status: string;
  at_risk: boolean;
  followups_pending: number;
}

interface StudentListTableProps {
  students: Student[];
  onStudentClick: (studentId: string) => void;
}

export const StudentListTable = ({ students, onStudentClick }: StudentListTableProps) => {
  const getStatusBadge = (status: string, atRisk: boolean) => {
    if (atRisk) {
      return <Badge variant="destructive">At Risk</Badge>;
    }
    if (status === "active") {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Courses</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Tests</TableHead>
            <TableHead>Avg Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onStudentClick(student.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={student.avatar_url} />
                    <AvatarFallback>{student.full_name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.full_name}</p>
                    {student.followups_pending > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-500">
                        <AlertCircle className="h-3 w-3" />
                        {student.followups_pending} pending
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{student.email}</p>
                  <p className="text-muted-foreground">{student.phone}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{student.courses.length}</p>
              </TableCell>
              <TableCell>
                <div className="space-y-1 min-w-[120px]">
                  <div className="flex items-center justify-between text-sm">
                    <span>{student.total_progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={student.total_progress} className="h-2" />
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{student.tests_taken}</p>
              </TableCell>
              <TableCell>
                <p className="font-medium">{student.avg_test_score}%</p>
              </TableCell>
              <TableCell>
                {getStatusBadge(student.status, student.at_risk)}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
