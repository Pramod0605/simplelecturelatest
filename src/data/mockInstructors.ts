export interface Instructor {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  qualification: string;
  experience: string;
  rating: number;
  studentsCount: number;
  specialization: string;
}

export const mockInstructors: Instructor[] = [
  {
    id: "1",
    name: "Dr. Rajesh Kumar Sharma",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshKumar&backgroundColor=b6e3f4",
    subject: "Physics (JEE)",
    qualification: "PhD in Physics, IIT Delhi",
    experience: "15 years",
    rating: 4.9,
    studentsCount: 5000,
    specialization: "Mechanics & Electromagnetism"
  },
  {
    id: "2",
    name: "Prof. Priya Menon",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaMenon&backgroundColor=ffdfbf",
    subject: "Chemistry (NEET)",
    qualification: "M.Sc Chemistry, IISc Bangalore",
    experience: "12 years",
    rating: 4.8,
    studentsCount: 4200,
    specialization: "Organic Chemistry"
  },
  {
    id: "3",
    name: "Dr. Amit Patel",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AmitPatel&backgroundColor=c0aede",
    subject: "Mathematics (JEE)",
    qualification: "PhD in Mathematics, IIT Bombay",
    experience: "18 years",
    rating: 4.9,
    studentsCount: 6500,
    specialization: "Calculus & Algebra"
  },
  {
    id: "4",
    name: "Dr. Sneha Reddy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SnehaReddy&backgroundColor=ffd5dc",
    subject: "Biology (NEET)",
    qualification: "PhD in Biotechnology, AIIMS",
    experience: "10 years",
    rating: 4.7,
    studentsCount: 3800,
    specialization: "Human Physiology"
  },
  {
    id: "5",
    name: "Prof. Vikram Singh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=VikramSingh&backgroundColor=d1d4f9",
    subject: "Physics (NEET)",
    qualification: "M.Sc Physics, Delhi University",
    experience: "14 years",
    rating: 4.8,
    studentsCount: 4500,
    specialization: "Modern Physics"
  },
  {
    id: "6",
    name: "Dr. Kavita Iyer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=KavitaIyer&backgroundColor=b6e3f4",
    subject: "Chemistry (JEE)",
    qualification: "PhD in Chemistry, IIT Madras",
    experience: "16 years",
    rating: 4.9,
    studentsCount: 5200,
    specialization: "Physical Chemistry"
  },
  {
    id: "7",
    name: "Prof. Suresh Nair",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SureshNair&backgroundColor=ffdfbf",
    subject: "Mathematics (Boards)",
    qualification: "M.Sc Mathematics, Mumbai University",
    experience: "20 years",
    rating: 4.8,
    studentsCount: 7000,
    specialization: "Coordinate Geometry"
  },
  {
    id: "8",
    name: "Dr. Anita Deshmukh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnitaDeshmukh&backgroundColor=c0aede",
    subject: "Biology (Boards)",
    qualification: "PhD in Zoology, Pune University",
    experience: "11 years",
    rating: 4.7,
    studentsCount: 3500,
    specialization: "Genetics & Evolution"
  }
];

export const mockUpcomingClasses = [
  {
    id: "1",
    subject: "Physics",
    topic: "Electromagnetic Induction",
    instructor: "Dr. Rajesh Kumar Sharma",
    time: "10:00 AM",
    date: "Today",
    meetingLink: "#"
  },
  {
    id: "2",
    subject: "Mathematics",
    topic: "Integration Techniques",
    instructor: "Dr. Amit Patel",
    time: "2:00 PM",
    date: "Today",
    meetingLink: "#"
  },
  {
    id: "3",
    subject: "Chemistry",
    topic: "Chemical Equilibrium",
    instructor: "Dr. Kavita Iyer",
    time: "4:00 PM",
    date: "Tomorrow",
    meetingLink: "#"
  }
];

export const mockAssignments = [
  {
    id: "1",
    title: "Physics - Newton's Laws Practice",
    subject: "Physics",
    dueDate: "2025-04-20",
    status: "pending" as const,
    totalMarks: 50
  },
  {
    id: "2",
    title: "Mathematics - Calculus Problems",
    subject: "Mathematics",
    dueDate: "2025-04-22",
    status: "pending" as const,
    totalMarks: 100
  },
  {
    id: "3",
    title: "Chemistry - Organic Reactions",
    subject: "Chemistry",
    dueDate: "2025-04-18",
    status: "submitted" as const,
    totalMarks: 75,
    score: 68
  }
];

export const mockTimetable = [
  {
    day: "Monday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Physics", topic: "Mechanics", instructor: "Dr. Rajesh Kumar Sharma" },
      { time: "11:00 AM - 12:30 PM", subject: "Chemistry", topic: "Physical Chemistry", instructor: "Prof. Priya Menon" },
      { time: "2:00 PM - 3:30 PM", subject: "Mathematics", topic: "Calculus", instructor: "Dr. Amit Patel" }
    ]
  },
  {
    day: "Tuesday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Biology", topic: "Cell Biology", instructor: "Dr. Sneha Reddy" },
      { time: "11:00 AM - 12:30 PM", subject: "Mathematics", topic: "Algebra", instructor: "Dr. Amit Patel" },
      { time: "2:00 PM - 3:30 PM", subject: "Physics", topic: "Electromagnetism", instructor: "Dr. Rajesh Kumar Sharma" }
    ]
  },
  {
    day: "Wednesday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Chemistry", topic: "Organic Chemistry", instructor: "Prof. Priya Menon" },
      { time: "11:00 AM - 12:30 PM", subject: "English", topic: "Literature", instructor: "Prof. Vikram Singh" },
      { time: "2:00 PM - 3:30 PM", subject: "Computer Science", topic: "Python Programming", instructor: "Dr. Anita Deshmukh" }
    ]
  },
  {
    day: "Thursday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Physics", topic: "Modern Physics", instructor: "Dr. Rajesh Kumar Sharma" },
      { time: "11:00 AM - 12:30 PM", subject: "Biology", topic: "Genetics", instructor: "Dr. Sneha Reddy" },
      { time: "2:00 PM - 3:30 PM", subject: "Mathematics", topic: "Coordinate Geometry", instructor: "Prof. Suresh Nair" }
    ]
  },
  {
    day: "Friday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Chemistry", topic: "Inorganic Chemistry", instructor: "Dr. Kavita Iyer" },
      { time: "11:00 AM - 12:30 PM", subject: "Computer Science", topic: "Data Structures", instructor: "Dr. Anita Deshmukh" },
      { time: "2:00 PM - 3:30 PM", subject: "Biology", topic: "Human Physiology", instructor: "Dr. Sneha Reddy" }
    ]
  },
  {
    day: "Saturday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Test Prep", topic: "Mock Test Discussion", instructor: "All Instructors" },
      { time: "11:00 AM - 12:30 PM", subject: "Doubt Session", topic: "General Q&A", instructor: "All Instructors" }
    ]
  }
];
