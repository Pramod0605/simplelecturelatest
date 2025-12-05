import { useState, useMemo } from "react";
import { useCategoriesHierarchy } from "@/hooks/useCategoriesHierarchy";
import { useCoursesByHierarchy } from "@/hooks/useCoursesByHierarchy";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Users, Clock } from "lucide-react";

export const ExploreProgramsSection = () => {
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | undefined>(undefined);
  const [selectedSubSubCategoryId, setSelectedSubSubCategoryId] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;
  
  const { data: categoriesHierarchy, isLoading: categoriesLoading } = useCategoriesHierarchy();
  const { data: courses, isLoading: coursesLoading } = useCoursesByHierarchy(
    selectedParentId,
    selectedSubCategoryId,
    selectedSubSubCategoryId
  );

  // Get subcategories (level 2) for selected parent
  const subCategories = useMemo(() => {
    if (!selectedParentId || !categoriesHierarchy) return [];
    const parent = categoriesHierarchy.find(cat => cat.id === selectedParentId);
    return parent?.subcategories || [];
  }, [selectedParentId, categoriesHierarchy]);

  // Get sub-subcategories (level 3) for selected sub-category
  const subSubCategories = useMemo(() => {
    if (!selectedSubCategoryId || !subCategories.length) return [];
    const subCat = subCategories.find(cat => cat.id === selectedSubCategoryId);
    return subCat?.subcategories || [];
  }, [selectedSubCategoryId, subCategories]);

  // Pagination logic
  const totalCourses = courses?.length || 0;
  const totalPages = Math.ceil(totalCourses / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;
  const paginatedCourses = courses?.slice(startIndex, endIndex) || [];

  const handleParentChange = (categoryId: string | undefined) => {
    setSelectedParentId(categoryId);
    setSelectedSubCategoryId(undefined);
    setSelectedSubSubCategoryId(undefined);
    setCurrentPage(1);
  };

  const handleSubCategoryChange = (categoryId: string | undefined) => {
    setSelectedSubCategoryId(categoryId);
    setSelectedSubSubCategoryId(undefined);
    setCurrentPage(1);
  };

  const handleSubSubCategoryChange = (categoryId: string | undefined) => {
    setSelectedSubSubCategoryId(categoryId);
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
          {/* Left Sidebar - Parent Categories (Level 1) */}
          <Card className="h-fit">
            <CardContent className="p-4">
              <div className="space-y-2">
                {/* Most Popular */}
                <button
                  onClick={() => handleParentChange(undefined)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    !selectedParentId 
                      ? "bg-primary text-primary-foreground font-semibold" 
                      : "hover:bg-muted"
                  }`}
                >
                  Most Popular
                </button>

                {categoriesHierarchy?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleParentChange(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedParentId === category.id 
                        ? "bg-primary text-primary-foreground font-semibold" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {category.icon && <span>{category.icon}</span>}
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Content - Filters + Courses */}
          <div className="lg:col-span-3 space-y-4">
            {/* Sub-category Filter (Level 2) - Shows when parent is selected */}
            {selectedParentId && subCategories.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-2 pb-2">
                      <Badge
                        variant={!selectedSubCategoryId ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
                        onClick={() => handleSubCategoryChange(undefined)}
                      >
                        All
                      </Badge>
                      {subCategories.map((subCat) => (
                        <Badge
                          key={subCat.id}
                          variant={selectedSubCategoryId === subCat.id ? "default" : "outline"}
                          className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/90 transition-colors whitespace-nowrap"
                          onClick={() => handleSubCategoryChange(subCat.id)}
                        >
                          {subCat.icon && <span className="mr-1">{subCat.icon}</span>}
                          {subCat.name}
                        </Badge>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Sub-sub-category Filter (Level 3) - Shows when sub-category is selected */}
            {selectedSubCategoryId && subSubCategories.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-2 pb-2">
                      <Badge
                        variant={!selectedSubSubCategoryId ? "secondary" : "outline"}
                        className="cursor-pointer px-3 py-1.5 text-xs hover:bg-secondary/90 transition-colors"
                        onClick={() => handleSubSubCategoryChange(undefined)}
                      >
                        All {subCategories.find(c => c.id === selectedSubCategoryId)?.name}
                      </Badge>
                      {subSubCategories.map((subSubCat) => (
                        <Badge
                          key={subSubCat.id}
                          variant={selectedSubSubCategoryId === subSubCat.id ? "secondary" : "outline"}
                          className="cursor-pointer px-3 py-1.5 text-xs hover:bg-secondary/90 transition-colors whitespace-nowrap"
                          onClick={() => handleSubSubCategoryChange(subSubCat.id)}
                        >
                          {subSubCat.icon && <span className="mr-1">{subSubCat.icon}</span>}
                          {subSubCat.name}
                        </Badge>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

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
            ) : paginatedCourses && paginatedCourses.length > 0 ? (
              <>
                {/* Course count indicator */}
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalCourses)} of {totalCourses} courses
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {paginatedCourses.map((course) => (
                    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                      <Link to={`/programs/${course.slug}`} className="block">
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
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {course.name}
                          </h3>
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
                                {course.student_count.toLocaleString()} students
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              {course.price_inr > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold">₹{course.price_inr.toLocaleString()}</span>
                                  {course.original_price_inr && course.original_price_inr > course.price_inr && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      ₹{course.original_price_inr.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-green-600">Free</span>
                              )}
                            </div>
                            <Button size="sm" variant="outline">View Details</Button>
                          </div>
                        </CardContent>
                      </Link>
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
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5) {
                          if (currentPage > 3) {
                            pageNum = currentPage - 2 + i;
                          }
                          if (pageNum > totalPages) {
                            pageNum = totalPages - 4 + i;
                          }
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
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
