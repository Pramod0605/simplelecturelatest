import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAttendance } from "@/hooks/useAttendance";
import { useDPT } from "@/hooks/useDPT";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

const defaultWeeklyData = [
  { day: 'Mon', completed: false },
  { day: 'Tue', completed: false },
  { day: 'Wed', completed: false },
  { day: 'Thu', completed: false },
  { day: 'Fri', completed: false },
  { day: 'Sat', completed: false },
  { day: 'Sun', completed: false },
];
export const StudentIDCard = () => {
  const { percentage: attendancePercentage } = useAttendance();

  // Share the same query key as DashboardHeader to avoid duplicate fetches
  const { data: profile } = useQuery({
    queryKey: ['dashboard-header-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      return { ...data, email: user.email };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  const { streak, averageScore, todayCompleted, weeklyData } = useDPT() as any; // fallback to any for compatibility
  const navigate = useNavigate();
  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Photo + Details */}
        <div className="flex items-start gap-6">
          <Avatar className="h-28 w-28">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold mb-1 truncate">
              Welcome, {profile?.full_name || 'Student'}!
            </h2>
            <p className="text-muted-foreground mb-2 text-sm">
              Keep up the great work! Every day is a step closer to your goals.
            </p>
            <p className="text-muted-foreground mb-4 truncate">
              {profile?.email || 'student@example.com'}
            </p>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-3xl font-bold text-primary">{attendancePercentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="text-lg font-mono font-bold">{profile?.id?.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: DPT Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Daily Practice Test</h3>
            <Badge variant={todayCompleted ? 'secondary' : 'default'}>
              {todayCompleted ? 'Completed Today' : 'Pending Today'}
            </Badge>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {(weeklyData || defaultWeeklyData).map((d: any, idx: number) => (
              <div key={idx} className={`h-8 rounded-md flex items-center justify-center text-xs ${d.completed ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {d.completed ? (d.score ?? '✓') : d.day?.[0]}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-xl font-bold flex items-center gap-1">
                <Flame className="h-4 w-4 text-primary" /> {streak ?? 0} days
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Average Score</p>
              <p className="text-xl font-bold">{averageScore ?? 0}%</p>
            </div>
          </div>
          <Button onClick={() => navigate('/learning')} disabled={todayCompleted}>
            {todayCompleted ? 'Great job! Come back tomorrow' : "Take Today's DPT"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
