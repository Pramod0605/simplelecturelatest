import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText } from "lucide-react";
import { mockAssignments } from "@/data/mockInstructors";

const AssignmentsList = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Assignments</h2>
      <div className="space-y-4">
        {mockAssignments.map((assignment) => (
          <div key={assignment.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">{assignment.title}</h3>
                  <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                </div>
              </div>
              <Badge variant={assignment.status === "completed" ? "default" : "secondary"}>
                {assignment.status === "completed" ? "Completed" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </div>
              {assignment.status === "completed" && assignment.score !== undefined ? (
                <span className="text-sm font-medium">
                  Score: {assignment.score}/{assignment.totalMarks}
                </span>
              ) : (
                <Button size="sm" variant="outline">
                  Submit
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AssignmentsList;
