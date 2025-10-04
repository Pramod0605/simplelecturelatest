import { Button } from "@/components/ui/button";
import { BookOpen, Menu, Search, Grid3x3, ChevronDown } from "lucide-react";
import { useState } from "react";
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">SimpleLecture</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-4xl">
            {/* All Courses Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  All Courses
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[90vw] max-w-6xl p-0 bg-background" align="start">
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                  <div className="border-b">
                    <TabsList className="w-full justify-start rounded-none bg-muted/50 p-0 h-auto">
                      <TabsTrigger 
                        value="All Courses" 
                        className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none px-4 py-3"
                      >
                        All Courses
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="flex max-h-[70vh]">
                    {/* Categories Sidebar */}
                    <div className="w-64 border-r bg-muted/20 overflow-y-auto">
                      <div className="p-4">
                        <h3 className="font-semibold text-sm text-muted-foreground mb-3">CATEGORIES</h3>
                        <div className="space-y-1">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                selectedCategory === cat
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Programs Content */}
                    <div className="flex-1 overflow-y-auto">
                      <TabsContent value={selectedCategory} className="m-0 p-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Career Aligned Learning Paths</h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Master essential skills for your dream career
                          </p>
                          <div className="grid md:grid-cols-2 gap-4">
                            {filteredPrograms.map((program) => (
                              <div
                                key={program.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="font-semibold text-xs text-muted-foreground">
                                    {program.institution}
                                  </div>
                                  {program.badge && (
                                    <Badge className={program.badge === "Trending Now" ? "bg-green-500" : "bg-orange-500"}>
                                      {program.badge}
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-medium text-sm mb-2 line-clamp-2">{program.title}</h4>
                                <p className="text-xs text-muted-foreground">{program.duration}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </div>
                  </div>
                </Tabs>
              </DropdownMenuContent>
            </DropdownMenu>

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
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              For Business
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Resources
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  More <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="p-2 space-y-1">
                  <a href="#" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">About</a>
                  <a href="#" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">Contact</a>
                  <a href="#" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">Help</a>
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
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                For Business
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Resources
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                About
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
