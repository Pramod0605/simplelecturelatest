import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, LayoutDashboard, BookOpen, Video, FileText, Trophy, MessageSquare, HelpCircle, User, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/mobile/dashboard" },
  { icon: BookOpen, label: "My Courses", path: "/mobile/my-courses" },
  { icon: Video, label: "Live Classes", path: "/mobile/live" },
  { icon: FileText, label: "My Assignments", path: "/mobile/my-assignments" },
  { icon: Trophy, label: "IRE", path: "/mobile/ire" },
  { icon: MessageSquare, label: "Forum", path: "/mobile/forum" },
  { icon: HelpCircle, label: "Support", path: "/mobile/support" },
  { icon: User, label: "Profile", path: "/mobile/profile" },
];

export const HamburgerMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["mobile-menu-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return { ...data, email: user.email } as { full_name?: string | null; avatar_url?: string | null; email?: string | null };
    },
  });

  const initials = (profile?.full_name || profile?.email || "U").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/mobile");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          {/* User Profile Section */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{profile?.full_name || "Student"}</p>
              <p className="text-sm text-muted-foreground">{profile?.email || "student@example.com"}</p>
            </div>
          </div>
        </SheetHeader>
        
        <Separator className="my-4" />
        
        <nav className="flex flex-col gap-1">
          {menuItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link key={path} to={path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-3 h-11"
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Button>
              </Link>
            );
          })}
          
          <Separator className="my-2" />
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-11 text-destructive border-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </nav>
        
        <div className="absolute bottom-4 left-6 right-6">
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground text-center">
            SimpleLecture v1.0.0
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
