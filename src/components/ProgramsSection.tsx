import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Users, ArrowRight, Award } from "lucide-react";

interface Program {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  type: string;
  duration: string;
  price: number;
  originalPrice?: number;
  rating: number;
  students: number;
  subjects: string[];
  features: string[];
  image: string;
}

const categories = [
  { id: "all", name: "Most Popular" },
  { id: "board", name: "Board Exams" },
  { id: "entrance", name: "Entrance Exams" },
  { id: "competitive", name: "Competitive Exams" },
  { id: "skill", name: "Skill Development" },
];

const subcategories = {
  board: [
    { id: "all", name: "All" },
    { id: "11th", name: "11th/1st PUC" },
    { id: "12th", name: "12th/2nd PUC" },
  ],
  entrance: [
    { id: "all", name: "All" },
    { id: "neet", name: "NEET" },
    { id: "jee", name: "JEE" },
    { id: "cet", name: "CET" },
  ],
  competitive: [
    { id: "all", name: "All" },
    { id: "upsc", name: "UPSC" },
    { id: "banking", name: "Banking" },
  ],
  skill: [
    { id: "all", name: "All" },
    { id: "programming", name: "Programming" },
    { id: "design", name: "Design" },
  ],
};

const programs: Program[] = [
  {
    id: "sslc-complete-2026",
    title: "10th/SSLC Complete Package",
    category: "board",
    subcategory: "10th",
    type: "Board",
    duration: "1 Year",
    price: 2000,
    originalPrice: 22000,
    rating: 4.8,
    students: 18234,
    subjects: ["Physics", "Chemistry", "Maths", "Biology", "English"],
    features: [
      "State Board Coverage",
      "AI Doubt Clearing 24/7",
      "Hindi/English/Kannada Support",
    ],
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80",
  },
  {
    id: "i-puc-pcmb-2026",
    title: "I PUC Science (PCMB)",
    category: "board",
    subcategory: "11th",
    type: "Board",
    duration: "1 Year",
    price: 2000,
    originalPrice: 25000,
    rating: 4.7,
    students: 22890,
    subjects: ["Physics", "Chemistry", "Maths", "Biology"],
    features: [
      "Complete PUC Syllabus",
      "Competitive Exam Foundation",
      "AI-Powered Learning",
    ],
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80",
  },
  {
    id: "puc-neet-integrated-2026",
    title: "II PUC + NEET Integrated",
    category: "entrance",
    subcategory: "neet",
    type: "Integrated",
    duration: "1 Year",
    price: 2000,
    originalPrice: 40000,
    rating: 4.9,
    students: 35678,
    subjects: ["Physics", "Chemistry", "Biology"],
    features: [
      "Dual Preparation (Board + NEET)",
      "20,000+ NEET MCQs",
      "50+ Full-Length Mocks",
    ],
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80",
  },
  {
    id: "jee-main-advanced-2026",
    title: "JEE Main + Advanced 2026",
    category: "entrance",
    subcategory: "jee",
    type: "Entrance",
    duration: "1 Year",
    price: 2000,
    originalPrice: 45000,
    rating: 4.8,
    students: 28456,
    subjects: ["Physics", "Chemistry", "Mathematics"],
    features: [
      "IIT-Level Problem Solving",
      "15 Years JEE PYQs",
      "60+ Mock Tests",
    ],
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80",
  },
  {
    id: "karnataka-cet-2026",
    title: "Karnataka CET Complete",
    category: "entrance",
    subcategory: "cet",
    type: "Entrance",
    duration: "1 Year",
    price: 2000,
    originalPrice: 18000,
    rating: 4.8,
    students: 19567,
    subjects: ["Physics", "Chemistry", "Mathematics"],
    features: [
      "State-Specific Syllabus",
      "CET Pattern Tests",
      "Local Expert Faculty",
    ],
    image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400&q=80",
  },
];

export const ProgramsSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");

  const filteredPrograms = programs.filter((program) => {
    if (selectedCategory === "all") return true;
    if (program.category !== selectedCategory) return false;
    if (selectedSubcategory === "all") return true;
    return program.subcategory === selectedSubcategory;
  });

  const currentSubcategories =
    selectedCategory === "all" ? [] : subcategories[selectedCategory as keyof typeof subcategories] || [];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Explore Our <span className="bg-gradient-primary bg-clip-text text-transparent">Top Programs</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our comprehensive range of courses designed for exam success
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Categories */}
          <aside className="lg:w-64 space-y-2">
            <h3 className="font-semibold mb-4 text-lg">Categories</h3>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedSubcategory("all");
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-primary text-white shadow-soft"
                    : "bg-card hover:bg-muted"
                }`}
              >
                {category.name}
              </button>
            ))}
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Subcategory Tabs */}
            {currentSubcategories.length > 0 && (
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {currentSubcategories.map((sub) => (
                  <Button
                    key={sub.id}
                    onClick={() => setSelectedSubcategory(sub.id)}
                    variant={selectedSubcategory === sub.id ? "default" : "outline"}
                    className="whitespace-nowrap"
                  >
                    {sub.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Programs Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <Card key={program.id} className="group hover:shadow-hover transition-all duration-300 overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={program.image}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <Badge className="absolute top-4 left-4 bg-primary">
                      {program.type}
                    </Badge>
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold">{program.title}</h3>
                      <Badge variant="outline" className="ml-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {program.duration}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {program.subjects.map((subject, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Award className="w-4 h-4 text-primary" />
                        Key Features:
                      </p>
                      <ul className="space-y-1">
                        {program.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold">{program.rating}/5</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Users className="w-4 h-4" />
                          {program.students.toLocaleString()}+
                        </div>
                      </div>
                    </div>

                    <div className="bg-success/10 rounded-lg p-3 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-success">₹{program.price}</span>
                        <span className="text-sm text-muted-foreground">/year</span>
                      </div>
                      {program.originalPrice && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm line-through text-muted-foreground">
                            ₹{program.originalPrice}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            99% less cost!
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    <Link to={`/programs/${program.id}`} className="flex-1">
                      <Button className="w-full group">
                        View Details
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Button variant="outline">Book Demo</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
