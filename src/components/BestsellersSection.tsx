import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Users, ChevronRight, GraduationCap } from "lucide-react";
import { useState } from "react";

interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorRole: string;
  rating: number;
  students: number;
  duration: string;
  price: number;
  originalPrice: number;
  image: string;
  isFree?: boolean;
}

const bestsellerCourses: Course[] = [
  {
    id: "1",
    title: "Complete NEET 2026 Course",
    instructor: "Dr. Priya Sharma",
    instructorRole: "Biology Expert",
    rating: 5.0,
    students: 28456,
    duration: "450 Hours",
    price: 2000,
    originalPrice: 45000,
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80"
  },
  {
    id: "2",
    title: "JEE Main + Advanced 2026",
    instructor: "Prof. Rajesh Kumar",
    instructorRole: "Mathematics Expert",
    rating: 5.0,
    students: 31209,
    duration: "520 Hours",
    price: 2000,
    originalPrice: 50000,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80"
  },
  {
    id: "3",
    title: "II PUC Complete Package (PCMB)",
    instructor: "Team SimpleLecture",
    instructorRole: "All Subjects",
    rating: 5.0,
    students: 19876,
    duration: "380 Hours",
    price: 2000,
    originalPrice: 35000,
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&q=80"
  }
];

export const BestsellersSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 text-white">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Star className="w-4 h-4 mr-2 fill-white" />
              Top Rated
            </Badge>
            
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Bestsellers Chosen by Our Students
            </h2>
            
            <p className="text-lg text-white/90 leading-relaxed">
              Explore our top-rated courses, chosen by thousands of students who've enrolled and benefited. 
              These bestsellers reflect what's most in-demand and valuable across our platform.
            </p>

            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-white/90 shadow-xl group"
            >
              View More Courses
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Decorative Graduation Cap */}
            <div className="hidden lg:block absolute bottom-0 left-0 opacity-10">
              <GraduationCap className="w-64 h-64" />
            </div>
          </div>

          {/* Right Carousel */}
          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {bestsellerCourses.map((course) => (
                  <div key={course.id} className="w-full flex-shrink-0 px-2">
                    <Card className="bg-white hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                      {/* Course Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <Badge className="absolute top-4 right-4 bg-primary">
                          Bestseller
                        </Badge>
                      </div>

                      <CardContent className="p-6 space-y-4">
                        {/* Course Title */}
                        <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>

                        {/* Instructor */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                            {course.instructor.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{course.instructor}</p>
                            <p className="text-xs text-muted-foreground">{course.instructorRole}</p>
                          </div>
                        </div>

                        {/* Rating & Students */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <span className="font-bold">{course.rating}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Users className="w-4 h-4" />
                            {course.students.toLocaleString()}
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Clock className="w-4 h-4" />
                          {course.duration} of content
                        </div>

                        {/* Price */}
                        <div className="pt-4 border-t space-y-2">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-primary">₹{course.price}</span>
                              <span className="text-lg line-through text-muted-foreground">
                                ₹{course.originalPrice.toLocaleString()}
                              </span>
                            </div>
                            <Badge className="bg-success text-white">
                              {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            + Optional AI Tutoring & Live Classes add-ons
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {bestsellerCourses.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    currentIndex === index ? "bg-white w-8" : "bg-white/40 w-2"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
