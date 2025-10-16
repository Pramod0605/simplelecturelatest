import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const ProgressTab = ({ student }: { student: any }) => {
  const progressData = student.progressData || {};

  return (
    <div className="space-y-6">
      {/* Overall Progress Timeline */}
      {progressData.overall_progress_timeline && (
        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData.overall_progress_timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Subject Performance */}
      {progressData.subject_performance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(progressData.subject_performance).map(
                    ([subject, score]) => ({
                      subject,
                      score,
                    })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strength & Weakness Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart
                  data={Object.entries(progressData.subject_performance).map(
                    ([subject, score]) => ({
                      subject,
                      score,
                    })
                  )}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Performance"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chapter Completion */}
      {progressData.chapter_completion && (
        <Card>
          <CardHeader>
            <CardTitle>Chapter-wise Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.chapter_completion.map((chapter: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {chapter.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-medium">{chapter.chapter}</span>
                      <span className="text-sm text-muted-foreground">
                        ({chapter.subject})
                      </span>
                    </div>
                    {chapter.score && (
                      <span className="text-sm font-medium">{chapter.score}%</span>
                    )}
                  </div>
                  <Progress value={chapter.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
