import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, CheckCircle2 } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const TestsTab = ({ student }: { student: any }) => {
  const testHistory = student.testHistory || {};

  return (
    <div className="space-y-6">
      {/* DPT Performance */}
      {testHistory.dpt && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                DPT Streak & Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-500">
                    {testHistory.dpt.streak}
                  </p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{testHistory.dpt.total_tests}</p>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{testHistory.dpt.average_score}%</p>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly DPT Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={testHistory.dpt.weekly_scores.map((score: number, idx: number) => ({
                    day: `Day ${idx + 1}`,
                    score,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignment History */}
      {testHistory.assignments && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testHistory.assignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {new Date(assignment.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={assignment.percentage >= 70 ? "default" : "destructive"}>
                      {assignment.score}/{assignment.total}
                    </Badge>
                    <span className="font-semibold">{assignment.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quizzes */}
      {testHistory.quizzes && (
        <Card>
          <CardHeader>
            <CardTitle>Quiz Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={testHistory.quizzes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="hsl(var(--primary))" name="Score" />
                <Bar dataKey="total" fill="hsl(var(--muted))" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
