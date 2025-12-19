import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignments } from "@/hooks/useAssignments";
import { format } from "date-fns";

const AssignmentsList = () => {
  const { assignments, isLoading } = useAssignments();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge variant="default">Graded</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Assignments</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Assignments</h2>
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No assignments yet</p>
          </div>
        ) : (
          assignments.slice(0, 5).map((assignment) => (
            <div key={assignment.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {assignment.total_marks} marks
                    </p>
                  </div>
                </div>
                {getStatusBadge(assignment.status)}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Due: {assignment.due_date 
                    ? format(new Date(assignment.due_date), 'MMM d, yyyy')
                    : 'No due date'
                  }
                </div>
                {assignment.status === 'graded' && assignment.score !== undefined ? (
                  <span className="text-sm font-medium">
                    Score: {assignment.score}/{assignment.total_marks}
                  </span>
                ) : assignment.status === 'pending' ? (
                  <Button size="sm" variant="outline">
                    Submit
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default AssignmentsList;
