import { useState } from "react";
import { PlayCircle, BookmarkIcon, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";
import { HamburgerMenu } from "@/components/mobile/HamburgerMenu";

const mockCourses = {
  inProgress: [
    { id: "1", title: "React Fundamentals", progress: 65, thumbnail: "/placeholder.svg", instructor: "Sneha Patel" },
    { id: "2", title: "Node.js Basics", progress: 40, thumbnail: "/placeholder.svg", instructor: "Amit Verma" },
    { id: "3", title: "SQL Database", progress: 80, thumbnail: "/placeholder.svg", instructor: "Priya Sharma" },
  ],
  completed: [
    { id: "4", title: "HTML & CSS", progress: 100, thumbnail: "/placeholder.svg", instructor: "Rajesh Kumar", completedDate: "2025-09-15" },
  ],
  saved: [
    { id: "5", title: "Advanced React", progress: 0, thumbnail: "/placeholder.svg", instructor: "Sneha Patel" },
    { id: "6", title: "MongoDB", progress: 0, thumbnail: "/placeholder.svg", instructor: "Amit Verma" },
  ],
};

const MobileMyLearning = () => {
  const [activeTab, setActiveTab] = useState("inProgress");

  const CourseCard = ({ course, showProgress = true, isCompleted = false }: any) => (
    <Card className="p-4">
      <div className="flex gap-3">
        <div className="w-20 h-20 bg-muted rounded flex-shrink-0 flex items-center justify-center">
          {isCompleted ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <PlayCircle className="h-8 w-8 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{course.title}</h3>
          <p className="text-xs text-muted-foreground mb-2">{course.instructor}</p>
          {showProgress && (
            <>
              <Progress value={course.progress} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">{course.progress}% complete</p>
            </>
          )}
          {isCompleted && course.completedDate && (
            <p className="text-xs text-green-600">Completed: {course.completedDate}</p>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <SEOHead title="My Learning | SimpleLecture" description="Your enrolled courses" />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <HamburgerMenu />
            <h1 className="font-semibold text-lg">My Learning</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
            <TabsTrigger value="inProgress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="inProgress" className="p-4 space-y-4">
            {mockCourses.inProgress.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="p-4 space-y-4">
            {mockCourses.completed.map((course) => (
              <CourseCard key={course.id} course={course} isCompleted />
            ))}
          </TabsContent>

          <TabsContent value="saved" className="p-4 space-y-4">
            {mockCourses.saved.map((course) => (
              <Card key={course.id} className="p-4">
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                    <BookmarkIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{course.instructor}</p>
                    <button className="text-xs text-primary font-medium">Start Learning</button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <BottomNav />
      </div>
    </>
  );
};

export default MobileMyLearning;
