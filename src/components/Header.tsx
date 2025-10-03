import { Button } from "@/components/ui/button";
import { BookOpen, Menu, Search } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">SimpleLecture</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Programs
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Courses
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Instructors
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="outline" className="hidden md:flex">
              Login
            </Button>
            <Button className="hidden md:flex">
              Register
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Programs
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Courses
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Instructors
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </a>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  Login
                </Button>
                <Button className="flex-1">
                  Register
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
