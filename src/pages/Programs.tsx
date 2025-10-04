import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, Grid3x3, List, ChevronDown, Star, Clock, Users, ArrowRight, Award } from "lucide-react";
import { usePrograms } from "@/hooks/usePrograms";

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

const programTypes = ["Live Class", "Course", "Text Lesson"];

export default function Programs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Filters
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  
  const { data: programs, isLoading } = usePrograms(selectedCategory === "all" ? undefined : selectedCategory);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Mock data for demonstration (will use real data from usePrograms)
  const mockPrograms = [
    {
      id: "1",
      title: "Backend Development with Node.js",
      category: "Software Development",
      instructor: "Kate Williams",
      instructorCategory: "Web Development",
      price: 25,
      duration: "3:10 Hours",
      rating: 4.8,
      students: 1200,
      image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80",
    },
    {
      id: "2",
      title: "Mobile App Development with React Native",
      category: "Software Development",
      instructor: "Robert Ransdell",
      instructorCategory: "Web Development",
      price: 30,
      duration: "3:30 Hours",
      rating: 4.7,
      students: 980,
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80",
    },
    {
      id: "3",
      title: "Python for Data Science",
      category: "Data Science & Business Analytics",
      instructor: "Linda Anderson",
      instructorCategory: "Web Development",
      price: 10,
      duration: "3:20 Hours",
      rating: 4.9,
      students: 2400,
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80",
    },
  ];

  const filteredPrograms = mockPrograms.filter((program) => {
    if (searchQuery && !program.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== "all" && program.category !== selectedCategory) {
      return false;
    }
    if (isFree && program.price > 0) {
      return false;
    }
    if (program.price < priceRange[0] || program.price > priceRange[1]) {
      return false;
    }
    return true;
  });

  return (
    <>
      <SEOHead
        title="Programs - SimpleLecture"
        description="Browse our comprehensive catalog of online programs and courses"
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            {/* Search and Top Filters */}
            <div className="bg-background rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search programs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle Filters */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="upcoming" checked={isUpcoming} onCheckedChange={setIsUpcoming} />
                  <Label htmlFor="upcoming" className="cursor-pointer">Upcoming</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="free" checked={isFree} onCheckedChange={setIsFree} />
                  <Label htmlFor="free" className="cursor-pointer">Free</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="discount" checked={hasDiscount} onCheckedChange={setHasDiscount} />
                  <Label htmlFor="discount" className="cursor-pointer">Discount</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="downloadable" checked={isDownloadable} onCheckedChange={setIsDownloadable} />
                  <Label htmlFor="downloadable" className="cursor-pointer">Downloadable</Label>
                </div>
                
                <div className="ml-auto flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Sidebar - Filters */}
              <aside className="lg:w-80 space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {/* Type Filter */}
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <h3 className="font-semibold">Type</h3>
                        <ChevronDown className="w-4 h-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-2">
                        {programTypes.map((type) => (
                          <div key={type} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={type}
                              checked={selectedTypes.includes(type)}
                              onChange={() => toggleType(type)}
                              className="w-4 h-4 rounded border-input"
                            />
                            <Label htmlFor={type} className="cursor-pointer text-sm">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Price Filter */}
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <h3 className="font-semibold">Price</h3>
                        <ChevronDown className="w-4 h-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-sm">Free</span>
                          <Slider
                            value={priceRange}
                            onValueChange={setPriceRange}
                            max={1000}
                            step={10}
                            className="flex-1"
                          />
                          <span className="text-sm">${priceRange[1]}</span>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Category Filter */}
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <h3 className="font-semibold">Category</h3>
                        <ChevronDown className="w-4 h-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-2">
                        <button
                          onClick={() => setSelectedCategory("all")}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedCategory === "all"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          All Categories
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedCategory === cat
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Instructor Filter */}
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <h3 className="font-semibold">Instructor</h3>
                        <ChevronDown className="w-4 h-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <Input placeholder="Search and select an instructor..." />
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              </aside>

              {/* Main Content - Programs Grid/List */}
              <div className="flex-1">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredPrograms.length} results
                  </p>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPrograms.map((program) => (
                      <Card key={program.id} className="group hover:shadow-hover transition-all duration-300 overflow-hidden">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={program.image}
                            alt={program.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>

                        <CardHeader className="pb-3">
                          <h3 className="text-lg font-bold line-clamp-2 mb-2">{program.title}</h3>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                              {program.instructor.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{program.instructor}</p>
                              <p className="text-xs text-muted-foreground">in {program.instructorCategory}</p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-bold text-sm">{program.rating}/5</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Clock className="w-4 h-4" />
                              {program.duration}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Users className="w-4 h-4" />
                            {program.students.toLocaleString()}+ students
                          </div>

                          <div className="pt-2 border-t">
                            <span className="text-2xl font-bold text-primary">${program.price}</span>
                          </div>
                        </CardContent>

                        <CardFooter className="flex gap-2 pt-0">
                          <Button className="flex-1 group">
                            Enroll Now
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPrograms.map((program) => (
                      <Card key={program.id} className="group hover:shadow-hover transition-all duration-300">
                        <div className="flex flex-col sm:flex-row gap-4 p-4">
                          <div className="relative w-full sm:w-48 h-32 overflow-hidden rounded-lg flex-shrink-0">
                            <img
                              src={program.image}
                              alt={program.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>

                          <div className="flex-1 space-y-2">
                            <h3 className="text-xl font-bold">{program.title}</h3>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                                {program.instructor.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{program.instructor}</p>
                                <p className="text-xs text-muted-foreground">in {program.instructorCategory}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold">{program.rating}/5</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {program.duration}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {program.students.toLocaleString()}+ students
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col justify-between items-end gap-2">
                            <span className="text-2xl font-bold text-primary">${program.price}</span>
                            <Button className="group">
                              Enroll Now
                              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
