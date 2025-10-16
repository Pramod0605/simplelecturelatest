export const mockStudents = [
  {
    id: "stu-001",
    full_name: "Aarav Sharma",
    email: "aarav.sharma@email.com",
    phone: "+91-9876543210",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav",
    enrollment_date: "2024-01-15",
    last_active: "2025-10-16T14:30:00",
    status: "active",
    courses: [
      {
        id: "course-1",
        name: "JEE Main 2025 Complete",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        progress: 67,
        enrolled_at: "2024-01-15"
      },
      {
        id: "course-2",
        name: "Advanced Mathematics",
        subjects: ["Calculus", "Algebra", "Trigonometry"],
        progress: 82,
        enrolled_at: "2024-03-20"
      }
    ],
    total_progress: 74.5,
    tests_taken: 45,
    avg_test_score: 78,
    ai_queries: 234,
    areas_of_improvement: ["Organic Chemistry", "Calculus Integration"],
    followups_pending: 2,
    at_risk: false
  },
  {
    id: "stu-002",
    full_name: "Priya Patel",
    email: "priya.patel@email.com",
    phone: "+91-9876543211",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    enrollment_date: "2024-02-20",
    last_active: "2025-10-16T09:15:00",
    status: "active",
    courses: [
      {
        id: "course-3",
        name: "NEET 2025 Biology",
        subjects: ["Biology", "Chemistry", "Physics"],
        progress: 89,
        enrolled_at: "2024-02-20"
      }
    ],
    total_progress: 89,
    tests_taken: 67,
    avg_test_score: 92,
    ai_queries: 189,
    areas_of_improvement: ["Physics Mechanics"],
    followups_pending: 0,
    at_risk: false
  },
  {
    id: "stu-003",
    full_name: "Rohan Kumar",
    email: "rohan.kumar@email.com",
    phone: "+91-9876543212",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",
    enrollment_date: "2024-03-10",
    last_active: "2025-10-15T22:45:00",
    status: "at_risk",
    courses: [
      {
        id: "course-1",
        name: "JEE Main 2025 Complete",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        progress: 34,
        enrolled_at: "2024-03-10"
      }
    ],
    total_progress: 34,
    tests_taken: 12,
    avg_test_score: 45,
    ai_queries: 67,
    areas_of_improvement: ["All subjects - low engagement"],
    followups_pending: 5,
    at_risk: true
  },
  {
    id: "stu-004",
    full_name: "Ananya Singh",
    email: "ananya.singh@email.com",
    phone: "+91-9876543213",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya",
    enrollment_date: "2024-01-05",
    last_active: "2025-10-16T16:20:00",
    status: "active",
    courses: [
      {
        id: "course-4",
        name: "Class 12 Board Prep",
        subjects: ["Mathematics", "Physics", "Chemistry", "English"],
        progress: 78,
        enrolled_at: "2024-01-05"
      },
      {
        id: "course-1",
        name: "JEE Main 2025 Complete",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        progress: 71,
        enrolled_at: "2024-01-15"
      }
    ],
    total_progress: 74.5,
    tests_taken: 52,
    avg_test_score: 81,
    ai_queries: 312,
    areas_of_improvement: ["Organic Chemistry Reactions"],
    followups_pending: 1,
    at_risk: false
  },
  {
    id: "stu-005",
    full_name: "Arjun Mehta",
    email: "arjun.mehta@email.com",
    phone: "+91-9876543214",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
    enrollment_date: "2024-04-12",
    last_active: "2025-10-14T11:30:00",
    status: "inactive",
    courses: [
      {
        id: "course-2",
        name: "Advanced Mathematics",
        subjects: ["Calculus", "Algebra", "Trigonometry"],
        progress: 18,
        enrolled_at: "2024-04-12"
      }
    ],
    total_progress: 18,
    tests_taken: 5,
    avg_test_score: 52,
    ai_queries: 23,
    areas_of_improvement: ["Not engaged - needs follow-up"],
    followups_pending: 3,
    at_risk: true
  },
  {
    id: "stu-006",
    full_name: "Kavya Reddy",
    email: "kavya.reddy@email.com",
    phone: "+91-9876543215",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kavya",
    enrollment_date: "2023-12-01",
    last_active: "2025-10-16T13:45:00",
    status: "active",
    courses: [
      {
        id: "course-3",
        name: "NEET 2025 Biology",
        subjects: ["Biology", "Chemistry", "Physics"],
        progress: 95,
        enrolled_at: "2023-12-01"
      }
    ],
    total_progress: 95,
    tests_taken: 89,
    avg_test_score: 94,
    ai_queries: 401,
    areas_of_improvement: ["None - Excellent performance"],
    followups_pending: 0,
    at_risk: false
  },
  {
    id: "stu-007",
    full_name: "Vikram Joshi",
    email: "vikram.joshi@email.com",
    phone: "+91-9876543216",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
    enrollment_date: "2024-02-28",
    last_active: "2025-10-16T08:00:00",
    status: "active",
    courses: [
      {
        id: "course-1",
        name: "JEE Main 2025 Complete",
        subjects: ["Physics", "Chemistry", "Mathematics"],
        progress: 56,
        enrolled_at: "2024-02-28"
      }
    ],
    total_progress: 56,
    tests_taken: 32,
    avg_test_score: 68,
    ai_queries: 156,
    areas_of_improvement: ["Mathematics - Coordinate Geometry", "Physics - Modern Physics"],
    followups_pending: 2,
    at_risk: false
  },
  {
    id: "stu-008",
    full_name: "Ishita Agarwal",
    email: "ishita.agarwal@email.com",
    phone: "+91-9876543217",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ishita",
    enrollment_date: "2024-03-15",
    last_active: "2025-10-16T17:30:00",
    status: "active",
    courses: [
      {
        id: "course-4",
        name: "Class 12 Board Prep",
        subjects: ["Mathematics", "Physics", "Chemistry", "English"],
        progress: 72,
        enrolled_at: "2024-03-15"
      }
    ],
    total_progress: 72,
    tests_taken: 41,
    avg_test_score: 76,
    ai_queries: 198,
    areas_of_improvement: ["Chemistry - Electrochemistry"],
    followups_pending: 1,
    at_risk: false
  },
  {
    id: "stu-009",
    full_name: "Aditya Verma",
    email: "aditya.verma@email.com",
    phone: "+91-9876543218",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya",
    enrollment_date: "2024-05-01",
    last_active: "2025-10-16T10:20:00",
    status: "active",
    courses: [
      {
        id: "course-2",
        name: "Advanced Mathematics",
        subjects: ["Calculus", "Algebra", "Trigonometry"],
        progress: 43,
        enrolled_at: "2024-05-01"
      }
    ],
    total_progress: 43,
    tests_taken: 18,
    avg_test_score: 62,
    ai_queries: 89,
    areas_of_improvement: ["Calculus - Limits and Continuity"],
    followups_pending: 2,
    at_risk: false
  },
  {
    id: "stu-010",
    full_name: "Neha Kapoor",
    email: "neha.kapoor@email.com",
    phone: "+91-9876543219",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neha",
    enrollment_date: "2024-01-20",
    last_active: "2025-10-16T15:10:00",
    status: "active",
    courses: [
      {
        id: "course-3",
        name: "NEET 2025 Biology",
        subjects: ["Biology", "Chemistry", "Physics"],
        progress: 84,
        enrolled_at: "2024-01-20"
      },
      {
        id: "course-4",
        name: "Class 12 Board Prep",
        subjects: ["Mathematics", "Physics", "Chemistry", "English"],
        progress: 79,
        enrolled_at: "2024-01-25"
      }
    ],
    total_progress: 81.5,
    tests_taken: 58,
    avg_test_score: 85,
    ai_queries: 267,
    areas_of_improvement: ["Physics - Optics"],
    followups_pending: 0,
    at_risk: false
  }
];

export const mockProgressData: Record<string, any> = {
  "stu-001": {
    overall_progress_timeline: [
      { date: "2024-01", progress: 5 },
      { date: "2024-02", progress: 15 },
      { date: "2024-03", progress: 28 },
      { date: "2024-04", progress: 42 },
      { date: "2024-05", progress: 53 },
      { date: "2024-06", progress: 59 },
      { date: "2024-07", progress: 64 },
      { date: "2024-08", progress: 68 },
      { date: "2024-09", progress: 72 },
      { date: "2024-10", progress: 74.5 }
    ],
    subject_performance: {
      "Physics": 72,
      "Chemistry": 58,
      "Mathematics": 85,
      "Calculus": 80,
      "Algebra": 88,
      "Trigonometry": 78
    },
    chapter_completion: [
      { chapter: "Mechanics", subject: "Physics", completed: true, score: 85, progress: 100 },
      { chapter: "Thermodynamics", subject: "Physics", completed: true, score: 78, progress: 100 },
      { chapter: "Optics", subject: "Physics", completed: false, score: null, progress: 45 },
      { chapter: "Organic Chemistry", subject: "Chemistry", completed: false, score: 52, progress: 70 },
      { chapter: "Inorganic Chemistry", subject: "Chemistry", completed: true, score: 68, progress: 100 },
      { chapter: "Calculus", subject: "Mathematics", completed: true, score: 92, progress: 100 },
      { chapter: "Algebra", subject: "Mathematics", completed: true, score: 88, progress: 100 }
    ],
    time_distribution: {
      "Physics": 35,
      "Chemistry": 28,
      "Mathematics": 37
    }
  }
};

export const mockTestHistory: Record<string, any> = {
  "stu-001": {
    dpt: {
      streak: 12,
      total_tests: 45,
      average_score: 78,
      weekly_scores: [72, 75, 80, 78, 82, 85, 77],
      calendar_data: Array.from({ length: 90 }, (_, i) => ({
        date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0
      }))
    },
    assignments: [
      {
        id: "asg-1",
        title: "Physics Chapter 1 - Mechanics",
        score: 85,
        total: 100,
        submitted_at: "2025-10-10",
        status: "graded",
        percentage: 85
      },
      {
        id: "asg-2",
        title: "Chemistry - Organic Reactions",
        score: 52,
        total: 100,
        submitted_at: "2025-10-08",
        status: "graded",
        percentage: 52
      },
      {
        id: "asg-3",
        title: "Mathematics - Calculus",
        score: 92,
        total: 100,
        submitted_at: "2025-10-05",
        status: "graded",
        percentage: 92
      },
      {
        id: "asg-4",
        title: "Physics - Thermodynamics",
        score: 78,
        total: 100,
        submitted_at: "2025-10-01",
        status: "graded",
        percentage: 78
      }
    ],
    quizzes: [
      { id: "quiz-1", title: "Weekly Physics Quiz", score: 18, total: 20, date: "2025-10-12" },
      { id: "quiz-2", title: "Chemistry Mock Test", score: 42, total: 50, date: "2025-10-09" },
      { id: "quiz-3", title: "Math Speed Test", score: 28, total: 30, date: "2025-10-06" }
    ]
  }
};

export const mockAIActivity: Record<string, any> = {
  "stu-001": {
    total_queries: 234,
    avg_response_time: 2.3,
    conversations: [
      {
        id: "conv-1",
        timestamp: "2025-10-16T10:30:00",
        topic: "Organic Chemistry - Nomenclature",
        question: "Can you explain IUPAC naming for alkanes?",
        answer: "IUPAC naming for alkanes follows a systematic approach. First, identify the longest continuous carbon chain...",
        duration: 45,
        follow_up_count: 3,
        satisfaction: 5
      },
      {
        id: "conv-2",
        timestamp: "2025-10-16T08:15:00",
        topic: "Calculus - Integration",
        question: "How do I solve integration by parts?",
        answer: "Integration by parts uses the formula: ∫u dv = uv - ∫v du. The key is choosing u and dv wisely...",
        duration: 62,
        follow_up_count: 5,
        satisfaction: 4
      },
      {
        id: "conv-3",
        timestamp: "2025-10-15T16:45:00",
        topic: "Physics - Mechanics",
        question: "What's the difference between velocity and acceleration?",
        answer: "Velocity is the rate of change of position, while acceleration is the rate of change of velocity...",
        duration: 28,
        follow_up_count: 1,
        satisfaction: 5
      }
    ],
    usage_pattern: {
      by_hour: [2, 1, 0, 0, 0, 0, 3, 8, 15, 22, 28, 25, 18, 16, 24, 29, 18, 12, 8, 5, 3, 2, 1, 1],
      by_topic: { "Chemistry": 45, "Physics": 32, "Mathematics": 23 }
    },
    engagement_score: 87
  }
};

export const mockFollowups: Record<string, any[]> = {
  "stu-001": [
    {
      id: "followup-1",
      type: "test_reminder",
      message: "Complete pending Chemistry assignment on Organic Reactions",
      priority: "high",
      scheduled_for: "2025-10-17T09:00:00",
      status: "pending",
      created_at: "2025-10-15T14:30:00"
    },
    {
      id: "followup-2",
      type: "ai_tutorial_prompt",
      message: "Low score in Organic Chemistry - suggested AI tutorial session",
      priority: "medium",
      scheduled_for: "2025-10-18T15:00:00",
      status: "pending",
      created_at: "2025-10-15T16:20:00"
    }
  ],
  "stu-003": [
    {
      id: "followup-3",
      type: "general",
      message: "Student at risk - schedule counseling session",
      priority: "high",
      scheduled_for: "2025-10-17T10:00:00",
      status: "pending",
      created_at: "2025-10-14T09:00:00"
    },
    {
      id: "followup-4",
      type: "test_reminder",
      message: "No DPT tests taken in 5 days",
      priority: "high",
      scheduled_for: "2025-10-16T09:00:00",
      status: "pending",
      created_at: "2025-10-15T08:00:00"
    }
  ]
};

export const mockActivityLog: Record<string, any[]> = {
  "stu-001": [
    { type: "login", timestamp: "2025-10-16T14:30:00", description: "Logged in via web" },
    { type: "course_access", timestamp: "2025-10-16T14:32:00", description: "Accessed JEE Main 2025 Complete" },
    { type: "ai_query", timestamp: "2025-10-16T10:30:00", description: "Asked about Organic Chemistry" },
    { type: "test_complete", timestamp: "2025-10-16T09:15:00", description: "Completed DPT - Score: 82" },
    { type: "assignment_submit", timestamp: "2025-10-15T18:20:00", description: "Submitted Physics Assignment" },
    { type: "live_class_join", timestamp: "2025-10-15T16:00:00", description: "Joined Mathematics Live Class" }
  ]
};
