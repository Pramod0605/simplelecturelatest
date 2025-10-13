import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEO";
import { HamburgerMenu } from "@/components/mobile/HamburgerMenu";
import { BottomNav } from "@/components/mobile/BottomNav";
import { CourseCard } from "@/components/mobile/CourseCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Gift, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { mockPromos } from "@/data/mockPromos";

const filterTabs = ["All", "Paper-1", "Commerce", "Science", "Arts", "Technology"];

const mockCourses = [
  {
    id: 1,
    image: "/placeholder.svg",
    badge: "New",
    title: "Complete Data Science Bootcamp 2025",
    instructor: "Dr. Priya Sharma",
    language: "Hinglish",
    price: 5999,
    originalPrice: 12999,
    description: "Master Python, ML, AI and get job-ready",
  },
  {
    id: 2,
    image: "/placeholder.svg",
    badge: "Trending",
    title: "UGC NET Paper 1 Complete Course",
    instructor: "Prof. Amit Kumar",
    language: "Hindi",
    price: 3999,
    originalPrice: 8999,
    description: "Complete preparation for NET exam",
  },
];

const MobileHome = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mockPromos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <SEOHead
        title="SimpleLecture - Learn Anywhere, Anytime"
        description="Access 1000+ courses on mobile. Learn Data Science, AI, and more with AI tutors."
        keywords="online learning app, mobile courses, AI education"
        canonicalUrl="https://simplelecture.com/mobile-home"
      />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <HamburgerMenu />
            
            <Badge variant="secondary" className="text-sm px-3 py-1">
              UGC NET 📚
            </Badge>
            
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">XP: 0</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for courses, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button className="h-12 px-6">Study</Button>
          </div>
        </div>

        {/* Hero Carousel */}
        <div className="relative px-4 mb-6">
          <div className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-r from-primary to-secondary">
            <div className="absolute inset-0 flex items-center justify-center text-center p-6">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">
                  {mockPromos[currentSlide].title}
                </h2>
                <p className="text-sm mb-4 opacity-90">
                  {mockPromos[currentSlide].description}
                </p>
                <p className="text-3xl font-bold mb-4">
                  Starting At Just ₹{mockPromos[currentSlide].price}/-
                </p>
                <Button variant="secondary" size="lg">
                  {mockPromos[currentSlide].cta}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Carousel Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 flex justify-between pointer-events-none">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full pointer-events-auto opacity-80"
              onClick={() => setCurrentSlide((prev) => (prev - 1 + mockPromos.length) % mockPromos.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full pointer-events-auto opacity-80"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % mockPromos.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {mockPromos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            {filterTabs.map((tab) => (
              <Button
                key={tab}
                variant={activeFilter === tab ? "default" : "outline"}
                className="flex-shrink-0 rounded-full"
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="px-4 mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">80</span> Batches available
          </p>
        </div>

        {/* Course Cards */}
        <div className="px-4 space-y-4">
          {mockCourses.map((course) => (
            <CourseCard
              key={course.id}
              image={course.image}
              badge={course.badge}
              title={course.title}
              instructor={course.instructor}
              language={course.language}
              price={course.price}
              originalPrice={course.originalPrice}
              description={course.description}
              onWhatsAppClick={() => console.log("WhatsApp clicked for", course.id)}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </>
  );
};

export default MobileHome;
