import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Video, Headphones, HelpCircle, Brain } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface MyAILearningTabProps {
  student: any;
}

export const MyAILearningTab = ({ student }: MyAILearningTabProps) => {
  // Video completion distribution
  const videoCompletionData = [
    { name: "Completed", value: Math.round((student.ai_video_usage.completion_rate / 100) * student.ai_video_usage.total_videos) },
    { name: "In Progress", value: student.ai_video_usage.total_videos - Math.round((student.ai_video_usage.completion_rate / 100) * student.ai_video_usage.total_videos) },
  ];

  // Doubts by subject
  const doubtsData = Object.entries(student.doubt_clearing.by_subject).map(([subject, count]) => ({
    subject,
    count,
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-6">
      {/* AI Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.ai_video_usage.watched_count}</div>
            <p className="text-xs text-muted-foreground">of {student.ai_video_usage.total_videos}</p>
            <Progress value={(student.ai_video_usage.watched_count / student.ai_video_usage.total_videos) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(student.ai_video_usage.total_watch_time_minutes / 60)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {student.ai_video_usage.total_watch_time_minutes} minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Podcasts</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.podcast_usage.total_listened}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(student.podcast_usage.total_time_minutes / 60)}h listened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Queries</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.ai_queries}</div>
            <p className="text-xs text-muted-foreground">Total questions asked</p>
          </CardContent>
        </Card>
      </div>

      {/* Video Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Video Completion Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold">{student.ai_video_usage.completion_rate}%</p>
              <p className="text-sm text-muted-foreground">Average Completion Rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Videos Watched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {student.ai_video_usage.recent_videos.map((video: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{video.title}</p>
                      <p className="text-xs text-muted-foreground">{video.subject} • {video.duration} min</p>
                    </div>
                    <Badge variant={video.watched_percentage === 100 ? "default" : "secondary"}>
                      {video.watched_percentage}%
                    </Badge>
                  </div>
                  <Progress value={video.watched_percentage} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doubt Clearing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Doubt Clearing Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Total Doubts</span>
                <span className="text-xl font-bold">{student.doubt_clearing.total_doubts}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Resolved</span>
                <span className="text-xl font-bold text-green-600">{student.doubt_clearing.resolved}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Pending</span>
                <span className="text-xl font-bold text-orange-600">{student.doubt_clearing.pending}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Avg Resolution Time</span>
                <span className="text-xl font-bold">{student.doubt_clearing.avg_resolution_time_minutes}m</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Recent Doubts</h4>
              <div className="space-y-3">
                {student.doubt_clearing.recent_doubts.map((doubt: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm mb-1">{doubt.question}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{doubt.subject}</span>
                      <Badge variant={doubt.status === "resolved" ? "default" : "secondary"}>
                        {doubt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Podcast Listening */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Podcast Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Listened</p>
                <p className="text-2xl font-bold">{student.podcast_usage.total_listened}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">{Math.round(student.podcast_usage.total_time_minutes / 60)}h</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Favorite Topics</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {student.podcast_usage.favorite_topics.slice(0, 2).map((topic: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{topic}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Recent Podcasts</h4>
              <div className="space-y-2">
                {student.podcast_usage.recent_podcasts.map((podcast: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{podcast.title}</p>
                      <p className="text-xs text-muted-foreground">{podcast.subject} • {podcast.duration} min</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{podcast.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
