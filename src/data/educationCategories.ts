// Indian Education Categories for SimpleLecture

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories: string[];
  description: string;
}

export const educationCategories: Category[] = [
  {
    id: "1",
    name: "Board Exams",
    slug: "board-exams",
    icon: "📚",
    subcategories: [
      "10th/SSLC",
      "I PUC/11th Science",
      "I PUC/11th Commerce",
      "II PUC/12th Science",
      "II PUC/12th Commerce",
      "CBSE Board",
      "ICSE Board",
      "State Boards"
    ],
    description: "Complete preparation for board examinations with AI-powered learning"
  },
  {
    id: "2",
    name: "Medical Entrance",
    slug: "medical-entrance",
    icon: "🩺",
    subcategories: [
      "NEET UG",
      "NEET PG",
      "AIIMS",
      "JIPMER",
      "State Medical Entrance"
    ],
    description: "Comprehensive NEET and medical entrance exam preparation"
  },
  {
    id: "3",
    name: "Engineering Entrance",
    slug: "engineering-entrance",
    icon: "⚙️",
    subcategories: [
      "JEE Main",
      "JEE Advanced",
      "Karnataka CET",
      "BITSAT",
      "State Engineering Entrance"
    ],
    description: "Complete JEE and engineering entrance preparation"
  },
  {
    id: "4",
    name: "Integrated Programs",
    slug: "integrated-programs",
    icon: "🎯",
    subcategories: [
      "PUC + NEET",
      "PUC + JEE",
      "10th + Foundation",
      "12th + Entrance Combo"
    ],
    description: "Dual preparation for board exams and entrance tests"
  },
  {
    id: "5",
    name: "Foundation Courses",
    slug: "foundation-courses",
    icon: "🌱",
    subcategories: [
      "Class 8 Foundation",
      "Class 9 Foundation",
      "Class 10 Foundation",
      "Pre-Medical Foundation",
      "Pre-Engineering Foundation"
    ],
    description: "Build strong fundamentals for competitive exams"
  },
  {
    id: "6",
    name: "Competitive Exams",
    slug: "competitive-exams",
    icon: "🏆",
    subcategories: [
      "UPSC Civil Services",
      "Banking (IBPS/SBI)",
      "SSC (CGL/CHSL)",
      "Railway Exams",
      "State PSC"
    ],
    description: "Government job exam preparation"
  }
];

export const popularSubjects = [
  "Physics (NEET/JEE)",
  "Chemistry (Organic/Inorganic)",
  "Mathematics (Boards/JEE)",
  "Biology (NEET)",
  "English (Boards)",
  "Kannada (State Boards)",
  "Hindi (Boards)",
  "Social Science"
];

export const exploreByGoal = [
  { name: "Crack NEET", slug: "neet" },
  { name: "Crack JEE", slug: "jee" },
  { name: "Score 90+ in Boards", slug: "boards" },
  { name: "Build Strong Foundation", slug: "foundation" },
  { name: "Integrated Program (Board + Entrance)", slug: "integrated" },
  { name: "Get University Ready", slug: "university" }
];
