import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Clock, FolderOpen, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MyOverviewTabProps {
  student: any;
}

export const MyOverviewTab = ({ student }: MyOverviewTabProps) => {
  const hasClasses = (student.live_classes?.recent_classes?.length || 0) > 0;
  const hasCourses = (student.courses?.length || 0) > 0;
  const hasAreasOfImprovement = (student.areas_of_improvement?.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Enrolled Courses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            My Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasCourses ? (
            student.courses.map((course: any) => (
              <div key={course.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{course.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {course.subjects?.length > 0 
                        ? course.subjects.slice(0, 3).join(", ") + (course.subjects.length > 3 ? ` +${course.subjects.length - 3} more` : "")
                        : "No subjects assigned"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-mono">
                    {course.progress || 0}%
                  </Badge>
                </div>
                <Progress value={course.progress || 0} className="h-2" />
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
              <Link to="/">
                <Button variant="outline">Browse Courses</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Areas of Improvement */}
      {hasAreasOfImprovement && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-amber-500" />
              Areas to Focus On
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {student.areas_of_improvement.map((area: string, index: number) => (
                <Badge key={index} variant="outline" className="py-1.5 px-3">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasClasses ? (
            <div className="space-y-3">
              {student.live_classes.recent_classes.slice(0, 5).map((cls: any) => (
                <div 
                  key={cls.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {cls.attended ? (
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{cls.topic}</p>
                      <p className="text-xs text-muted-foreground">{cls.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={cls.attended ? "default" : "destructive"} 
                      className="text-xs"
                    >
                      {cls.attended ? "Attended" : "Missed"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(cls.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No recent class activity yet.</p>
              <p className="text-xs text-muted-foreground mt-2">
                Your class attendance will appear here once you start attending.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
