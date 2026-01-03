import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressFilters } from "@/components/admin/students/tabs/ProgressFilters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, BookOpen, Video, FileCheck, GraduationCap, ClipboardList, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProgressTrends } from "@/hooks/useProgressTrends";

interface MyProgressTabProps {
  student: any;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <p className="text-primary font-medium mb-2">
          Overall: {data.progress}%
        </p>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <BookOpen className="h-3 w-3" /> Chapters: {data.breakdown.chapters}%
          </p>
          <p className="flex items-center gap-2">
            <Video className="h-3 w-3" /> Videos: {data.breakdown.videos}%
          </p>
          <p className="flex items-center gap-2">
            <FileCheck className="h-3 w-3" /> MCQs: {data.breakdown.mcqs}%
          </p>
          <p className="flex items-center gap-2">
            <GraduationCap className="h-3 w-3" /> Exams: {data.breakdown.exams}%
          </p>
          <p className="flex items-center gap-2">
            <ClipboardList className="h-3 w-3" /> Assignments: {data.breakdown.assignments}%
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const MyProgressTab = ({ student }: MyProgressTabProps) => {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const hasCourses = (student.courses?.length || 0) > 0;

  // Get course ID from name
  const courseIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    student.courses?.forEach((c: any) => {
      map[c.name] = c.id;
    });
    return map;
  }, [student.courses]);

  const courseId = selectedCourse !== "all" ? courseIdMap[selectedCourse] : undefined;

  // Get subjects filtered by selected course
  const subjects = useMemo(() => {
    const allSubjects = new Set<string>();
    student.courses?.forEach((course: any) => {
      // If a specific course is selected, only show subjects from that course
      if (selectedCourse !== "all" && course.name !== selectedCourse) return;
      course.subjects?.forEach((subject: string) => allSubjects.add(subject));
    });
    return Array.from(allSubjects);
  }, [student.courses, selectedCourse]);

  // Fetch real progress trends with subject name
  const { data: progressData, isLoading: isLoadingProgress } = useProgressTrends({
    courseId,
    subjectName: selectedSubject !== "all" ? selectedSubject : undefined,
    days: 30,
  });

  const courses = useMemo(() => 
    student.courses?.map((c: any) => c.name) || [],
    [student.courses]
  );

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
        onCourseChangeCallback={() => setSelectedSubject("all")}
      />

      {/* Current Progress Summary */}
      {progressData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Overall</span>
              </div>
              <p className="text-2xl font-bold">{progressData.currentProgress}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-medium">Chapters</span>
              </div>
              <p className="text-xl font-semibold">{progressData.totals.chaptersCompleted}/{progressData.totals.totalChapters}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Video className="h-4 w-4" />
                <span className="text-xs font-medium">Videos</span>
              </div>
              <p className="text-xl font-semibold">{progressData.totals.videosWatched}/{progressData.totals.totalVideos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileCheck className="h-4 w-4" />
                <span className="text-xs font-medium">Tests</span>
              </div>
              <p className="text-xl font-semibold">{progressData.totals.testsAttempted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ClipboardList className="h-4 w-4" />
                <span className="text-xs font-medium">Assignments</span>
              </div>
              <p className="text-xl font-semibold">{progressData.totals.assignmentsSubmitted}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Trend (Last 30 Days)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Weighted calculation: Chapters (35%), Videos (25%), MCQs (15%), Exams (15%), Assignments (10%)
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingProgress ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : progressData && progressData.trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData.trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="displayDate" 
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  name="Overall Progress (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No progress data available for the selected period.</p>
              <p className="text-sm text-muted-foreground mt-1">Complete chapters, watch videos, or take tests to see your progress.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Breakdown by Component */}
      {progressData && progressData.currentProgress > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <BookOpen className="h-4 w-4" /> Chapter Completion
                </span>
                <span className="text-sm text-muted-foreground">{progressData.breakdown.chapters}%</span>
              </div>
              <Progress value={progressData.breakdown.chapters} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <Video className="h-4 w-4" /> Video Completion
                </span>
                <span className="text-sm text-muted-foreground">{progressData.breakdown.videos}%</span>
              </div>
              <Progress value={progressData.breakdown.videos} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <FileCheck className="h-4 w-4" /> MCQ Accuracy
                </span>
                <span className="text-sm text-muted-foreground">{progressData.breakdown.mcqs}%</span>
              </div>
              <Progress value={progressData.breakdown.mcqs} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <GraduationCap className="h-4 w-4" /> Exam Performance
                </span>
                <span className="text-sm text-muted-foreground">{progressData.breakdown.exams}%</span>
              </div>
              <Progress value={progressData.breakdown.exams} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <ClipboardList className="h-4 w-4" /> Assignment Scores
                </span>
                <span className="text-sm text-muted-foreground">{progressData.breakdown.assignments}%</span>
              </div>
              <Progress value={progressData.breakdown.assignments} />
            </div>
          </CardContent>
        </Card>
      )}

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
