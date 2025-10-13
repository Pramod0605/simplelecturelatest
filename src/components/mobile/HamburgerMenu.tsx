import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, LayoutDashboard, BookOpen, Compass, Trophy, FileText, User, LogOut, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { icon: Home, label: "Home", path: "/", requiresAuth: false },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", requiresAuth: true },
  { icon: BookOpen, label: "My Programs", path: "/my-programs", requiresAuth: true },
  { icon: Compass, label: "Browse Programs", path: "/programs", requiresAuth: false },
  { icon: Trophy, label: "IRE", path: "/ire", requiresAuth: false },
  { icon: FileText, label: "Assignments", path: "/assignments", requiresAuth: true },
  { icon: User, label: "Profile", path: "/profile", requiresAuth: true },
];

export const HamburgerMenu = () => {
  const isAuthenticated = false; // TODO: Connect to auth state

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
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">John Doe</p>
                  <p className="text-sm text-muted-foreground">john@example.com</p>
                </div>
              </>
            ) : (
              <Link to="/signup" className="w-full">
                <Button className="w-full">Login / Sign Up</Button>
              </Link>
            )}
          </div>
        </SheetHeader>
        
        <Separator className="my-4" />
        
        <nav className="flex flex-col gap-1">
          {menuItems.map(({ icon: Icon, label, path, requiresAuth }) => (
            <Link key={path} to={path}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11"
                disabled={requiresAuth && !isAuthenticated}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
                {requiresAuth && !isAuthenticated && (
                  <Lock className="h-4 w-4 ml-auto text-muted-foreground" />
                )}
              </Button>
            </Link>
          ))}
          
          {isAuthenticated && (
            <>
              <Separator className="my-2" />
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </>
          )}
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
