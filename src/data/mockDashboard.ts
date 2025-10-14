export type SubjectStats = { completed: number; total: number; percentage: number };

export const mockSubjectProgress: Record<string, SubjectStats> = {
  Physics: { completed: 8, total: 20, percentage: 40 },
  Chemistry: { completed: 12, total: 20, percentage: 60 },
  Mathematics: { completed: 16, total: 20, percentage: 80 },
  Biology: { completed: 10, total: 20, percentage: 50 },
};

export const mockCourses = [
  { course_id: "c1111111-1111-1111-1111-111111111111", courses: { name: "Physics for JEE", subjects: ["Physics"] } },
  { course_id: "c2222222-2222-2222-2222-222222222222", courses: { name: "Chemistry for JEE", subjects: ["Chemistry"] } },
  { course_id: "c3333333-3333-3333-3333-333333333333", courses: { name: "Mathematics for JEE", subjects: ["Mathematics"] } },
];

export const mockDashboardStats = {
  enrolledCourses: mockCourses.length,
  totalHours: 12.5,
  completedChapters: 38,
  subjectProgress: mockSubjectProgress,
  courses: mockCourses,
};

export const mockDPT = {
  streak: 5,
  averageScore: 78,
  todayCompleted: false,
  weeklyData: [
    { day: "Mon", completed: true, score: 75 },
    { day: "Tue", completed: true, score: 82 },
    { day: "Wed", completed: true, score: 90 },
    { day: "Thu", completed: true, score: 70 },
    { day: "Fri", completed: true, score: 85 },
    { day: "Sat", completed: false, score: null },
    { day: "Sun", completed: false, score: null },
  ],
};