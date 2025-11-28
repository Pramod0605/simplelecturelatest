import { Button } from "@/components/ui/button";
import { Menu, Search, ChevronDown, Bell, User, LogOut, LayoutDashboard, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MegaMenu } from "@/components/MegaMenu";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/website-logo.png";

const categories = [
  "Generative AI",
  "AI & Machine Learning",
  "Data Science & Business Analytics",
  "Project Management",
  "Cyber Security",
  "Agile and Scrum",
  "Cloud Computing & DevOps",
  "Business and Leadership",
  "Software Development",
  "Product and Design",
  "IT Service and Architecture",
];

const programs = [
  {
    id: 1,
    title: "Applied Generative AI Specialization",
    institution: "PURDUE UNIVERSITY",
    duration: "16 Weeks",
    badge: "Trending Now",
    category: "Generative AI",
  },
  {
    id: 2,
    title: "Generative AI for Business Transformation",
    institution: "PURDUE UNIVERSITY",
    duration: "12 Weeks",
    category: "Generative AI",
  },
  {
    id: 3,
    title: "Professional Certificate Program in Generative AI and Machine Learning - IITG",
    institution: "E&ICT Academy IIT Guwahati",
    duration: "11 Months",
    badge: "Most Popular",
    category: "AI & Machine Learning",
  },
  {
    id: 4,
    title: "Professional Certificate Course in Generative AI and Machine Learning",
    institution: "E&ICT Academy, IT Kanpur",
    duration: "11 Months",
    category: "AI & Machine Learning",
  },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Courses");
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();

  const filteredPrograms = selectedCategory === "All Courses" 
    ? programs 
    : programs.filter(p => p.category === selectedCategory);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();
          
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        
        setUserProfile(profile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getUserInitials = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="SimpleLecture" className="h-10 object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-4xl">
            <MegaMenu />

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="What do you want to learn?"
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          {/* Desktop Right Menu */}
          <nav className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/cart">
                    <ShoppingCart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block">
                        {userProfile?.full_name || user.email}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{userProfile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-courses" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        My Courses
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-1">
                      More <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <div className="p-2 space-y-1">
                      <a href="#how-it-works" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">How it works</a>
                      <a href="#contact" className="block px-3 py-2 text-sm hover:bg-muted rounded-md">Contact</a>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link to="/auth?tab=login">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    Login
                  </Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="What do you want to learn?"
                  className="pl-10"
                />
              </div>
              
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{userProfile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/my-courses" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                    My Courses
                  </Link>
                  <Link to="/cart" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Cart
                  </Link>
                  <Button variant="destructive" onClick={handleLogout} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                    How it works
                  </a>
                  <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
                    Contact
                  </a>
                  <div className="flex gap-2 pt-4">
                    <Link to="/auth?tab=login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-primary text-primary">
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth?tab=signup" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
