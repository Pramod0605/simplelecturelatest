import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressFilters } from "@/components/admin/students/tabs/ProgressFilters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface MyProgressTabProps {
  student: any;
}

export const MyProgressTab = ({ student }: MyProgressTabProps) => {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const courses = useMemo(() => 
    student.courses.map((c: any) => c.name),
    [student.courses]
  );

  const subjects = useMemo(() => {
    const allSubjects = new Set<string>();
    student.courses.forEach((course: any) => {
      course.subjects.forEach((subject: string) => allSubjects.add(subject));
    });
    return Array.from(allSubjects);
  }, [student.courses]);

  // Mock progress trend data
  const progressTrendData = [
    { month: "Jan", progress: 45 },
    { month: "Feb", progress: 52 },
    { month: "Mar", progress: 61 },
    { month: "Apr", progress: 68 },
    { month: "May", progress: 73 },
    { month: "Jun", progress: 78 },
    { month: "Jul", progress: 82 },
    { month: "Aug", progress: 85 },
    { month: "Sep", progress: student.total_progress },
  ];

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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
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
        </CardContent>
      </Card>

      {/* Subject-wise Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjects.map((subject) => {
            // Calculate progress for each subject based on MCQ accuracy
            const subjectData = student.mcq_practice.by_subject[subject];
            const progress = subjectData ? subjectData.accuracy : 0;
            
            return (
              <div key={subject} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{subject}</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Course Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {student.courses.map((course: any) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="text-base">{course.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Progress</span>
                  <span className="font-semibold">{course.progress}%</span>
                </div>
                <Progress value={course.progress} />
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Subjects:</p>
                  <div className="flex flex-wrap gap-2">
                    {course.subjects.map((subject: string) => (
                      <span key={subject} className="text-xs px-2 py-1 bg-muted rounded">
                        {subject}
                      </span>
                    ))}
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
