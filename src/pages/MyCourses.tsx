import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEO';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, Users, Home, ChevronRight, CheckCircle } from 'lucide-react';
import { useEnrolledCoursesWithCategories } from '@/hooks/useEnrolledCoursesWithCategories';
import { format } from 'date-fns';

const MyCourses = () => {
  const navigate = useNavigate();
  const { data: enrolledCourses, isLoading } = useEnrolledCoursesWithCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch parent categories for filter tabs
  const { data: categories } = useQuery({
    queryKey: ["parent-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .eq("is_active", true)
        .eq("level", 1)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
    staleTime: 300000,
  });

  // Get unique parent categories from enrolled courses
  const enrolledCategories = useMemo(() => {
    if (!enrolledCourses) return [];
    const categoryIds = new Set(enrolledCourses.map(c => c.parentCategoryId).filter(Boolean));
    return categories?.filter(cat => categoryIds.has(cat.id)) || [];
  }, [enrolledCourses, categories]);

  // Filter courses by selected category
  const filteredCourses = useMemo(() => {
    if (!enrolledCourses) return [];
    if (selectedCategory === 'all') return enrolledCourses;
    return enrolledCourses.filter(c => c.parentCategoryId === selectedCategory);
  }, [enrolledCourses, selectedCategory]);

  const handleCourseClick = (course: any) => {
    navigate(`/learning/${course.id}`);
  };

  return (
    <>
      <SEOHead title="My Courses | SimpleLecture" description="View and continue your enrolled courses" />
      <DashboardHeader />
      
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="bg-muted/30 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="h-4 w-4" />
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">My Courses</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">My Courses</h1>
            <p className="text-muted-foreground">
              Continue your learning journey with your enrolled programs
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 bg-muted/50 p-2">
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All Programs
              </TabsTrigger>
              {enrolledCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="container mx-auto px-4 pb-12">
          {/* Courses Count - only show when loaded */}
          <div className="mb-6 h-5">
            {isLoading ? (
              <span className="text-sm text-muted-foreground">Loading your courses...</span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} enrolled
              </span>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredCourses.length === 0 && (
            <Card className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedCategory === 'all' 
                  ? "You haven't enrolled in any courses yet"
                  : "No courses found in this category"
                }
              </p>
              <Button onClick={() => navigate('/programs')}>
                Browse Programs
              </Button>
            </Card>
          )}

          {/* Course Grid */}
          {!isLoading && filteredCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <Card 
                  key={course.id} 
                  className="h-full overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleCourseClick(course)}
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {course.thumbnail_url && (
                      <img
                        src={course.thumbnail_url}
                        alt={course.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <Badge className="absolute top-3 right-3 bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enrolled
                    </Badge>
                    {course.parentCategoryName && (
                      <Badge variant="secondary" className="absolute top-3 left-3">
                        {course.parentCategoryName}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {course.short_description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      {course.duration_months && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration_months} months
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        Enrolled {format(new Date(course.enrolled_at), 'MMM dd, yyyy')}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>

                    <Button className="w-full" variant={course.progress > 0 ? "default" : "outline"}>
                      {course.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default MyCourses;
