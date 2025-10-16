import { useState } from "react";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useCoursesByCategory } from "@/hooks/useCoursesByCategory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export const ExploreProgramsSection = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const { data: courses, isLoading: coursesLoading } = useCoursesByCategory(selectedCategoryId);

  // Get parent categories (level 1)
  const parentCategories = categories?.filter(cat => cat.level === 1 && cat.is_active) || [];
  
  // Get subcategories for selected parent category
  const subcategories = selectedCategoryId 
    ? categories?.filter(cat => cat.parent_id === selectedCategoryId && cat.is_active) || []
    : [];

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Filter courses by subcategory if one is selected
  const filteredCourses = selectedSubcategory === "all" 
    ? courses 
    : courses?.filter(course => {
        // This would need proper subcategory filtering logic
        return true;
      });

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
                  onClick={() => {
                    setSelectedCategoryId(undefined);
                    setSelectedSubcategory("all");
                  }}
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
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setSelectedSubcategory("all");
                    }}
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
            {/* Subcategory Tabs */}
            {subcategories.length > 0 && (
              <Tabs value={selectedSubcategory} onValueChange={setSelectedSubcategory} className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {subcategories.map((subcat) => (
                    <TabsTrigger key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {/* Course Cards Grid */}
            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses?.map((course) => (
                  <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <span className="text-4xl">📚</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg line-clamp-2">{course.name}</h3>
                      {course.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.short_description}
                        </p>
                      )}
                      {course.duration_months && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {course.duration_months} Months
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          {course.price_inr > 0 ? (
                            <div className="flex items-center gap-2">
                              {course.original_price_inr && course.original_price_inr > course.price_inr && (
                                <span className="text-sm text-muted-foreground line-through">
                                  ₹{course.original_price_inr}
                                </span>
                              )}
                              <span className="text-lg font-bold text-primary">
                                ₹{course.price_inr}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-primary">Free</span>
                          )}
                        </div>
                        <Link to={`/courses/${course.slug}`}>
                          <Button>View Program</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!coursesLoading && (!filteredCourses || filteredCourses.length === 0) && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No courses available in this category yet.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
