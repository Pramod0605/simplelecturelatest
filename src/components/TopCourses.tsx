import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Course {
  id: string;
  title: string;
  level: string;
  rating: number;
  reviews: number;
  duration: string;
  price: number;
  originalPrice?: number;
  image: string;
  lastUpdated: string;
}

const courses: Course[] = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    level: "Intermediate",
    rating: 4.8,
    reviews: 2345,
    duration: "24:11:44 Hours",
    price: 999,
    originalPrice: 4999,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80",
    lastUpdated: "Tue, 11-Mar-2025",
  },
  {
    id: "2",
    title: "Data Science & Machine Learning",
    level: "Advanced",
    rating: 4.9,
    reviews: 1823,
    duration: "32:15:30 Hours",
    price: 1499,
    originalPrice: 5999,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
    lastUpdated: "Mon, 10-Mar-2025",
  },
  {
    id: "3",
    title: "UI/UX Design Masterclass",
    level: "Beginner",
    rating: 4.7,
    reviews: 1567,
    duration: "18:45:20 Hours",
    price: 799,
    originalPrice: 3999,
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80",
    lastUpdated: "Sun, 09-Mar-2025",
  },
  {
    id: "4",
    title: "Digital Marketing Complete Course",
    level: "Intermediate",
    rating: 4.6,
    reviews: 2100,
    duration: "20:30:15 Hours",
    price: 899,
    originalPrice: 4499,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
    lastUpdated: "Sat, 08-Mar-2025",
  },
];

export const TopCourses = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % courses.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length);
  };

  const visibleCourses = [
    courses[currentIndex],
    courses[(currentIndex + 1) % courses.length],
    courses[(currentIndex + 2) % courses.length],
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Top <span className="bg-gradient-primary bg-clip-text text-transparent">Courses</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most popular courses across all categories
          </p>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full shadow-lg hidden md:flex"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full shadow-lg hidden md:flex"
            onClick={nextSlide}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Courses Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCourses.map((course, idx) => (
              <Card
                key={`${course.id}-${idx}`}
                className="group hover:shadow-hover transition-all duration-300 overflow-hidden animate-fade-in"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary">
                    {course.level}
                  </Badge>
                  <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-2 text-white text-sm">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </div>
                </div>

                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{course.rating}</span>
                      <span className="text-muted-foreground text-sm">({course.reviews} Reviews)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <RefreshCcw className="w-4 h-4" />
                    Last updated {course.lastUpdated}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">₹{course.price}</span>
                    {course.originalPrice && (
                      <span className="text-lg line-through text-muted-foreground">
                        ₹{course.originalPrice}
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button className="w-full group">
                    Enroll now
                    <Star className="ml-2 w-4 h-4 group-hover:rotate-12 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="flex justify-center gap-2 mt-8 md:hidden">
            <Button variant="outline" size="icon" onClick={prevSlide}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextSlide}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
