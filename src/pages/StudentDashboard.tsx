import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStudent } from "@/hooks/useCurrentStudent";
import { SEOHead } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { NotificationBell } from "@/components/student/NotificationBell";
import { MyOverviewTab } from "@/components/student/tabs/MyOverviewTab";
import { MyProgressTab } from "@/components/student/tabs/MyProgressTab";
import { MyTestsTab } from "@/components/student/tabs/MyTestsTab";
import { AttendanceCalendar } from "@/components/admin/students/AttendanceCalendar";
import { TimetableTab } from "@/components/admin/students/tabs/TimetableTab";
import { MyAILearningTab } from "@/components/student/tabs/MyAILearningTab";
import { MyCoursesTab } from "@/components/student/tabs/MyCoursesTab";
import { EngagementTab } from "@/components/admin/students/tabs/EngagementTab";
import { 
  Mail, Phone, Calendar, LogOut, User, BarChart3, FileText, 
  CalendarDays, Clock, Brain, Activity, ArrowLeft, BookOpen,
  Flame, Target, Trophy, TrendingUp
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { data: student, isLoading, error } = useCurrentStudent();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center">
            <p className="text-lg font-semibold mb-4">Unable to load student data</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || "Student profile not found"}
            </p>
            <Button onClick={() => navigate("/auth")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="My Dashboard | SimpleLecture" description="Student learning dashboard" />
      <div className="min-h-screen bg-background">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-6">
          {/* Back Button */}
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Hero Section: Profile + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Profile Card */}
            <Card className="lg:col-span-2 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                    <AvatarImage src={student.avatar_url || ""} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {student.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-bold">{student.full_name}</h1>
                      <Badge 
                        variant={student.status === "active" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {student.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{student.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Active: {new Date(student.last_active).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Activity Score Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              <CardContent className="relative p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Activity Score</span>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-primary">{student.activity_score}%</div>
                  <Progress value={student.activity_score} className="mt-3 h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on attendance, tests & engagement
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student.total_progress}%</p>
                  <p className="text-xs text-muted-foreground">Progress</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student.tests_taken}</p>
                  <p className="text-xs text-muted-foreground">Tests Taken</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student.avg_test_score}%</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{student.live_classes.attendance_percentage}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-muted/50">
              <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2 data-[state=active]:bg-background">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="tests" className="gap-2 data-[state=active]:bg-background">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Tests</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-2 data-[state=active]:bg-background">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Attendance</span>
              </TabsTrigger>
              <TabsTrigger value="timetable" className="gap-2 data-[state=active]:bg-background">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Timetable</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-2 data-[state=active]:bg-background">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="ai-learning" className="gap-2 data-[state=active]:bg-background">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">AI Learning</span>
              </TabsTrigger>
              <TabsTrigger value="engagement" className="gap-2 data-[state=active]:bg-background">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Engagement</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <MyOverviewTab student={student} />
            </TabsContent>

            <TabsContent value="progress">
              <MyProgressTab student={student} />
            </TabsContent>

            <TabsContent value="tests">
              <MyTestsTab student={student} />
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardContent className="p-6">
                  <AttendanceCalendar 
                    attendanceData={student.live_classes.recent_classes.map((cls: any) => ({
                      date: cls.date,
                      status: cls.attended ? "present" as const : "absent" as const,
                      subject: cls.subject
                    }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timetable">
              <TimetableTab student={student} />
            </TabsContent>

            <TabsContent value="courses">
              <MyCoursesTab student={student} />
            </TabsContent>

            <TabsContent value="ai-learning">
              <MyAILearningTab student={student} />
            </TabsContent>

            <TabsContent value="engagement">
              <EngagementTab student={student} />
            </TabsContent>
          </Tabs>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default StudentDashboard;
