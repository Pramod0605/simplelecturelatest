import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Flame, Trophy, Target } from "lucide-react";
import { mockQuestions } from "@/data/mockLearning";
import { MCQTest } from "./MCQTest";

export const DPTTest = () => {
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [streak, setStreak] = useState(7);
  const [showTest, setShowTest] = useState(false);
  const [todayScore, setTodayScore] = useState<number | null>(null);

  const completedDates = [
    new Date(2025, 9, 10),
    new Date(2025, 9, 11),
    new Date(2025, 9, 12),
    new Date(2025, 9, 13),
    new Date(2025, 9, 14),
    new Date(2025, 9, 15),
    new Date(2025, 9, 16),
  ];

  if (showTest) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setShowTest(false)}>
          ← Back to DPT Dashboard
        </Button>
        <MCQTest topicId="dpt-daily" />
      </div>
    );
  }

  if (hasCompletedToday && todayScore !== null) {
    return (
      <div className="space-y-4">
        <Card className="border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              DPT Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{todayScore}%</div>
              <p className="text-muted-foreground">Today's Score</p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold">{streak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">8/10</div>
                <div className="text-xs text-muted-foreground">Questions</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">120</div>
                <div className="text-xs text-muted-foreground">Total Points</div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground pt-4">
              Come back tomorrow for your next Daily Practice Test!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your DPT Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="multiple"
              selected={completedDates}
              className="rounded-md border"
            />
            <div className="flex items-center gap-2 mt-4 text-sm">
              <div className="h-3 w-3 bg-primary rounded-full" />
              <span className="text-muted-foreground">Completed</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daily Practice Test</CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              {streak} Day Streak
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <Target className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">Today's Challenge</h3>
            <p className="text-muted-foreground mb-6">
              Test your knowledge with 10 questions covering all topics
            </p>
            <Button size="lg" onClick={() => setShowTest(true)}>
              Start Today's DPT
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">10</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">15</div>
              <div className="text-xs text-muted-foreground">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Mixed</div>
              <div className="text-xs text-muted-foreground">Difficulty</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="multiple"
            selected={completedDates}
            className="rounded-md border"
          />
          <div className="flex items-center gap-2 mt-4 text-sm">
            <div className="h-3 w-3 bg-primary rounded-full" />
            <span className="text-muted-foreground">Completed Days</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[85, 92, 78, 88, 95, 81, 90].reverse().map((score, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">{completedDates[completedDates.length - 1 - idx].toLocaleDateString()}</span>
              <Badge variant={score >= 80 ? "default" : "secondary"}>{score}%</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
