import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, Award, CheckCircle } from "lucide-react";
import { mockAssignments } from "@/data/mockInstructors";

export const AssignmentsList = () => {
  const pendingCount = mockAssignments.filter(a => a.status === 'pending').length;
  const completedCount = mockAssignments.filter(a => a.status === 'completed').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignments
          </span>
          <div className="flex gap-2 text-xs">
            <Badge variant="destructive">{pendingCount} Pending</Badge>
            <Badge variant="secondary">{completedCount} Done</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {mockAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{assignment.title}</h4>
                    <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                  </div>
                  <Badge 
                    variant={assignment.status === 'pending' ? 'destructive' : 'secondary'} 
                    className="text-xs"
                  >
                    {assignment.status === 'pending' ? 'Pending' : 'Completed'}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {assignment.dueDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {assignment.questions} Questions
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {assignment.totalMarks} marks
                  </div>
                </div>

                {assignment.status === 'completed' && assignment.score !== undefined && (
                  <div className="mt-2 pt-2 border-t flex items-center justify-between">
                    <p className="text-xs flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Submitted
                    </p>
                    <p className="text-xs font-bold">
                      Score: {assignment.score}/{assignment.totalMarks}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
