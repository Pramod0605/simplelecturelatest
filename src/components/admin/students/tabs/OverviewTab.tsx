import { BookOpen, Brain, Target, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const OverviewTab = ({ student }: { student: any }) => {
  const quickStats = [
    {
      label: "Overall Progress",
      value: `${student.total_progress.toFixed(0)}%`,
      icon: Target,
      color: "text-blue-500",
    },
    {
      label: "Total Tests",
      value: student.tests_taken,
      icon: BookOpen,
      color: "text-green-500",
    },
    {
      label: "AI Queries",
      value: student.ai_queries,
      icon: Brain,
      color: "text-purple-500",
    },
    {
      label: "Avg Score",
      value: `${student.avg_test_score}%`,
      icon: Target,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {student.courses.map((course: any) => (
            <div key={course.id} className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{course.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {course.subjects.join(", ")}
                  </p>
                </div>
                <Badge>{course.progress}%</Badge>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Areas of Improvement */}
      {student.areas_of_improvement && student.areas_of_improvement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Areas of Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {student.areas_of_improvement.map((area: string, idx: number) => (
                <Badge key={idx} variant="outline">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {student.activityLog && student.activityLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {student.activityLog.slice(0, 5).map((activity: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p>{activity.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
