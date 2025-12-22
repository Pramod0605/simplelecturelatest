import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Bell, 
  ShoppingCart,
  Menu,
  Star,
  Clock
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFeaturedCourses } from "@/hooks/useFeaturedCourses";
import { formatINR } from "@/lib/utils";

export const MobileHomeContent = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: featuredCourses, isLoading: coursesLoading } = useFeaturedCourses("bestsellers");
  const { data: newestCourses, isLoading: newestLoading } = useFeaturedCourses("top_courses");

  const userName = user?.profile?.full_name || "Learner";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Native App Header - Purple Gradient */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-500 to-violet-400 px-4 pt-10 pb-6 rounded-b-[1.5rem]">
        {/* Top Row - Menu, Greeting & Icons */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 mt-1"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white text-lg font-bold">
                  {userLoading ? (
                    <Skeleton className="h-5 w-28 bg-white/20" />
                  ) : (
                    `Hi ${userName.split(' ')[0]}`
                  )}
                </h1>
                <span className="text-xl">👋</span>
              </div>
              {!userLoading && (
                <p className="text-white/80 text-sm">Let's start learning!</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 h-9 w-9 rounded-full bg-white/10"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-white hover:bg-white/10 h-9 w-9 rounded-full bg-white/10"
              onClick={() => navigate("/dashboard")}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="What are you going to find?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-white border-0 rounded-full shadow-lg text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>
      </div>

      {/* Featured Courses Section */}
      <div className="px-4 mt-5">
        <h2 className="text-base font-bold text-foreground mb-3">Featured Courses</h2>

        {/* Featured Course Card - Large */}
        {coursesLoading ? (
          <Card className="overflow-hidden">
            <Skeleton className="h-44 w-full" />
            <CardContent className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ) : featuredCourses?.[0]?.courses && (
          <Card 
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99] border-0 shadow-md"
            onClick={() => navigate(`/enroll/${featuredCourses[0].courses?.slug}`)}
          >
            {/* Course Image with Price Badge */}
            <div className="relative h-44 w-full bg-muted">
              <img
                src={featuredCourses[0].courses?.thumbnail_url || "/placeholder.svg"}
                alt={featuredCourses[0].courses?.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-violet-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {formatINR(featuredCourses[0].courses?.price_inr || 0)}
              </div>
            </div>

            {/* Course Info */}
            <CardContent className="p-3">
              <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
                {featuredCourses[0].courses?.name}
              </h3>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-3.5 w-3.5 ${star <= (featuredCourses[0].courses?.rating || 4) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>

              {/* Instructor & Duration */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] bg-muted">
                      {featuredCourses[0].courses?.instructor_name?.charAt(0) || "I"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{featuredCourses[0].courses?.instructor_name || "Instructor"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{featuredCourses[0].courses?.duration_months || 2} Months</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Newest Courses Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Newest Courses</h2>
          <Button 
            variant="ghost" 
            className="text-violet-500 text-xs p-0 h-auto hover:bg-transparent font-medium"
            onClick={() => navigate("/programs")}
          >
            View All
          </Button>
        </div>

        {/* Horizontal Scrolling Course Cards */}
        <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4">
          <div className="flex gap-3 pb-2">
            {newestLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="w-40 flex-shrink-0">
                  <Skeleton className="h-24 w-full rounded-t-lg" />
                  <CardContent className="p-2 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : (
              newestCourses?.slice(0, 6).map((featured) => {
                const course = featured.courses;
                if (!course) return null;
                
                return (
                  <Card 
                    key={featured.id}
                    className="w-40 flex-shrink-0 overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] border-0 shadow-sm"
                    onClick={() => navigate(`/enroll/${course.slug}`)}
                  >
                    {/* Course Image with Rating Badge */}
                    <div className="relative h-24 w-full bg-muted">
                      <img
                        src={course.thumbnail_url || "/placeholder.svg"}
                        alt={course.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        {course.rating?.toFixed(1) || "4.5"}
                      </div>
                    </div>

                    {/* Course Info */}
                    <CardContent className="p-2">
                      <h3 className="font-medium text-foreground text-xs line-clamp-2 leading-tight whitespace-normal">
                        {course.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {course.instructor_name || "Expert Instructor"}
                      </p>
                      <p className="text-xs font-bold text-violet-600 mt-1">
                        {formatINR(course.price_inr || 0)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Popular Courses Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Popular Courses</h2>
          <Button 
            variant="ghost" 
            className="text-violet-500 text-xs p-0 h-auto hover:bg-transparent font-medium"
            onClick={() => navigate("/programs")}
          >
            View All
          </Button>
        </div>

        {/* Course List */}
        <div className="space-y-3">
          {coursesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="flex gap-3 p-2">
                  <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            featuredCourses?.slice(1, 5).map((featured) => {
              const course = featured.courses;
              if (!course) return null;
              
              return (
                <Card 
                  key={featured.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] border-0 shadow-sm"
                  onClick={() => navigate(`/enroll/${course.slug}`)}
                >
                  <div className="flex gap-3 p-2">
                    {/* Course Image */}
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={course.thumbnail_url || "/placeholder.svg"}
                        alt={course.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-black/60 text-white px-1 py-0.5 rounded text-[9px] font-medium flex items-center gap-0.5">
                        <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                        {course.rating?.toFixed(1) || "4.5"}
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h3 className="font-medium text-foreground line-clamp-2 text-xs leading-tight">
                          {course.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {course.instructor_name || "Expert Instructor"}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-violet-600 text-sm">
                          {formatINR(course.price_inr || 0)}
                        </span>
                        {course.original_price_inr && course.original_price_inr > (course.price_inr || 0) && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {formatINR(course.original_price_inr)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
