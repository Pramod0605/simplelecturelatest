import { useState } from "react";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useCoursesByCategory } from "@/hooks/useCoursesByCategory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Users, Clock } from "lucide-react";

export const ExploreProgramsSection = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;
  
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const { data: allCourses, isLoading: coursesLoading } = useCoursesByCategory(selectedCategoryId);

  // Get parent categories (level 1)
  const parentCategories = categories?.filter(cat => cat.level === 1 && cat.is_active) || [];
  
  // Get subcategories for selected parent category
  const subcategories = selectedCategoryId 
    ? categories?.filter(cat => cat.parent_id === selectedCategoryId && cat.is_active) || []
    : [];

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Filter courses by subcategory if one is selected
  const filteredCourses = selectedSubcategory === "all" 
    ? allCourses 
    : allCourses?.filter(course => {
        // This would need proper subcategory filtering logic
        return true;
      });

  // Pagination logic
  const totalCourses = filteredCourses?.length || 0;
  const totalPages = Math.ceil(totalCourses / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;
  const courses = filteredCourses?.slice(startIndex, endIndex) || [];

  const handleCategoryChange = (categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategory("all");
    setCurrentPage(1);
  };

  if (categoriesLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="lg:col-span-3 h-96" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8">Explore Our Top Programs</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Categories */}
          <Card className="h-fit">
            <CardContent className="p-4">
              <div className="space-y-2">
                {/* Most Popular as first item */}
                <button
                  onClick={() => handleCategoryChange(undefined)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    !selectedCategoryId 
                      ? "bg-primary text-primary-foreground font-semibold" 
                      : "hover:bg-muted"
                  }`}
                >
                  Most Popular
                </button>

                {parentCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedCategoryId === category.id 
                        ? "bg-muted font-semibold" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Content - Courses */}
          <div className="lg:col-span-3">
            {/* Course Cards Grid */}
            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : courses && courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                        {course.thumbnail_url && (
                          <img
                            src={course.thumbnail_url}
                            alt={course.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        {course.price_inr === 0 && (
                          <Badge className="absolute top-3 right-3 bg-green-500">Free</Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {course.short_description || course.detailed_description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          {course.duration_months && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {course.duration_months} months
                            </div>
                          )}
                          {course.student_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course.student_count} students
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            {course.price_inr > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">₹{course.price_inr}</span>
                                {course.original_price_inr && course.original_price_inr > course.price_inr && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    ₹{course.original_price_inr}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-green-600">Free</span>
                            )}
                          </div>
                          <Button asChild size="sm">
                            <Link to={`/programs/${course.slug}`}>View</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <Button
                          key={i}
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex justify-center">
                  <Button asChild variant="outline" size="lg">
                    <Link to="/programs">View All Courses</Link>
                  </Button>
                </div>
              </>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No courses available in this category</p>
                <Button asChild variant="outline">
                  <Link to="/programs">Browse All Courses</Link>
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
