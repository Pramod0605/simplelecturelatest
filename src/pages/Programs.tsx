import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Clock, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Programs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .eq('level', 1)
        .order('display_order');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all courses
  const { data: allCourses, isLoading } = useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_categories!inner(category_id)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Filter and sort courses
  const filteredCourses = allCourses?.filter((course: any) => {
    // Search filter
    if (searchQuery && !course.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (selectedCategory !== "all") {
      const hasCategory = course.course_categories?.some(
        (cc: any) => cc.category_id === selectedCategory
      );
      if (!hasCategory) return false;
    }

    // Price filter
    if (priceFilter === "free" && course.price_inr > 0) return false;
    if (priceFilter === "paid" && course.price_inr === 0) return false;

    return true;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case "price-low":
        return a.price_inr - b.price_inr;
      case "price-high":
        return b.price_inr - a.price_inr;
      case "popular":
        return b.student_count - a.student_count;
      default: // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Pagination
  const totalCourses = filteredCourses?.length || 0;
  const totalPages = Math.ceil(totalCourses / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;
  const displayedCourses = filteredCourses?.slice(startIndex, endIndex) || [];

  return (
    <>
      <SEOHead 
        title="All Programs | SimpleLecture"
        description="Browse all available courses and programs. Find the perfect course for your learning journey."
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">All Programs</h1>
            <p className="text-muted-foreground">
              Explore our comprehensive collection of courses
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={(value) => {
              setPriceFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, totalCourses)} of {totalCourses} courses
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
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

          {/* Courses Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {displayedCourses.map((course: any) => (
                  <Link 
                    key={course.id} 
                    to={`/programs/${course.slug}`}
                    className="block"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] group cursor-pointer h-full">
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
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">{course.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {course.short_description || course.detailed_description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          {course.duration_months && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {course.duration_months}m
                            </div>
                          )}
                          {course.student_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course.student_count}
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
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
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
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
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
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground mb-4">No courses found matching your filters</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setPriceFilter("all");
                setCurrentPage(1);
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Programs;
