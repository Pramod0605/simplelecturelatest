import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ActivityScoreGauge } from "../ActivityScoreGauge";
import { AlertCircle, TrendingUp, Video, Headphones, BookOpen, MessageCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const EngagementTab = ({ student }: { student: any }) => {
  const {
    activity_score = 0,
    activity_breakdown = {},
    activity_trends = [],
    live_classes = {},
    ai_video_usage = {},
    podcast_usage = {},
    mcq_practice = {},
    doubt_clearing = {},
  } = student;

  // Use real activity trend data from daily_activity_logs
  const activityTrend = activity_trends.length > 0 
    ? activity_trends.map((t: any, i: number) => ({
        day: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: t.score,
      }))
    : Array.from({ length: 30 }, (_, i) => ({
        day: `Day ${i + 1}`,
        score: 0,
      }));

  // Calculate weekly attendance from activity trends
  const weeklyAttendance = (() => {
    if (activity_trends.length === 0) return [];
    const weeks: { week: string; attended: number; total: number }[] = [];
    for (let i = 0; i < Math.min(4, Math.ceil(activity_trends.length / 7)); i++) {
      const weekData = activity_trends.slice(i * 7, (i + 1) * 7);
      const attended = weekData.filter((d: any) => d.live_class_minutes > 0).length;
      weeks.push({
        week: `Week ${i + 1}`,
        attended,
        total: weekData.length,
      });
    }
    return weeks.reverse();
  })();

  // Video completion distribution - use real data
  const totalVideos = ai_video_usage.total_videos || 0;
  const watchedCount = ai_video_usage.watched_count || 0;
  const partiallyWatched = Math.max(0, totalVideos - watchedCount);
  
  const videoCompletionData = [
    { name: "Completed", value: watchedCount, color: "hsl(var(--chart-2))" },
    { name: "In Progress", value: partiallyWatched, color: "hsl(var(--chart-3))" },
  ].filter(d => d.value > 0);

  // Doubts by subject from real data
  const doubtsBySubject = Object.entries(doubt_clearing.by_subject || {}).map(([subject, count]) => ({
    subject,
    count,
  }));

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="space-y-6">
      {/* Activity Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Activity Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ActivityScoreGauge score={activity_score} size="lg" />
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">Class Average: 75</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-semibold text-green-500">
                  {activity_score >= 75 ? "Above Average" : "Below Average"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(activity_breakdown).map(([key, value]: [string, any]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="font-semibold">{value}%</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Score Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live Class Participation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Live Class Participation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{live_classes.attended || 0}</p>
                <p className="text-xs text-muted-foreground">Attended</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{live_classes.missed || 0}</p>
                <p className="text-xs text-muted-foreground">Missed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{live_classes.attendance_percentage || 0}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
            </div>

            {live_classes.missed > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Missed Classes Alert</p>
                    <p className="text-xs text-muted-foreground">{live_classes.missed} classes missed recently</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyAttendance.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attended" fill="hsl(var(--chart-2))" name="Active Days" />
                  <Bar dataKey="total" fill="hsl(var(--muted))" name="Total Days" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No activity data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Video Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              AI Video Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Videos Watched</span>
                <span className="font-semibold">{ai_video_usage.watched_count || 0} / {ai_video_usage.total_videos || 0}</span>
              </div>
              <Progress value={(ai_video_usage.watched_count / ai_video_usage.total_videos) * 100 || 0} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold">{Math.floor((ai_video_usage.total_watch_time_minutes || 0) / 60)}h</p>
                <p className="text-xs text-muted-foreground">Watch Time</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold">{ai_video_usage.completion_rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video Completion Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={videoCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {videoCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Podcast & MCQ Practice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-blue-500" />
              Podcast Consumption
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{podcast_usage.total_listened || 0}</p>
                <p className="text-sm text-muted-foreground">Episodes</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{Math.floor((podcast_usage.total_time_minutes || 0) / 60)}h</p>
                <p className="text-sm text-muted-foreground">Listen Time</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Favorite Topics</p>
              <div className="flex flex-wrap gap-2">
                {podcast_usage.favorite_topics?.map((topic: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{topic}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              MCQ Practice Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{mcq_practice.total_attempted || 0}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-500">{mcq_practice.accuracy_percentage || 0}%</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Accuracy by Subject</p>
              {Object.entries(mcq_practice.by_subject || {}).slice(0, 3).map(([subject, data]: [string, any]) => (
                <div key={subject} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{subject}</span>
                    <span className="font-semibold">{data.accuracy}%</span>
                  </div>
                  <Progress value={data.accuracy} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doubt Clearing Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-orange-500" />
            Doubt Clearing Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{doubt_clearing.total_doubts || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-green-500">{doubt_clearing.resolved || 0}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-orange-500">{doubt_clearing.pending || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                <p className="text-xl font-bold">{doubt_clearing.avg_resolution_time_minutes || 0} min</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">Doubts by Subject</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={doubtsBySubject}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {doubt_clearing.pending > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold">Pending Doubts</p>
              <div className="space-y-2">
                {doubt_clearing.recent_doubts?.filter((d: any) => d.status === 'pending').slice(0, 3).map((doubt: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{doubt.question}</p>
                      <p className="text-xs text-muted-foreground">{doubt.subject} • {new Date(doubt.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
