export type SubjectStats = { completed: number; total: number; percentage: number };

export const mockSubjectProgress: Record<string, SubjectStats> = {
  'Physics (101)': { completed: 12, total: 20, percentage: 60 },
  'Chemistry (102)': { completed: 15, total: 20, percentage: 75 },
  'Mathematics (110)': { completed: 18, total: 20, percentage: 90 },
  'Biology (101)': { completed: 14, total: 20, percentage: 70 },
  'English (210)': { completed: 16, total: 20, percentage: 80 },
  'Computer Science (220)': { completed: 19, total: 20, percentage: 95 },
};

export const mockCourses = [
  { 
    course_id: "c1111111-1111-1111-1111-111111111111", 
    courses: { 
      name: "JEE Advanced Complete Course", 
      subjects: ["Physics", "Chemistry", "Mathematics"],
      chapters: {
        "Physics": [
          { id: "p1", name: "Mechanics", progress: 65, topics: ["Kinematics", "Newton's Laws", "Work & Energy"] },
          { id: "p2", name: "Electromagnetism", progress: 45, topics: ["Electric Field", "Magnetic Field", "EMI"] },
          { id: "p3", name: "Modern Physics", progress: 30, topics: ["Quantum Mechanics", "Nuclear Physics"] }
        ],
        "Chemistry": [
          { id: "c1", name: "Physical Chemistry", progress: 70, topics: ["Thermodynamics", "Chemical Kinetics"] },
          { id: "c2", name: "Organic Chemistry", progress: 60, topics: ["Hydrocarbons", "Reactions"] },
          { id: "c3", name: "Inorganic Chemistry", progress: 50, topics: ["Coordination Compounds", "Metals"] }
        ],
        "Mathematics": [
          { id: "m1", name: "Calculus", progress: 85, topics: ["Differentiation", "Integration", "Differential Equations"] },
          { id: "m2", name: "Algebra", progress: 75, topics: ["Complex Numbers", "Matrices", "Probability"] },
          { id: "m3", name: "Coordinate Geometry", progress: 80, topics: ["Straight Line", "Circle", "Conic Sections"] }
        ]
      }
    } 
  },
  { 
    course_id: "c2222222-2222-2222-2222-222222222222", 
    courses: { 
      name: "NEET Complete Course", 
      subjects: ["Physics", "Chemistry", "Biology"],
      chapters: {
        "Physics": [
          { id: "p4", name: "Optics", progress: 55, topics: ["Ray Optics", "Wave Optics"] },
          { id: "p5", name: "Thermodynamics", progress: 60, topics: ["Laws of Thermodynamics", "Heat Transfer"] }
        ],
        "Chemistry": [
          { id: "c4", name: "Organic Compounds", progress: 65, topics: ["Alcohols", "Ethers", "Aldehydes"] }
        ],
        "Biology": [
          { id: "b1", name: "Cell Biology", progress: 70, topics: ["Cell Structure", "Cell Division", "Biomolecules"] },
          { id: "b2", name: "Genetics", progress: 55, topics: ["Mendel's Laws", "DNA Structure", "Gene Expression"] },
          { id: "b3", name: "Human Physiology", progress: 60, topics: ["Digestion", "Respiration", "Circulation"] }
        ]
      }
    } 
  },
  { 
    course_id: "c3333333-3333-3333-3333-333333333333", 
    courses: { 
      name: "Class 12 CBSE Complete", 
      subjects: ["Mathematics", "Physics", "Chemistry", "English", "Computer Science"],
      chapters: {
        "Mathematics": [
          { id: "m4", name: "Relations and Functions", progress: 90, topics: ["Types of Relations", "Functions"] }
        ],
        "Physics": [
          { id: "p6", name: "Current Electricity", progress: 75, topics: ["Ohm's Law", "Kirchhoff's Laws"] }
        ],
        "Chemistry": [
          { id: "c5", name: "Solutions", progress: 80, topics: ["Concentration Terms", "Colligative Properties"] }
        ],
        "English": [
          { id: "e1", name: "Flamingo", progress: 85, topics: ["Poetry", "Prose"] }
        ],
        "Computer Science": [
          { id: "cs1", name: "Python Programming", progress: 95, topics: ["Data Structures", "OOP", "File Handling"] }
        ]
      }
    } 
  },
];

export const mockDashboardStats = {
  enrolledCourses: mockCourses.length,
  totalHours: 245.5,
  completedChapters: 89,
  subjectProgress: mockSubjectProgress,
  courses: mockCourses,
};

export const mockDPT = {
  streak: 12,
  averageScore: 85,
  todayCompleted: true,
  weeklyData: [
    { day: "Mon", completed: true, score: 88 },
    { day: "Tue", completed: true, score: 92 },
    { day: "Wed", completed: true, score: 85 },
    { day: "Thu", completed: true, score: 90 },
    { day: "Fri", completed: true, score: 87 },
    { day: "Sat", completed: true, score: 82 },
    { day: "Sun", completed: true, score: 91 },
  ],
};