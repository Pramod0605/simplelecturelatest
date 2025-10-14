import { Link } from "react-router-dom";
import { TrendingUp, Clock, Flame, BookOpen, Target, CheckCircle, Bell, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { EnrolledCourseCard } from "@/components/mobile/EnrolledCourseCard";
import { ClassTimetableView } from "@/components/mobile/ClassTimetableView";
import { LiveClassBanner } from "@/components/mobile/LiveClassBanner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDPT } from "@/hooks/useDPT";
import { useAssignments } from "@/hooks/useAssignments";
import { useTeachers } from "@/hooks/useTeachers";
import { useEnrolledCoursesDetailed } from "@/hooks/useEnrolledCoursesDetailed";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useNotices } from "@/hooks/useNotices";
import { format } from "date-fns";
import { useState } from "react";

const MobileDashboard = () => {
  const { stats } = useDashboardStats();
  const { streak, weeklyData, todayCompleted, averageScore } = useDPT();
  const { assignments, stats: assignmentStats } = useAssignments();
  const { teachers } = useTeachers();
  const { courses } = useEnrolledCoursesDetailed();
  const { hasLiveClasses } = useLiveClasses();
  const { notices, unreadCount } = useNotices();
  const [courseFilter, setCourseFilter] = useState<string>('ALL');

  // Mock upcoming classes data
  const upcomingClasses = [
    { id: '1', subject: 'Physics', time: '10:00 AM', room: 'Room 301' },
    { id: '2', subject: 'Chemistry', time: '11:30 AM', room: 'Lab 2' },
    { id: '3', subject: 'Mathematics', time: '2:00 PM', room: 'Room 205' },
  ];

  // Filter subjects by course
  const filteredSubjects = courseFilter === 'ALL' 
    ? Object.entries(stats.subjectProgress)
    : Object.entries(stats.subjectProgress).filter(([_, data]) => {
        const course = stats.courses.find(c => c.course_id === courseFilter);
        if (!course) return true;
        return true; // In real app, check if subject belongs to course
      });

  return (
    <>
      <SEOHead title="Dashboard | SimpleLecture" description="Your learning dashboard" />
      
      <MobileLayout title="Dashboard" showProfile>
        <div className="space-y-4">
          {/* Quick Stats (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <BookOpen className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.enrolledCourses}</p>
              <p className="text-xs text-muted-foreground">Courses Enrolled</p>
            </Card>

            <Card className="p-4">
              <Clock className="h-5 w-5 text-green-500 mb-2" />
              <p className="text-2xl font-bold">{stats.totalHours}h</p>
              <p className="text-xs text-muted-foreground">Hours This Week</p>
            </Card>

            <Card className="p-4">
              <Target className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{assignmentStats.pending}</p>
              <p className="text-xs text-muted-foreground">Assignments Due</p>
            </Card>

            <Card className="p-4">
              <Flame className="h-5 w-5 text-red-500 mb-2" />
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-xs text-muted-foreground">DPT Streak</p>
            </Card>
          </div>

          {/* Live Classes Section */}
          {hasLiveClasses && (
            <div>
              <h2 className="font-semibold mb-3">🔴 Live Now</h2>
              <LiveClassBanner />
            </div>
          )}

          {/* Class Timetable Section */}
          <div>
            <h2 className="font-semibold mb-3">📅 Today's Schedule</h2>
            <ClassTimetableView />
          </div>

          {/* Notice Board Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">📢 Notice Board</h2>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadCount} New</Badge>
              )}
            </div>
            <Card className="p-4">
              {notices.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-2">No notices available</p>
              ) : (
                <div className="space-y-3">
                  {notices.slice(0, 4).map(notice => (
                    <div key={notice.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <Bell className={`h-4 w-4 mt-0.5 flex-shrink-0 ${!notice.is_read ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium line-clamp-1 ${!notice.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notice.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notice.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Subject Progress Section with Course Filter */}
          <div>
            <h2 className="font-semibold mb-3">📊 Subject Progress</h2>
            <Card className="p-4">
              {/* Course Filter */}
              <div className="mb-4">
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Courses</SelectItem>
                    {stats.courses.map(course => (
                      <SelectItem key={course.course_id} value={course.course_id}>
                        {course.courses.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredSubjects.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No progress data available yet
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredSubjects.map(([subject, data]) => (
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
                        {data.completed} of {data.total} chapters
                      </p>
                    </div>
                  ))}
                  <Button className="w-full mt-2" size="sm" variant="outline" asChild>
                    <Link to="/mobile/my-learning">Continue Learning</Link>
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Combined Upcoming Classes & Assignments (2-column) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left: Upcoming Classes */}
            <Card className="p-3">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-1">
                🎓 Classes
              </h3>
              <div className="space-y-3">
                {upcomingClasses.slice(0, 3).map(cls => (
                  <div key={cls.id} className="text-xs">
                    <p className="font-medium text-foreground">{cls.subject}</p>
                    <p className="text-muted-foreground">{cls.time}</p>
                    <p className="text-muted-foreground">{cls.room}</p>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Right: Assignments */}
            <Card className="p-3">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-1">
                📝 Homework
              </h3>
              <div className="space-y-3">
                {assignments.filter(a => a.status === 'pending').slice(0, 3).map(assignment => {
                  const daysRemaining = assignment.due_date 
                    ? Math.ceil((new Date(assignment.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                  
                  return (
                    <div key={assignment.id} className="text-xs">
                      <p className="font-medium text-foreground line-clamp-1">{assignment.course_name || 'Assignment'}</p>
                      <Badge 
                        variant="destructive"
                        className="text-xs mt-1"
                      >
                        {daysRemaining !== null && daysRemaining >= 0 ? `${daysRemaining}d left` : 'Due'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* DPT Section */}
          <div>
            <h2 className="font-semibold mb-3">🎯 Daily Practice Test</h2>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${todayCompleted ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium">Today's Status</span>
                </div>
                <Badge variant={todayCompleted ? 'secondary' : 'destructive'}>
                  {todayCompleted ? 'Completed' : 'Pending'}
                </Badge>
              </div>

              {/* Weekly Calendar */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weeklyData.map((day, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {day.day}
                    </div>
                    <div className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center ${
                      day.completed ? 'bg-green-500' : 'bg-muted'
                    }`}>
                      {day.completed && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-primary/5 rounded">
                  <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{streak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center p-3 bg-green-500/5 rounded">
                  <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{averageScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>

              {!todayCompleted && (
                <Button className="w-full" asChild>
                  <Link to="/learning?tab=dpt">Take Today's DPT</Link>
                </Button>
              )}
            </Card>
          </div>

          {/* My Instructors - Vertical List */}
          <div>
            <h2 className="font-semibold mb-3">👨‍🏫 My Instructors</h2>
            <div className="space-y-3">
              {teachers.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground text-sm">
                  No instructors assigned yet
                </Card>
              ) : (
                teachers.slice(0, 5).map(teacher => (
                  <Card key={teacher.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={teacher.avatar_url || ''} />
                        <AvatarFallback className="text-sm">
                          {teacher.full_name?.[0] || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{teacher.full_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {teacher.subjects?.join(', ') || 'Instructor'}
                        </p>
                        {teacher.email && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{teacher.email}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </MobileLayout>
    </>
  );
};

export default MobileDashboard;
