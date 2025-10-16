export interface Instructor {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  qualification: string;
  experience: string;
}

export const mockInstructors: Instructor[] = [
  {
    id: "inst1",
    name: "Dr. Rajesh Kumar",
    subject: "Physics",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop&q=80",
    qualification: "PhD in Physics, IIT Delhi",
    experience: "15 years"
  },
  {
    id: "inst2",
    name: "Prof. Anita Sharma",
    subject: "Chemistry",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80",
    qualification: "M.Sc. Chemistry, Delhi University",
    experience: "12 years"
  },
  {
    id: "inst3",
    name: "Dr. Suresh Patel",
    subject: "Mathematics",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80",
    qualification: "PhD in Mathematics, IISc Bangalore",
    experience: "18 years"
  },
  {
    id: "inst4",
    name: "Dr. Priya Menon",
    subject: "Biology",
    avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop&q=80",
    qualification: "PhD in Biotechnology, AIIMS",
    experience: "10 years"
  },
  {
    id: "inst5",
    name: "Prof. Vikram Singh",
    subject: "English",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80",
    qualification: "MA English Literature, JNU",
    experience: "14 years"
  },
  {
    id: "inst6",
    name: "Dr. Kavita Reddy",
    subject: "Computer Science",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&q=80",
    qualification: "PhD in Computer Science, IIT Bombay",
    experience: "11 years"
  }
];

export const mockUpcomingClasses = [
  {
    id: "class1",
    subject: "Physics",
    topic: "Electromagnetism - Magnetic Field",
    instructor: "Dr. Rajesh Kumar",
    time: "Tomorrow, 10:00 AM",
    duration: "90 minutes",
    meetingLink: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: "class2",
    subject: "Mathematics",
    topic: "Calculus - Integration Techniques",
    instructor: "Dr. Suresh Patel",
    time: "Tomorrow, 2:00 PM",
    duration: "90 minutes",
    meetingLink: "https://meet.google.com/klm-nopq-rst"
  },
  {
    id: "class3",
    subject: "Chemistry",
    topic: "Organic Chemistry - Reaction Mechanisms",
    instructor: "Prof. Anita Sharma",
    time: "Today, 4:00 PM",
    duration: "90 minutes",
    meetingLink: "https://meet.google.com/uvw-xyz-123"
  },
  {
    id: "class4",
    subject: "Biology",
    topic: "Cell Biology - Mitosis and Meiosis",
    instructor: "Dr. Priya Menon",
    time: "Tomorrow, 11:00 AM",
    duration: "90 minutes",
    meetingLink: "https://meet.google.com/456-789-abc"
  }
];

export const mockAssignments = [
  {
    id: "hw1",
    subject: "Physics",
    title: "Electromagnetic Induction Problems",
    dueDate: "2025-10-18",
    status: "pending" as const,
    totalMarks: 50,
    questions: 15
  },
  {
    id: "hw2",
    subject: "Mathematics",
    title: "Integration Practice Set - 3",
    dueDate: "2025-10-19",
    status: "pending" as const,
    totalMarks: 40,
    questions: 20
  },
  {
    id: "hw3",
    subject: "Chemistry",
    title: "Organic Reactions Worksheet",
    dueDate: "2025-10-17",
    status: "completed" as const,
    totalMarks: 30,
    questions: 10,
    score: 27
  },
  {
    id: "hw4",
    subject: "Biology",
    title: "Genetics Problem Solving",
    dueDate: "2025-10-20",
    status: "pending" as const,
    totalMarks: 45,
    questions: 12
  },
  {
    id: "hw5",
    subject: "Computer Science",
    title: "Python Data Structures Assignment",
    dueDate: "2025-10-21",
    status: "pending" as const,
    totalMarks: 50,
    questions: 8
  }
];

export const mockTimetable = [
  {
    day: "Monday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Physics", topic: "Mechanics", instructor: "Dr. Rajesh Kumar" },
      { time: "11:00 AM - 12:30 PM", subject: "Chemistry", topic: "Physical Chemistry", instructor: "Prof. Anita Sharma" },
      { time: "2:00 PM - 3:30 PM", subject: "Mathematics", topic: "Calculus", instructor: "Dr. Suresh Patel" }
    ]
  },
  {
    day: "Tuesday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Biology", topic: "Cell Biology", instructor: "Dr. Priya Menon" },
      { time: "11:00 AM - 12:30 PM", subject: "Mathematics", topic: "Algebra", instructor: "Dr. Suresh Patel" },
      { time: "2:00 PM - 3:30 PM", subject: "Physics", topic: "Electromagnetism", instructor: "Dr. Rajesh Kumar" }
    ]
  },
  {
    day: "Wednesday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Chemistry", topic: "Organic Chemistry", instructor: "Prof. Anita Sharma" },
      { time: "11:00 AM - 12:30 PM", subject: "English", topic: "Literature", instructor: "Prof. Vikram Singh" },
      { time: "2:00 PM - 3:30 PM", subject: "Computer Science", topic: "Python Programming", instructor: "Dr. Kavita Reddy" }
    ]
  },
  {
    day: "Thursday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Physics", topic: "Modern Physics", instructor: "Dr. Rajesh Kumar" },
      { time: "11:00 AM - 12:30 PM", subject: "Biology", topic: "Genetics", instructor: "Dr. Priya Menon" },
      { time: "2:00 PM - 3:30 PM", subject: "Mathematics", topic: "Coordinate Geometry", instructor: "Dr. Suresh Patel" }
    ]
  },
  {
    day: "Friday",
    classes: [
      { time: "9:00 AM - 10:30 AM", subject: "Chemistry", topic: "Inorganic Chemistry", instructor: "Prof. Anita Sharma" },
      { time: "11:00 AM - 12:30 PM", subject: "Computer Science", topic: "Data Structures", instructor: "Dr. Kavita Reddy" },
      { time: "2:00 PM - 3:30 PM", subject: "Biology", topic: "Human Physiology", instructor: "Dr. Priya Menon" }
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
