import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Grid, List, SlidersHorizontal, ShoppingCart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";
import { formatINR } from "@/lib/utils";

const mockPrograms = [
  {
    id: "1",
    title: "MISSION JRF PRO DEC 2025",
    instructor: "Dr. Rajesh Kumar",
    avatar: "/placeholder.svg",
    duration: "6 months",
    price: 6199,
    rating: 4.8,
    icon: "/placeholder.svg",
  },
  {
    id: "2",
    title: "Full Stack Development",
    instructor: "Sneha Patel",
    avatar: "/placeholder.svg",
    duration: "8 months",
    price: 7999,
    rating: 4.9,
    icon: "/placeholder.svg",
  },
  {
    id: "3",
    title: "Data Science Masterclass",
    instructor: "Amit Verma",
    avatar: "/placeholder.svg",
    duration: "5 months",
    price: 5499,
    rating: 4.7,
    icon: "/placeholder.svg",
  },
  {
    id: "4",
    title: "AI & Machine Learning",
    instructor: "Priya Sharma",
    avatar: "/placeholder.svg",
    duration: "7 months",
    price: 8999,
    rating: 4.9,
    icon: "/placeholder.svg",
  },
];

const MobilePrograms = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || "All Courses";
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [duration, setDuration] = useState("all");
  const [level, setLevel] = useState("all");

  return (
    <>
      <SEOHead title={`${category} | SimpleLecture`} description={`Browse ${category} programs`} />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Link to="/mobile-home">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="font-semibold text-lg">{category}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 py-6">
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Price Range</Label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={20000}
                        step={500}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{formatINR(priceRange[0])}</span>
                        <span>{formatINR(priceRange[1])}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Duration</Label>
                      <RadioGroup value={duration} onValueChange={setDuration}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="all" />
                          <Label htmlFor="all">All</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="3-6" id="3-6" />
                          <Label htmlFor="3-6">3-6 months</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="6-12" id="6-12" />
                          <Label htmlFor="6-12">6-12 months</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Level</Label>
                      <RadioGroup value={level} onValueChange={setLevel}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="level-all" />
                          <Label htmlFor="level-all">All Levels</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="beginner" id="beginner" />
                          <Label htmlFor="beginner">Beginner</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="intermediate" id="intermediate" />
                          <Label htmlFor="intermediate">Intermediate</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="advanced" id="advanced" />
                          <Label htmlFor="advanced">Advanced</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button className="w-full">Apply Filters</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="p-4">
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-4"}>
            {mockPrograms.map((program) => (
              <Link
                key={program.id}
                to={`/mobile/programs/${program.id}`}
                className="block"
              >
                <div className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      <img src={program.icon} alt={program.title} className="h-16 w-16 rounded-full" />
                    </div>
                    <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900">
                      ⭐ {program.rating}
                    </Badge>
                    <Button variant="ghost" size="icon" className="absolute top-2 left-2 bg-background/80">
                      <Bell className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3">
                    <Badge variant="secondary" className="mb-2 text-xs">Course</Badge>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">{program.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <img src={program.avatar} alt={program.instructor} className="h-6 w-6 rounded-full" />
                      <span className="text-xs text-muted-foreground">{program.instructor}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{program.duration}</span>
                      <span className="font-bold text-sm text-primary">{formatINR(program.price)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default MobilePrograms;
