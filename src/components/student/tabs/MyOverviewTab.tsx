import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, BookOpen, Trophy, TrendingUp, Clock, Target, FolderOpen } from "lucide-react";
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.activity_score || 0}%</div>
            <Progress value={student.activity_score || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.total_progress || 0}%</div>
            <Progress value={student.total_progress || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.tests_taken || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {student.avg_test_score || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {student.live_classes?.attendance_percentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {student.live_classes?.attended || 0}/{student.live_classes?.total_scheduled || 0} classes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasCourses ? (
            student.courses.map((course: any) => (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{course.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.subjects?.length > 0 ? course.subjects.join(", ") : "No subjects assigned"}
                    </p>
                  </div>
                  <Badge variant="secondary">{course.progress || 0}%</Badge>
                </div>
                <Progress value={course.progress || 0} />
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-3">You haven't enrolled in any courses yet.</p>
              <Link to="/">
                <Button variant="outline" size="sm">Browse Courses</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Areas of Improvement */}
      {hasAreasOfImprovement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Areas to Focus On
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {student.areas_of_improvement.map((area: string, index: number) => (
                <Badge key={index} variant="outline">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasClasses ? (
            student.live_classes.recent_classes.slice(0, 3).map((cls: any) => (
              <div key={cls.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{cls.topic}</p>
                  <p className="text-xs text-muted-foreground">{cls.subject}</p>
                </div>
                <div className="text-right">
                  <Badge variant={cls.attended ? "default" : "destructive"} className="text-xs">
                    {cls.attended ? "Attended" : "Missed"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(cls.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No recent class activity yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your class attendance will appear here once you start attending.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
