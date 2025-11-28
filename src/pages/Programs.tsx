import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Users, Clock, Search, Home, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Programs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const categorySlug = searchParams.get("category");
  const subcategorySlug = searchParams.get("subcategory");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });

  // Get parent categories (level 1)
  const parentCategories = categories?.filter(cat => cat.level === 1) || [];

  // Get selected parent category
  const selectedParentCategory = categorySlug 
    ? categories?.find(cat => cat.slug === categorySlug)
    : null;

  // Get subcategories for selected parent
  const subcategories = selectedParentCategory
    ? categories?.filter(cat => cat.parent_id === selectedParentCategory.id) || []
    : [];

  // Get selected subcategory
  const selectedSubcategory = subcategorySlug
    ? categories?.find(cat => cat.slug === subcategorySlug)
    : null;

  // Fetch courses based on selected category/subcategory
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses-filtered", selectedParentCategory?.id, selectedSubcategory?.id],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select(`
          *,
          course_categories!inner(category_id)
        `)
        .eq("is_active", true);

      // Filter by subcategory if selected, otherwise by parent category
      const filterCategoryId = selectedSubcategory?.id || selectedParentCategory?.id;
      if (filterCategoryId) {
        query = query.eq("course_categories.category_id", filterCategoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  // Apply search and sort
  let filteredCourses = courses || [];
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredCourses = filteredCourses.filter(course =>
      course.name.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query)
    );
  }

  // Sort courses
  filteredCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.price_inr || 0) - (b.price_inr || 0);
      case "price-high":
        return (b.price_inr || 0) - (a.price_inr || 0);
      case "popular":
        return (b.student_count || 0) - (a.student_count || 0);
      case "newest":
      default:
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
  });

  // Pagination
  const totalCourses = filteredCourses.length;
  const totalPages = Math.ceil(totalCourses / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;
  const displayedCourses = filteredCourses.slice(startIndex, endIndex);

  // Update URL when filters change
  const updateFilters = (category?: string, subcategory?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);
    setSearchParams(params);
    setCurrentPage(1);
  };

  return (
    <>
      <SEOHead
        title="Programs & Courses"
        description="Explore our comprehensive programs for board exams, NEET, JEE, and more"
        keywords="online courses, board exams, NEET, JEE, integrated programs"
      />
      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="bg-muted/30 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="h-4 w-4" />
                Home
              </Link>
              <ChevronRightIcon className="h-4 w-4" />
              <Link to="/programs" className="hover:text-primary transition-colors">
                Programs
              </Link>
              {selectedParentCategory && (
                <>
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className={!selectedSubcategory ? "text-foreground font-medium" : ""}>
                    {selectedParentCategory.name}
                  </span>
                </>
              )}
              {selectedSubcategory && (
                <>
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className="text-foreground font-medium">{selectedSubcategory.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">
              {selectedSubcategory?.name || selectedParentCategory?.name || "All Programs"}
            </h1>
            <p className="text-muted-foreground">
              {selectedSubcategory?.description || selectedParentCategory?.description || 
               "Explore our comprehensive courses designed for your success"}
            </p>
          </div>
        </div>

        {/* Category Navigation */}
        {!categorySlug && (
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 bg-muted/50 p-2">
                <TabsTrigger 
                  value="all"
                  onClick={() => updateFilters()}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  All Programs
                </TabsTrigger>
                {parentCategories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.slug}
                    onClick={() => updateFilters(category.slug)}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Subcategory Cards */}
        {categorySlug && !subcategorySlug && subcategories.length > 0 && (
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold mb-6">Choose Subcategory</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2"
                onClick={() => updateFilters(categorySlug)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">📚</div>
                  <p className="font-semibold text-sm">All</p>
                  <p className="text-xs text-muted-foreground mt-1">View all courses</p>
                </CardContent>
              </Card>
              {subcategories.map((subcat) => (
                <Card
                  key={subcat.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary"
                  onClick={() => updateFilters(categorySlug, subcat.slug)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{subcat.icon || "📖"}</div>
                    <p className="font-semibold text-sm">{subcat.name}</p>
                    {subcat.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {subcat.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-4 items-center w-full md:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {totalCourses} courses found
              </span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Course Grid */}
          {coursesLoading || categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
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
          ) : displayedCourses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedCourses.map((course) => (
                  <Link key={course.id} to={`/programs/${course.slug}`}>
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                        {course.thumbnail_url && (
                          <img
                            src={course.thumbnail_url}
                            alt={course.name}
                            className="w-full h-full object-cover"
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
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <Button
                          key={i}
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
            </>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-xl font-semibold mb-2">No courses found</p>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button onClick={() => {
                setSearchQuery("");
                updateFilters();
              }}>
                Clear All Filters
              </Button>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Programs;
