import { Button } from "@/components/ui/button";
import { BookOpen, Menu, Search, Grid3x3, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const categories = [
  "Generative AI",
  "AI & Machine Learning",
  "Data Science & Business Analytics",
  "Project Management",
  "Cyber Security",
  "Agile and Scrum",
  "Cloud Computing & DevOps",
  "Business and Leadership",
  "Software Development",
  "Product and Design",
  "IT Service and Architecture",
];

const programs = [
  {
    id: 1,
    title: "Applied Generative AI Specialization",
    institution: "PURDUE UNIVERSITY",
    duration: "16 Weeks",
    badge: "Trending Now",
    category: "Generative AI",
  },
  {
    id: 2,
    title: "Generative AI for Business Transformation",
    institution: "PURDUE UNIVERSITY",
    duration: "12 Weeks",
    category: "Generative AI",
  },
  {
    id: 3,
    title: "Professional Certificate Program in Generative AI and Machine Learning - IITG",
    institution: "E&ICT Academy IIT Guwahati",
    duration: "11 Months",
    badge: "Most Popular",
    category: "AI & Machine Learning",
  },
  {
    id: 4,
    title: "Professional Certificate Course in Generative AI and Machine Learning",
    institution: "E&ICT Academy, IT Kanpur",
    duration: "11 Months",
    category: "AI & Machine Learning",
  },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Courses");

  const filteredPrograms = selectedCategory === "All Courses" 
    ? programs 
    : programs.filter(p => p.category === selectedCategory);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">SimpleLecture</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-4xl">
            {/* All Courses Link */}
            <Link to="/programs">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Grid3x3 className="w-4 h-4" />
                All Courses
              </Button>
            </Link>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="What do you want to learn?"
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          {/* Desktop Right Menu */}
          <nav className="hidden lg:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  More <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <div className="p-2 space-y-1">
                  <a href="#how-it-works" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">How it works</a>
                  <a href="#contact" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">Contact</a>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              Login
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="What do you want to learn?"
                  className="pl-10"
                />
              </div>
              <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                How it works
              </a>
              <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
                Contact
              </a>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1 border-primary text-primary">
                  Login
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
