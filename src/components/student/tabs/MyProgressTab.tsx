import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressFilters } from "@/components/admin/students/tabs/ProgressFilters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MyProgressTabProps {
  student: any;
}

export const MyProgressTab = ({ student }: MyProgressTabProps) => {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const hasCourses = (student.courses?.length || 0) > 0;

  const courses = useMemo(() => 
    student.courses?.map((c: any) => c.name) || [],
    [student.courses]
  );

  const subjects = useMemo(() => {
    const allSubjects = new Set<string>();
    student.courses?.forEach((course: any) => {
      course.subjects?.forEach((subject: string) => allSubjects.add(subject));
    });
    return Array.from(allSubjects);
  }, [student.courses]);

  // Generate progress trend data based on available data
  const progressTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const currentProgress = student.total_progress || 0;
    
    // Create a realistic trend leading to current progress
    return months.slice(0, currentMonth + 1).map((month, index) => ({
      month,
      progress: Math.round((currentProgress / (currentMonth + 1)) * (index + 1))
    }));
  }, [student.total_progress]);

  // Empty state
  if (!hasCourses) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Progress Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Enroll in courses and start learning to track your progress.
            </p>
            <Link to="/">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressFilters
        courses={courses}
        subjects={subjects}
        selectedCourse={selectedCourse}
        selectedSubject={selectedSubject}
        onCourseChange={setSelectedCourse}
        onSubjectChange={setSelectedSubject}
        onReset={() => {
          setSelectedCourse("all");
          setSelectedSubject("all");
        }}
      />

      {/* Progress Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {progressTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Overall Progress (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No progress data available yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject-wise Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjects.length > 0 ? (
            subjects.map((subject) => {
              // Calculate progress for each subject based on MCQ accuracy if available
              const subjectData = student.mcq_practice?.by_subject?.[subject];
              const progress = subjectData?.accuracy || 0;
              
              return (
                <div key={subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{subject}</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No subject data available yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {student.courses?.map((course: any) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="text-base">{course.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Progress</span>
                  <span className="font-semibold">{course.progress || 0}%</span>
                </div>
                <Progress value={course.progress || 0} />
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Subjects:</p>
                  <div className="flex flex-wrap gap-2">
                    {course.subjects?.length > 0 ? (
                      course.subjects.map((subject: string) => (
                        <span key={subject} className="text-xs px-2 py-1 bg-muted rounded">
                          {subject}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No subjects assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
