import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { BookOpen } from "lucide-react";

export const SubjectProgressTable = () => {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Subject Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const subjects = Object.entries(stats.subjectProgress);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Subject Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No progress data available yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map(([subject, data]) => (
              <div key={subject}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{subject}</span>
                  <span className="text-sm font-bold">{data.percentage}%</span>
                </div>
                <Progress 
                  value={data.percentage} 
                  className={`h-2 ${
                    data.percentage >= 75 
                      ? '[&>div]:bg-green-500' 
                      : data.percentage >= 50 
                      ? '[&>div]:bg-yellow-500' 
                      : '[&>div]:bg-red-500'
                  }`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {data.completed} of {data.total} chapters completed
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
