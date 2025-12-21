import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Bell, 
  Briefcase, 
  Palette, 
  DollarSign, 
  TrendingUp, 
  Code, 
  BookOpen,
  ChevronRight,
  GraduationCap,
  Beaker
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useExploreByGoalPublic } from "@/hooks/useExploreByGoalPublic";
import { useFeaturedCourses } from "@/hooks/useFeaturedCourses";
import { formatINR } from "@/lib/utils";

// Icon mapping for explore topics
const iconMap: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase className="h-5 w-5" />,
  Palette: <Palette className="h-5 w-5" />,
  DollarSign: <DollarSign className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Code: <Code className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  Beaker: <Beaker className="h-5 w-5" />,
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const MobileHome = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: exploreGoals, isLoading: goalsLoading } = useExploreByGoalPublic();
  const { data: featuredCourses, isLoading: coursesLoading } = useFeaturedCourses("bestsellers");

  const userName = user?.profile?.full_name || "Learner";
  const userAvatar = user?.profile?.avatar_url;
  const greeting = getGreeting();

  return (
    <>
      <SEOHead
        title="SimpleLecture - Learn Anywhere, Anytime"
        description="Access 1000+ courses on mobile. Learn Data Science, AI, and more with AI tutors."
        keywords="online learning app, mobile courses, AI education"
        canonicalUrl="https://simplelecture.com/mobile-home"
      />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Native App Header */}
        <div className="bg-gradient-to-br from-primary via-primary to-secondary px-5 pt-12 pb-8 rounded-b-[2rem]">
          {/* Top Row - Greeting & Avatar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-primary-foreground/80 text-sm">{greeting}</p>
              <h1 className="text-primary-foreground text-xl font-bold">
                {userLoading ? (
                  <Skeleton className="h-6 w-32 bg-primary-foreground/20" />
                ) : (
                  userName
                )}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/mobile/dashboard")}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <Avatar 
                className="h-10 w-10 ring-2 ring-primary-foreground/30 cursor-pointer"
                onClick={() => navigate("/mobile/profile")}
              >
                <AvatarImage src={userAvatar || ""} alt={userName} />
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="What do you want to learn?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-background border-0 rounded-xl shadow-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Explore Topics Section */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Explore topics</h2>
            <Button 
              variant="ghost" 
              className="text-primary text-sm p-0 h-auto hover:bg-transparent"
              onClick={() => navigate("/programs")}
            >
              See More
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Horizontal Scrolling Topic Pills */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
              {goalsLoading ? (
                // Skeleton loaders
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))
              ) : (
                exploreGoals?.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => navigate(`/explore/${goal.slug}`)}
                    className="flex flex-col items-center gap-2 min-w-[4.5rem] group"
                  >
                    <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {iconMap[goal.icon || "BookOpen"] || <BookOpen className="h-5 w-5" />}
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[4.5rem]">
                      {goal.name}
                    </span>
                  </button>
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {/* Recommended For You Section */}
        <div className="px-5 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recommended for you</h2>
            <Button 
              variant="ghost" 
              className="text-primary text-sm p-0 h-auto hover:bg-transparent"
              onClick={() => navigate("/programs")}
            >
              See More
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Course Cards */}
          <div className="space-y-4">
            {coursesLoading ? (
              // Skeleton loaders
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="flex gap-4 p-3">
                    <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              featuredCourses?.slice(0, 6).map((featured) => {
                const course = featured.courses;
                if (!course) return null;
                
                return (
                  <Card 
                    key={featured.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                    onClick={() => navigate(`/enroll/${course.slug}`)}
                  >
                    <div className="flex gap-4 p-3">
                      {/* Course Image */}
                      <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={course.thumbnail_url || "/placeholder.svg"}
                          alt={course.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-medium text-foreground line-clamp-2 text-sm leading-tight">
                            {course.name}
                          </h3>
                          {course.instructor_name && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[8px] bg-muted">
                                  {course.instructor_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {course.instructor_name}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">
                              {formatINR(course.price_inr || 0)}
                            </span>
                            {course.original_price_inr && course.original_price_inr > (course.price_inr || 0) && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatINR(course.original_price_inr)}
                              </span>
                            )}
                          </div>
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

      <BottomNav />
    </>
  );
};

export default MobileHome;
