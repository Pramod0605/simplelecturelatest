import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestsFilters } from "@/components/admin/students/tabs/TestsFilters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Trophy, TrendingUp, Target, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MyTestsTabProps {
  student: any;
}

export const MyTestsTab = ({ student }: MyTestsTabProps) => {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [selectedTestType, setSelectedTestType] = useState("all");

  const hasTests = (student.tests_taken || 0) > 0;
  const hasMCQData = Object.keys(student.mcq_practice?.by_subject || {}).length > 0;
  const hasRecentSessions = (student.mcq_practice?.recent_sessions?.length || 0) > 0;

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

  // MCQ Performance by Subject
  const mcqData = Object.entries(student.mcq_practice?.by_subject || {}).map(([subject, data]: [string, any]) => ({
    subject,
    attempted: data.attempted || 0,
    correct: data.correct || 0,
    accuracy: data.accuracy || 0,
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  // Empty state
  if (!hasTests && !hasMCQData) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Test Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete tests and practice MCQs to see your performance analytics here.
            </p>
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TestsFilters
        courses={courses}
        subjects={subjects}
        selectedCourse={selectedCourse}
        selectedSubject={selectedSubject}
        selectedDateRange={selectedDateRange}
        selectedTestType={selectedTestType}
        onCourseChange={setSelectedCourse}
        onSubjectChange={setSelectedSubject}
        onDateRangeChange={setSelectedDateRange}
        onTestTypeChange={setSelectedTestType}
        onReset={() => {
          setSelectedCourse("all");
          setSelectedSubject("all");
          setSelectedDateRange("all");
          setSelectedTestType("all");
        }}
      />

      {/* Test Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.tests_taken || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.avg_test_score || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MCQ Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.mcq_practice?.accuracy_percentage || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {student.mcq_practice?.total_correct || 0}/{student.mcq_practice?.total_attempted || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MCQ Performance Chart */}
      {hasMCQData && (
        <Card>
          <CardHeader>
            <CardTitle>MCQ Performance by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mcqData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attempted" fill="hsl(var(--chart-1))" name="Attempted" />
                <Bar dataKey="correct" fill="hsl(var(--chart-2))" name="Correct" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Accuracy Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasMCQData && (
          <Card>
            <CardHeader>
              <CardTitle>Accuracy by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mcqData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ subject, accuracy }) => `${subject}: ${accuracy}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="accuracy"
                  >
                    {mcqData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Test Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Practice Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {hasRecentSessions ? (
              <div className="space-y-3">
                {student.mcq_practice.recent_sessions.map((session: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{session.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.correct}/{session.questions} correct
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={session.questions > 0 && (session.correct / session.questions) >= 0.8 ? "default" : "secondary"}>
                        {session.questions > 0 ? Math.round((session.correct / session.questions) * 100) : 0}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.date ? new Date(session.date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No recent practice sessions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
