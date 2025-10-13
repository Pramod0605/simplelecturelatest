import { Link } from "react-router-dom";
import { TrendingUp, Clock, CheckCircle, Flame, BookOpen, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";
import { HamburgerMenu } from "@/components/mobile/HamburgerMenu";

const MobileDashboard = () => {
  const stats = [
    { label: "Courses in Progress", value: "3", icon: BookOpen, color: "text-blue-500" },
    { label: "Hours This Week", value: "12.5", icon: Clock, color: "text-green-500" },
    { label: "Assignments Due", value: "5", icon: CheckCircle, color: "text-orange-500" },
    { label: "Day Streak", value: "7", icon: Flame, color: "text-red-500" },
  ];

  const recentCourses = [
    { id: "1", title: "React Fundamentals", progress: 65, thumbnail: "/placeholder.svg" },
    { id: "2", title: "Node.js Basics", progress: 40, thumbnail: "/placeholder.svg" },
    { id: "3", title: "SQL Database", progress: 80, thumbnail: "/placeholder.svg" },
  ];

  const weeklyActivity = [
    { day: "Mon", hours: 2 },
    { day: "Tue", hours: 1.5 },
    { day: "Wed", hours: 3 },
    { day: "Thu", hours: 2.5 },
    { day: "Fri", hours: 1 },
    { day: "Sat", hours: 2 },
    { day: "Sun", hours: 0.5 },
  ];

  const maxHours = Math.max(...weeklyActivity.map(d => d.hours));

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
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <Card key={stat.label} className="p-4">
                  <IconComponent className={`h-6 w-6 ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </Card>
              );
            })}
          </div>

          {/* Continue Learning */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Continue Learning</h2>
              <Link to="/mobile/my-learning" className="text-sm text-primary">View all</Link>
            </div>
            <div className="space-y-3">
              {recentCourses.map((course) => (
                <Card key={course.id} className="p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-2">{course.title}</h3>
                      <Progress value={course.progress} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground">{course.progress}% complete</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Weekly Activity */}
          <div>
            <h2 className="font-semibold text-lg mb-3">Weekly Activity</h2>
            <Card className="p-4">
              <div className="flex items-end justify-between h-32 gap-2">
                {weeklyActivity.map((day) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-primary/20 rounded-t flex-1 flex items-end">
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${(day.hours / maxHours) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total this week</p>
                  <p className="text-lg font-bold text-foreground">12.5 hours</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +20%
                </Badge>
              </div>
            </Card>
          </div>

          {/* Recommended */}
          <div>
            <h2 className="font-semibold text-lg mb-3">Recommended for You</h2>
            <Card className="p-4">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-muted rounded flex-shrink-0" />
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-2">New</Badge>
                  <h3 className="font-medium text-sm mb-1">Advanced React Patterns</h3>
                  <p className="text-xs text-muted-foreground mb-2">Master advanced React concepts</p>
                  <div className="flex items-center gap-2">
                    <Award className="h-3 w-3 text-primary" />
                    <span className="text-xs text-muted-foreground">Certificate included</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default MobileDashboard;
