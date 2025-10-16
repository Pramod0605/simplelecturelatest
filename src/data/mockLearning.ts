export interface Topic {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  content: string;
  videoUrl?: string;
  pdfUrl?: string;
}

export interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  description: string;
  subject: string;
  progress: number;
  topics: Topic[];
}

export interface MockQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic_id: string;
}

export interface MockAssignment {
  id: string;
  title: string;
  description: string;
  questions: string[];
  due_date: string;
  total_marks: number;
  status: 'pending' | 'submitted' | 'graded';
  submitted_date?: string;
  score?: number;
  feedback?: string;
}

export interface MockPodcast {
  id: string;
  title: string;
  duration: string;
  audioUrl: string;
  transcript: string;
  topic_id: string;
}

export interface MockVideo {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  instructor: string;
  completed: boolean;
  topic_id: string;
  category: string;
}

// Physics Chapters
export const physicsChapters: Chapter[] = [
  {
    id: "ch-phy-001",
    chapter_number: 1,
    title: "Mechanics - Kinematics",
    description: "Study of motion without considering forces",
    subject: "Physics",
    progress: 60,
    topics: [
      {
        id: "tp-phy-001-1",
        title: "Introduction to Motion",
        duration: "25 min",
        completed: true,
        content: `# Introduction to Motion

## What is Motion?
Motion is the change in position of an object with respect to time. It is described in terms of displacement, distance, velocity, acceleration, and time.

## Types of Motion
1. **Linear Motion**: Motion along a straight line
2. **Circular Motion**: Motion along a circular path
3. **Rotational Motion**: Motion of a body rotating about an axis
4. **Periodic Motion**: Motion that repeats itself after regular intervals

## Key Concepts

### Displacement
Displacement is the shortest distance from the initial to the final position of a point.

$$\\vec{s} = \\vec{r_2} - \\vec{r_1}$$

### Velocity
Velocity is the rate of change of displacement with respect to time.

$$\\vec{v} = \\frac{d\\vec{s}}{dt}$$

### Acceleration
Acceleration is the rate of change of velocity with respect to time.

$$\\vec{a} = \\frac{d\\vec{v}}{dt}$$

## Equations of Motion
For uniformly accelerated motion:

| Equation | Description |
|----------|-------------|
| $v = u + at$ | First equation of motion |
| $s = ut + \\frac{1}{2}at^2$ | Second equation of motion |
| $v^2 = u^2 + 2as$ | Third equation of motion |

Where:
- $u$ = initial velocity
- $v$ = final velocity
- $a$ = acceleration
- $t$ = time
- $s$ = displacement

## Practice Problem
A car accelerates from rest at 2 m/s². What is its velocity after 10 seconds?

**Solution:**
Using $v = u + at$
- $u = 0$ (starts from rest)
- $a = 2$ m/s²
- $t = 10$ s

$v = 0 + 2(10) = 20$ m/s`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-phy-001-2",
        title: "Uniform Motion",
        duration: "30 min",
        completed: true,
        content: `# Uniform Motion

## Definition
Uniform motion is a type of motion in which an object covers equal distances in equal intervals of time.

## Characteristics
- Constant velocity
- Zero acceleration
- Distance-time graph is a straight line

## Mathematical Representation
$$s = vt$$

Where $s$ is distance, $v$ is constant velocity, and $t$ is time.`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-phy-001-3",
        title: "Non-uniform Motion",
        duration: "35 min",
        completed: false,
        content: `# Non-uniform Motion

## Definition
Non-uniform motion is when an object covers unequal distances in equal intervals of time.

## Key Points
- Variable velocity
- Non-zero acceleration
- Distance-time graph is curved`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ]
  },
  {
    id: "ch-phy-002",
    chapter_number: 2,
    title: "Laws of Motion",
    description: "Newton's three laws and their applications",
    subject: "Physics",
    progress: 40,
    topics: [
      {
        id: "tp-phy-002-1",
        title: "Newton's First Law",
        duration: "20 min",
        completed: true,
        content: `# Newton's First Law of Motion

## Statement
A body at rest remains at rest, and a body in motion continues to move at a constant velocity unless acted upon by an external force.

## Inertia
The tendency of an object to resist changes in its state of motion is called inertia.

$$F = 0 \\Rightarrow \\vec{v} = constant$$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-phy-002-2",
        title: "Newton's Second Law",
        duration: "30 min",
        completed: false,
        content: `# Newton's Second Law of Motion

## Statement
The rate of change of momentum of a body is directly proportional to the applied force.

$$\\vec{F} = m\\vec{a} = \\frac{d\\vec{p}}{dt}$$

Where $\\vec{p} = m\\vec{v}$ is momentum.`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-phy-002-3",
        title: "Newton's Third Law",
        duration: "25 min",
        completed: false,
        content: `# Newton's Third Law of Motion

## Statement
For every action, there is an equal and opposite reaction.

$$\\vec{F}_{AB} = -\\vec{F}_{BA}$$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ]
  },
  {
    id: "ch-phy-003",
    chapter_number: 3,
    title: "Work, Energy and Power",
    description: "Understanding energy transformations",
    subject: "Physics",
    progress: 30,
    topics: [
      {
        id: "tp-phy-003-1",
        title: "Work Done",
        duration: "25 min",
        completed: false,
        content: `# Work Done

## Definition
Work is said to be done when a force causes displacement.

$$W = \\vec{F} \\cdot \\vec{s} = Fs\\cos\\theta$$

Where $\\theta$ is the angle between force and displacement.`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-phy-003-2",
        title: "Kinetic Energy",
        duration: "30 min",
        completed: false,
        content: `# Kinetic Energy

## Definition
The energy possessed by a body due to its motion.

$$KE = \\frac{1}{2}mv^2$$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ]
  }
];

// Chemistry Chapters
export const chemistryChapters: Chapter[] = [
  {
    id: "ch-chem-001",
    chapter_number: 1,
    title: "Atomic Structure",
    description: "Structure of atoms and subatomic particles",
    subject: "Chemistry",
    progress: 50,
    topics: [
      {
        id: "tp-chem-001-1",
        title: "Discovery of Electron",
        duration: "20 min",
        completed: true,
        content: `# Discovery of Electron

## Cathode Ray Experiment
J.J. Thomson discovered the electron through cathode ray experiments.

## Properties of Electron
- Charge: $-1.6 \\times 10^{-19}$ C
- Mass: $9.11 \\times 10^{-31}$ kg
- Symbol: $e^-$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-chem-001-2",
        title: "Atomic Models",
        duration: "35 min",
        completed: true,
        content: `# Atomic Models

## Thomson's Model
- Plum pudding model
- Positive charge distributed uniformly

## Rutherford's Model
- Nuclear model
- Positive charge concentrated in nucleus

## Bohr's Model
- Electrons in fixed orbits
- Quantized energy levels

$$E_n = -\\frac{13.6}{n^2} \\text{ eV}$$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-chem-001-3",
        title: "Quantum Numbers",
        duration: "30 min",
        completed: false,
        content: `# Quantum Numbers

Four quantum numbers describe the state of an electron:

1. **Principal quantum number (n)**: Energy level
2. **Azimuthal quantum number (l)**: Orbital shape
3. **Magnetic quantum number (m)**: Orbital orientation
4. **Spin quantum number (s)**: Electron spin`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ]
  },
  {
    id: "ch-chem-002",
    chapter_number: 2,
    title: "Chemical Bonding",
    description: "How atoms bond to form molecules",
    subject: "Chemistry",
    progress: 35,
    topics: [
      {
        id: "tp-chem-002-1",
        title: "Ionic Bonding",
        duration: "25 min",
        completed: true,
        content: `# Ionic Bonding

## Definition
Transfer of electrons from one atom to another, forming ions.

## Characteristics
- High melting and boiling points
- Conduct electricity in molten state
- Generally soluble in water

## Example
$$Na + Cl \\rightarrow Na^+ + Cl^- \\rightarrow NaCl$$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-chem-002-2",
        title: "Covalent Bonding",
        duration: "30 min",
        completed: false,
        content: `# Covalent Bonding

## Definition
Sharing of electrons between atoms.

## Types
1. Single bond: One pair of electrons shared
2. Double bond: Two pairs of electrons shared
3. Triple bond: Three pairs of electrons shared`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ]
  }
];

// Mathematics Chapters
export const mathematicsChapters: Chapter[] = [
  {
    id: "ch-math-001",
    chapter_number: 1,
    title: "Complex Numbers",
    description: "Understanding imaginary and complex numbers",
    subject: "Mathematics",
    progress: 70,
    topics: [
      {
        id: "tp-math-001-1",
        title: "Introduction to Complex Numbers",
        duration: "25 min",
        completed: true,
        content: `# Complex Numbers

## Definition
A complex number is of the form $z = a + ib$, where:
- $a$ is the real part
- $b$ is the imaginary part
- $i = \\sqrt{-1}$ is the imaginary unit

## Properties
$$i^2 = -1$$
$$i^3 = -i$$
$$i^4 = 1$$

## Operations
### Addition
$$(a + ib) + (c + id) = (a + c) + i(b + d)$$

### Multiplication
$$(a + ib)(c + id) = (ac - bd) + i(ad + bc)$$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-math-001-2",
        title: "Modulus and Argument",
        duration: "30 min",
        completed: true,
        content: `# Modulus and Argument

## Modulus
$$|z| = \\sqrt{a^2 + b^2}$$

## Argument
$$\\arg(z) = \\tan^{-1}\\left(\\frac{b}{a}\\right)$$

## Polar Form
$$z = r(\\cos\\theta + i\\sin\\theta)$$

Where $r = |z|$ and $\\theta = \\arg(z)$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-math-001-3",
        title: "De Moivre's Theorem",
        duration: "35 min",
        completed: false,
        content: `# De Moivre's Theorem

## Statement
$$(\\cos\\theta + i\\sin\\theta)^n = \\cos(n\\theta) + i\\sin(n\\theta)$$

This theorem is useful for finding powers and roots of complex numbers.`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ]
  },
  {
    id: "ch-math-002",
    chapter_number: 2,
    title: "Quadratic Equations",
    description: "Solving and analyzing quadratic equations",
    subject: "Mathematics",
    progress: 55,
    topics: [
      {
        id: "tp-math-002-1",
        title: "Standard Form",
        duration: "20 min",
        completed: true,
        content: `# Quadratic Equations

## Standard Form
$$ax^2 + bx + c = 0, \\quad a \\neq 0$$

## Quadratic Formula
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

## Discriminant
$$D = b^2 - 4ac$$

- If $D > 0$: Two distinct real roots
- If $D = 0$: Two equal real roots
- If $D < 0$: Two complex roots`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "tp-math-002-2",
        title: "Nature of Roots",
        duration: "25 min",
        completed: true,
        content: `# Nature of Roots

## Sum and Product of Roots
If $\\alpha$ and $\\beta$ are roots:

$$\\alpha + \\beta = -\\frac{b}{a}$$
$$\\alpha \\beta = \\frac{c}{a}$$

## Formation of Equation
$$x^2 - (\\alpha + \\beta)x + \\alpha\\beta = 0$$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ]
  },
  {
    id: "ch-math-003",
    chapter_number: 3,
    title: "Calculus - Differentiation",
    description: "Rate of change and derivatives",
    subject: "Mathematics",
    progress: 40,
    topics: [
      {
        id: "tp-math-003-1",
        title: "Definition of Derivative",
        duration: "30 min",
        completed: false,
        content: `# Differentiation

## Definition
$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

## Basic Rules
1. Power Rule: $\\frac{d}{dx}(x^n) = nx^{n-1}$
2. Sum Rule: $\\frac{d}{dx}(u + v) = \\frac{du}{dx} + \\frac{dv}{dx}$
3. Product Rule: $\\frac{d}{dx}(uv) = u\\frac{dv}{dx} + v\\frac{du}{dx}$
4. Quotient Rule: $\\frac{d}{dx}\\left(\\frac{u}{v}\\right) = \\frac{v\\frac{du}{dx} - u\\frac{dv}{dx}}{v^2}$`,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ]
  }
];

// Mock Questions
export const mockQuestions: MockQuestion[] = [
  // Physics Questions
  {
    id: "q-phy-001",
    question_text: "A car accelerates from 10 m/s to 30 m/s in 5 seconds. What is the acceleration?",
    options: ["2 m/s²", "4 m/s²", "5 m/s²", "6 m/s²"],
    correct_answer: "4 m/s²",
    explanation: "Using a = (v - u)/t = (30 - 10)/5 = 20/5 = 4 m/s²",
    difficulty: "easy",
    topic_id: "tp-phy-001-1"
  },
  {
    id: "q-phy-002",
    question_text: "Which law of motion explains why passengers jerk forward when a bus suddenly stops?",
    options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
    correct_answer: "First Law",
    explanation: "Newton's First Law (Inertia) - passengers continue in motion when bus stops",
    difficulty: "easy",
    topic_id: "tp-phy-002-1"
  },
  {
    id: "q-phy-003",
    question_text: "If a force of 10 N acts on a body of mass 2 kg, what is the acceleration?",
    options: ["5 m/s²", "10 m/s²", "20 m/s²", "2 m/s²"],
    correct_answer: "5 m/s²",
    explanation: "Using F = ma, a = F/m = 10/2 = 5 m/s²",
    difficulty: "medium",
    topic_id: "tp-phy-002-2"
  },
  {
    id: "q-phy-004",
    question_text: "Work done is maximum when the angle between force and displacement is:",
    options: ["0°", "45°", "90°", "180°"],
    correct_answer: "0°",
    explanation: "W = Fs cos θ is maximum when θ = 0° (cos 0° = 1)",
    difficulty: "easy",
    topic_id: "tp-phy-003-1"
  },
  {
    id: "q-phy-005",
    question_text: "The kinetic energy of a body becomes 4 times. Its velocity becomes:",
    options: ["2 times", "4 times", "8 times", "16 times"],
    correct_answer: "2 times",
    explanation: "KE ∝ v², so if KE becomes 4 times, v becomes √4 = 2 times",
    difficulty: "medium",
    topic_id: "tp-phy-003-2"
  },
  // Chemistry Questions
  {
    id: "q-chem-001",
    question_text: "The charge on an electron is:",
    options: ["-1.6 × 10⁻¹⁹ C", "+1.6 × 10⁻¹⁹ C", "-9.11 × 10⁻³¹ C", "+9.11 × 10⁻³¹ C"],
    correct_answer: "-1.6 × 10⁻¹⁹ C",
    explanation: "Electron has a negative charge of 1.6 × 10⁻¹⁹ coulombs",
    difficulty: "easy",
    topic_id: "tp-chem-001-1"
  },
  {
    id: "q-chem-002",
    question_text: "According to Bohr's model, energy of electron in nth orbit is:",
    options: ["-13.6/n² eV", "13.6/n² eV", "-13.6n² eV", "13.6n² eV"],
    correct_answer: "-13.6/n² eV",
    explanation: "Bohr's formula: E_n = -13.6/n² electron volts",
    difficulty: "medium",
    topic_id: "tp-chem-001-2"
  },
  {
    id: "q-chem-003",
    question_text: "Which type of bond is present in NaCl?",
    options: ["Ionic", "Covalent", "Metallic", "Hydrogen"],
    correct_answer: "Ionic",
    explanation: "NaCl is formed by transfer of electron from Na to Cl, forming ionic bond",
    difficulty: "easy",
    topic_id: "tp-chem-002-1"
  },
  {
    id: "q-chem-004",
    question_text: "Maximum number of electrons in s orbital is:",
    options: ["1", "2", "6", "10"],
    correct_answer: "2",
    explanation: "s orbital can hold maximum 2 electrons with opposite spins",
    difficulty: "easy",
    topic_id: "tp-chem-001-3"
  },
  // Mathematics Questions
  {
    id: "q-math-001",
    question_text: "The value of i⁴ is:",
    options: ["1", "-1", "i", "-i"],
    correct_answer: "1",
    explanation: "i⁴ = (i²)² = (-1)² = 1",
    difficulty: "easy",
    topic_id: "tp-math-001-1"
  },
  {
    id: "q-math-002",
    question_text: "If z = 3 + 4i, then |z| equals:",
    options: ["3", "4", "5", "7"],
    correct_answer: "5",
    explanation: "|z| = √(3² + 4²) = √(9 + 16) = √25 = 5",
    difficulty: "medium",
    topic_id: "tp-math-001-2"
  },
  {
    id: "q-math-003",
    question_text: "For equation x² - 5x + 6 = 0, sum of roots is:",
    options: ["5", "-5", "6", "-6"],
    correct_answer: "5",
    explanation: "Sum of roots = -b/a = -(-5)/1 = 5",
    difficulty: "easy",
    topic_id: "tp-math-002-1"
  },
  {
    id: "q-math-004",
    question_text: "Discriminant of equation x² + 4x + 4 = 0 is:",
    options: ["0", "4", "8", "16"],
    correct_answer: "0",
    explanation: "D = b² - 4ac = 16 - 16 = 0, indicating equal roots",
    difficulty: "medium",
    topic_id: "tp-math-002-1"
  },
  {
    id: "q-math-005",
    question_text: "Derivative of x³ is:",
    options: ["3x²", "x²", "3x", "x³"],
    correct_answer: "3x²",
    explanation: "Using power rule: d/dx(x³) = 3x²",
    difficulty: "easy",
    topic_id: "tp-math-003-1"
  }
];

// Mock Podcasts
export const mockPodcasts: MockPodcast[] = [
  {
    id: "pod-phy-001",
    title: "Quick Summary: Introduction to Motion",
    duration: "5:30",
    audioUrl: "https://example.com/podcast1.mp3",
    transcript: `Welcome to this quick summary of Introduction to Motion. Motion is fundamental to physics - it's how objects change position over time. Let's cover the key points:

First, we have displacement - the shortest path from initial to final position. It's a vector quantity with both magnitude and direction.

Next is velocity - the rate of change of displacement. Remember, velocity is also a vector, while speed is just the magnitude.

Acceleration describes how velocity changes with time. Positive acceleration means speeding up, negative means slowing down.

The three equations of motion apply when acceleration is constant: v = u + at, s = ut + half at squared, and v squared equals u squared plus 2as.

These equations are your toolkit for solving kinematics problems. Practice using them with different scenarios to build confidence. That's your quick summary!`,
    topic_id: "tp-phy-001-1"
  },
  {
    id: "pod-phy-002",
    title: "Deep Dive: Newton's Laws",
    duration: "12:45",
    audioUrl: "https://example.com/podcast2.mp3",
    transcript: `In this deep dive, we'll explore Newton's three laws of motion and their profound implications...`,
    topic_id: "tp-phy-002-1"
  },
  {
    id: "pod-chem-001",
    title: "Understanding Atomic Structure",
    duration: "8:20",
    audioUrl: "https://example.com/podcast3.mp3",
    transcript: `Let's explore the fascinating world inside an atom...`,
    topic_id: "tp-chem-001-1"
  }
];

// Mock Assignments
export const mockAssignments: MockAssignment[] = [
  {
    id: "assgn-phy-001",
    title: "Kinematics Problem Set",
    description: "Solve problems on motion, velocity, and acceleration",
    questions: ["q-phy-001", "q-phy-002", "q-phy-003"],
    due_date: "2025-11-01",
    total_marks: 30,
    status: "pending"
  },
  {
    id: "assgn-phy-002",
    title: "Laws of Motion Assignment",
    description: "Application of Newton's laws",
    questions: ["q-phy-002", "q-phy-003"],
    due_date: "2025-10-25",
    total_marks: 20,
    status: "submitted",
    submitted_date: "2025-10-20",
    score: 18,
    feedback: "Excellent work! Minor calculation error in question 2."
  },
  {
    id: "assgn-chem-001",
    title: "Atomic Structure Quiz",
    description: "Test your knowledge of atomic models",
    questions: ["q-chem-001", "q-chem-002", "q-chem-004"],
    due_date: "2025-10-30",
    total_marks: 30,
    status: "graded",
    submitted_date: "2025-10-18",
    score: 27,
    feedback: "Great understanding of concepts!"
  }
];

// Mock Recorded Videos
export const mockVideos: MockVideo[] = [
  {
    id: "vid-phy-001",
    title: "Introduction to Kinematics",
    duration: "18:45",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "/placeholder.svg",
    instructor: "Dr. Sharma",
    completed: true,
    topic_id: "tp-phy-001-1",
    category: "Introduction"
  },
  {
    id: "vid-phy-002",
    title: "Solved Examples - Motion Problems",
    duration: "25:30",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "/placeholder.svg",
    instructor: "Dr. Sharma",
    completed: false,
    topic_id: "tp-phy-001-1",
    category: "Solved Examples"
  },
  {
    id: "vid-phy-003",
    title: "Quick Revision - Kinematics",
    duration: "12:15",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "/placeholder.svg",
    instructor: "Prof. Kumar",
    completed: false,
    topic_id: "tp-phy-001-1",
    category: "Quick Revision"
  }
];

// Helper function to get chapters by subject
export const getChaptersBySubject = (subject: string): Chapter[] => {
  switch (subject.toLowerCase()) {
    case 'physics':
      return physicsChapters;
    case 'chemistry':
      return chemistryChapters;
    case 'mathematics':
    case 'math':
      return mathematicsChapters;
    default:
      return [];
  }
};

// Helper function to get questions by topic
export const getQuestionsByTopic = (topicId: string): MockQuestion[] => {
  return mockQuestions.filter(q => q.topic_id === topicId);
};

// Helper function to get podcasts by topic
export const getPodcastsByTopic = (topicId: string): MockPodcast[] => {
  return mockPodcasts.filter(p => p.topic_id === topicId);
};

// Helper function to get videos by topic
export const getVideosByTopic = (topicId: string): MockVideo[] => {
  return mockVideos.filter(v => v.topic_id === topicId);
};
