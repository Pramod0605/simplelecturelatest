import { Link } from "react-router-dom";
import { TrendingUp, Clock, Flame, BookOpen, Award, Mail, Calendar, Users, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";
import { HamburgerMenu } from "@/components/mobile/HamburgerMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDPT } from "@/hooks/useDPT";
import { useNotices } from "@/hooks/useNotices";
import { useAssignments } from "@/hooks/useAssignments";
import { useScheduledClasses } from "@/hooks/useScheduledClasses";
import { useTeachers } from "@/hooks/useTeachers";
import { useAttendance } from "@/hooks/useAttendance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import QRCode from "react-qr-code";

const MobileDashboard = () => {
  const { stats } = useDashboardStats();
  const { streak, weeklyData, todayCompleted, averageScore } = useDPT();
  const { notices, unreadCount } = useNotices();
  const { assignments, stats: assignmentStats } = useAssignments();
  const { classes } = useScheduledClasses();
  const { teachers } = useTeachers();
  const { percentage: attendancePercentage } = useAttendance();

  const { data: profile } = useQuery({
    queryKey: ['user-profile-mobile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return { ...data, email: user.email, userId: user.id };
    },
  });

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  const maxScore = Math.max(...weeklyData.map(d => d.score), 1);

  return (
    <>
      <SEOHead title="Dashboard | SimpleLecture" description="Your learning dashboard" />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <HamburgerMenu />
            <h1 className="font-semibold text-lg">Dashboard</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Student ID Card */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-bold text-lg mb-1">
                  {profile?.full_name || 'Student'}
                </h2>
                <p className="text-xs text-muted-foreground mb-2">
                  {profile?.email}
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Attendance: </span>
                    <span className="font-bold text-primary">{attendancePercentage}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID: </span>
                    <span className="font-mono">{profile?.userId?.slice(0, 6).toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-2 rounded">
                <QRCode value={profile?.userId || 'student-id'} size={60} />
              </div>
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <BookOpen className="h-5 w-5 text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats.enrolledCourses}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </Card>

            <Card className="p-4">
              <Clock className="h-5 w-5 text-green-500 mb-2" />
              <p className="text-2xl font-bold">{stats.totalHours}h</p>
              <p className="text-xs text-muted-foreground">Study Time</p>
            </Card>

            <Card className="p-4">
              <Target className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{assignmentStats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </Card>

            <Card className="p-4">
              <Flame className="h-5 w-5 text-red-500 mb-2" />
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </Card>
          </div>

          {/* DPT Status */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Daily Practice Test
              </h3>
              {todayCompleted ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Done
                </Badge>
              ) : (
                <Badge variant="destructive">Pending</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{averageScore}%</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{streak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
            {!todayCompleted && (
              <Button className="w-full" size="sm" asChild>
                <Link to="/learning?tab=dpt">Take Today's DPT</Link>
              </Button>
            )}
          </Card>

          {/* Notice Board */}
          {notices.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Notices
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {notices.slice(0, 3).map((notice) => (
                    <div
                      key={notice.id}
                      className={`p-2 rounded text-xs ${
                        !notice.is_read ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium">{notice.title}</h4>
                        {!notice.is_read && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-muted-foreground line-clamp-2 mb-1">
                        {notice.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(notice.created_at), 'MMM dd')}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Subject Progress */}
          {Object.keys(stats.subjectProgress).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Subject Progress</h3>
              <div className="space-y-3">
                {Object.entries(stats.subjectProgress).slice(0, 4).map(([subject, data]) => (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{subject}</span>
                      <span className="text-xs font-bold">{data.percentage}%</span>
                    </div>
                    <Progress value={data.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Weekly Performance */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly DPT Performance
            </h3>
            <div className="flex items-end justify-between h-28 gap-1">
              {weeklyData.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary/20 rounded-t flex-1 flex items-end">
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${(day.score / maxScore) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Classes */}
          {classes.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Classes
                </h3>
                <Badge variant="outline">{classes.length}</Badge>
              </div>
              <div className="space-y-2">
                {classes.slice(0, 3).map((classItem) => (
                  <div key={classItem.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={classItem.teacher?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {classItem.teacher?.full_name?.[0] || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs">{classItem.subject}</h4>
                        <p className="text-xs text-muted-foreground">
                          {classItem.teacher?.full_name}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(classItem.scheduled_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Assignments */}
          {assignments.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Assignments</h3>
                <div className="flex gap-2">
                  <Badge variant="destructive" className="text-xs">
                    {assignmentStats.pending}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                {assignments.slice(0, 3).map((assignment) => (
                  <Link
                    key={assignment.id}
                    to={`/learning?assignment=${assignment.id}`}
                    className="block p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-xs flex-1">{assignment.title}</h4>
                      <Badge
                        variant={
                          assignment.status === 'pending'
                            ? 'destructive'
                            : assignment.status === 'graded'
                            ? 'secondary'
                            : 'default'
                        }
                        className="text-xs"
                      >
                        {assignment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {assignment.due_date &&
                        `Due: ${format(new Date(assignment.due_date), 'MMM dd')}`}
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Teachers */}
          {teachers.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teachers ({teachers.length})
              </h3>
              <div className="space-y-2">
                {teachers.slice(0, 3).map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={teacher.avatar_url || ''} />
                      <AvatarFallback>{teacher.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{teacher.full_name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {teacher.subjects.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default MobileDashboard;
