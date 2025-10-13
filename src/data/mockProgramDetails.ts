export const mockProgramDetails = {
  singleSubject: {
    id: "prog-1",
    name: "MISSION JRF PRO DEC 2025",
    slug: "mission-jrf-pro-dec-2025",
    category: "Competitive Exams",
    sub_category: "UGC NET",
    description: "Complete preparation package for UGC NET JRF December 2025 with AI-powered learning, personalized doubt clearing, and comprehensive study materials.",
    price_inr: 6199,
    originalPrice: 12999,
    duration_months: 6,
    rating: 4.8,
    reviewCount: 1247,
    studentCount: 12500,
    instructor: {
      name: "Dr. Rajesh Kumar",
      avatar: "/placeholder.svg",
      title: "PhD, 15+ years teaching experience"
    },
    thumbnail_url: "/placeholder.svg",
    videoPreview: "/placeholder.svg",
    subjects: [
      {
        id: "subj-1",
        name: "UGC NET Paper 1 & 2",
        description: "Complete syllabus coverage",
        chapters: [
          {
            id: "ch-1",
            title: "Introduction to Research Methodology",
            duration: "2h 30m",
            topics: [
              {
                id: "topic-1",
                title: "Types of Research",
                duration: "30m",
                type: "video",
                isLocked: false,
                features: ["AI Training", "AI Assistant", "Podcast", "MCQs"]
              },
              {
                id: "topic-2",
                title: "Research Design",
                duration: "45m",
                type: "video",
                isLocked: false,
                features: ["AI Training", "AI Assistant", "Podcast", "MCQs"]
              },
              {
                id: "topic-3",
                title: "Sampling Techniques",
                duration: "1h 15m",
                type: "video",
                isLocked: false,
                features: ["AI Training", "AI Assistant", "Podcast", "MCQs"]
              }
            ]
          },
          {
            id: "ch-2",
            title: "Teaching Aptitude",
            duration: "3h",
            topics: [
              {
                id: "topic-4",
                title: "Teaching Methods",
                duration: "1h",
                type: "video",
                isLocked: true,
                features: ["AI Training", "AI Assistant", "Podcast", "MCQs"]
              }
            ]
          }
        ]
      }
    ],
    whatYouLearn: [
      "Master UGC NET Paper 1 and Paper 2 syllabus",
      "Practice with 10,000+ MCQs with AI-powered explanations",
      "Get instant doubt clearing with AI Assistant",
      "Access exclusive podcast series for revision",
      "Receive personalized study plan based on your progress",
      "Get UGC NET certificate preparation guidance"
    ],
    courseIncludes: [
      { icon: "Video", text: "150 hours of video content" },
      { icon: "FileText", text: "500+ downloadable resources" },
      { icon: "Award", text: "Certificate of completion" },
      { icon: "Clock", text: "Lifetime access" },
      { icon: "Smartphone", text: "Access on mobile and desktop" },
      { icon: "Bot", text: "AI Doubt Clearing 24/7" }
    ],
    reviews: [
      {
        id: "rev-1",
        userName: "Priya Sharma",
        avatar: "/placeholder.svg",
        rating: 5,
        date: "2 weeks ago",
        comment: "Excellent course! The AI assistant helped me clear my doubts instantly. Highly recommended for UGC NET preparation."
      },
      {
        id: "rev-2",
        userName: "Amit Verma",
        avatar: "/placeholder.svg",
        rating: 4,
        date: "1 month ago",
        comment: "Very comprehensive content. The podcast feature is great for revision during commute."
      }
    ]
  },
  multiSubject: {
    id: "prog-2",
    name: "Full Stack Development Bootcamp",
    slug: "full-stack-development-bootcamp",
    category: "Web Development",
    sub_category: "Full Stack",
    description: "Become a professional full-stack developer with hands-on projects and AI-powered learning assistance.",
    price_inr: 7999,
    originalPrice: 15999,
    duration_months: 8,
    rating: 4.9,
    reviewCount: 3421,
    studentCount: 25000,
    instructor: {
      name: "Sneha Patel",
      avatar: "/placeholder.svg",
      title: "Senior Full Stack Developer at Tech Giant"
    },
    thumbnail_url: "/placeholder.svg",
    videoPreview: "/placeholder.svg",
    subjects: [
      {
        id: "subj-2",
        name: "Frontend Development",
        description: "React, TypeScript, and modern UI frameworks",
        chapters: [
          {
            id: "ch-3",
            title: "React Fundamentals",
            duration: "4h",
            topics: [
              {
                id: "topic-5",
                title: "JSX and Components",
                duration: "1h",
                type: "video",
                isLocked: false,
                features: ["AI Training", "AI Assistant", "Podcast", "MCQs"]
              }
            ]
          }
        ]
      },
      {
        id: "subj-3",
        name: "Backend Development",
        description: "Node.js, Express, and database management",
        chapters: [
          {
            id: "ch-4",
            title: "Node.js Basics",
            duration: "3h",
            topics: [
              {
                id: "topic-6",
                title: "Setting up Node.js",
                duration: "45m",
                type: "video",
                isLocked: false,
                features: ["AI Training", "AI Assistant", "Podcast", "MCQs"]
              }
            ]
          }
        ]
      },
      {
        id: "subj-4",
        name: "Database & DevOps",
        description: "SQL, MongoDB, Docker, and deployment",
        chapters: [
          {
            id: "ch-5",
            title: "SQL Fundamentals",
            duration: "2h 30m",
            topics: [
              {
                id: "topic-7",
                title: "Database Design",
                duration: "1h",
                type: "video",
                isLocked: false,
                features: ["AI Training", "AI Assistant", "Podcast", "MCQs"]
              }
            ]
          }
        ]
      }
    ],
    whatYouLearn: [
      "Build modern web applications with React and TypeScript",
      "Create RESTful APIs with Node.js and Express",
      "Master database design with SQL and MongoDB",
      "Deploy applications with Docker and cloud platforms",
      "Implement authentication and authorization",
      "Get AI-powered code reviews and debugging help"
    ],
    courseIncludes: [
      { icon: "Video", text: "200 hours of video content" },
      { icon: "Code", text: "50+ hands-on projects" },
      { icon: "FileText", text: "1000+ code snippets" },
      { icon: "Award", text: "Industry-recognized certificate" },
      { icon: "Users", text: "Live mentorship sessions" },
      { icon: "Bot", text: "AI Code Assistant 24/7" }
    ],
    reviews: [
      {
        id: "rev-3",
        userName: "Rahul Gupta",
        avatar: "/placeholder.svg",
        rating: 5,
        date: "1 week ago",
        comment: "Best full-stack course I've taken. The AI assistant is like having a senior developer available 24/7!"
      }
    ]
  }
};
