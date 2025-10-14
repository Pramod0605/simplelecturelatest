import { Link } from "react-router-dom";
import { TrendingUp, Clock, Flame, BookOpen, Target, CheckCircle } from "lucide-react";
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
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDPT } from "@/hooks/useDPT";
import { useAssignments } from "@/hooks/useAssignments";
import { useTeachers } from "@/hooks/useTeachers";
import { useEnrolledCoursesDetailed } from "@/hooks/useEnrolledCoursesDetailed";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { format } from "date-fns";
import { useState } from "react";

const MobileDashboard = () => {
  const { stats } = useDashboardStats();
  const { streak, weeklyData, todayCompleted, averageScore } = useDPT();
  const { assignments, stats: assignmentStats } = useAssignments();
  const { teachers } = useTeachers();
  const { courses } = useEnrolledCoursesDetailed();
  const { hasLiveClasses } = useLiveClasses();
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  const filteredAssignments = assignments.filter(a => {
    if (assignmentFilter === 'all') return true;
    if (assignmentFilter === 'pending') return a.status === 'pending';
    if (assignmentFilter === 'submitted') return a.status === 'submitted';
    if (assignmentFilter === 'graded') return a.status === 'graded';
    return true;
  });

  return (
    <>
      <SEOHead title="Dashboard | SimpleLecture" description="Your learning dashboard" />
      
      <MobileLayout title="Dashboard" showProfile>
        <div className="space-y-4">
          {/* Quick Stats (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <BookOpen className="h-5 w-5 text-blue-500 mb-2" />
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

          {/* My Courses Section */}
          <div>
            <h2 className="font-semibold mb-3">📚 My Courses</h2>
            <div className="space-y-3">
              {courses.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground text-sm">
                  No courses enrolled yet
                </Card>
              ) : (
                courses.map(course => (
                  <EnrolledCourseCard key={course.id} course={course} />
                ))
              )}
            </div>
          </div>

          {/* Subject Progress Section */}
          <div>
            <h2 className="font-semibold mb-3">📊 Subject Progress</h2>
            <Card className="p-4">
              {Object.entries(stats.subjectProgress).length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No progress data available yet
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(stats.subjectProgress).map(([subject, data]) => (
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

          {/* Assignments Section */}
          <div>
            <h2 className="font-semibold mb-3">📝 Assignments</h2>
            <Card className="p-4">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {(['all', 'pending', 'submitted', 'graded'] as const).map(filter => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={assignmentFilter === filter ? 'default' : 'outline'}
                    onClick={() => setAssignmentFilter(filter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-3">
                {filteredAssignments.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No {assignmentFilter !== 'all' ? assignmentFilter : ''} assignments
                  </p>
                ) : (
                  filteredAssignments.slice(0, 5).map(assignment => {
                    const daysRemaining = assignment.due_date 
                      ? Math.ceil((new Date(assignment.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                      <div key={assignment.id} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{assignment.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.course_id || 'Unknown Course'}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              assignment.status === 'graded' ? 'secondary' :
                              assignment.status === 'submitted' ? 'default' :
                              'destructive'
                            }
                            className="text-xs"
                          >
                            {assignment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Due: {assignment.due_date ? format(new Date(assignment.due_date), 'MMM dd') : 'No date'}</span>
                          {daysRemaining !== null && daysRemaining >= 0 && assignment.status === 'pending' && (
                            <span className="text-orange-600 font-medium">
                              {daysRemaining} days left
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <Button className="w-full mt-4" size="sm" variant="outline" asChild>
                <Link to="/mobile/my-assignments">View All Assignments</Link>
              </Button>
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
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                  <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{streak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
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

          {/* Teachers Section */}
          <div>
            <h2 className="font-semibold mb-3">👨‍🏫 My Teachers</h2>
            <div className="grid grid-cols-3 gap-3">
              {teachers.length === 0 ? (
                <Card className="col-span-3 p-4 text-center text-muted-foreground text-sm">
                  No teachers assigned yet
                </Card>
              ) : (
                teachers.slice(0, 6).map(teacher => (
                  <Card key={teacher.id} className="p-3 text-center">
                    <Avatar className="h-12 w-12 mx-auto mb-2">
                      <AvatarImage src={teacher.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {teacher.full_name?.[0] || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium line-clamp-1">
                      {teacher.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {teacher.subjects?.[0] || 'Teacher'}
                    </p>
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
