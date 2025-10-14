import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, Award } from "lucide-react";
import { useAssignments } from "@/hooks/useAssignments";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const AssignmentsList = () => {
  const { assignments, stats, isLoading } = useAssignments();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'destructive';
      case 'submitted':
        return 'default';
      case 'graded':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignments
          </span>
          <div className="flex gap-2 text-xs">
            <Badge variant="destructive">{stats.pending} Pending</Badge>
            <Badge variant="default">{stats.submitted} Submitted</Badge>
            <Badge variant="secondary">{stats.graded} Graded</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No assignments available</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {assignments.slice(0, 10).map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/learning?assignment=${assignment.id}`}
                  className="block"
                >
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{assignment.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {assignment.course_name}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(assignment.status)} className="text-xs">
                        {assignment.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {assignment.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {format(new Date(assignment.due_date), 'MMM dd')}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {assignment.total_marks} marks
                      </div>
                    </div>

                    {assignment.status === 'graded' && assignment.score !== undefined && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs">
                          Score: <span className="font-bold">{assignment.score}/{assignment.total_marks}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}

        {assignments.length > 10 && (
          <Button
            variant="outline"
            className="w-full mt-3"
            asChild
          >
            <Link to="/mobile/my-assignments">View All Assignments</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
