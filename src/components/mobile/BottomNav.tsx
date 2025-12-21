import { Link, useLocation } from "react-router-dom";
import { Home, GraduationCap, Heart, Settings } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/mobile" },
  { icon: GraduationCap, label: "My Class", path: "/mobile/my-learning" },
  { icon: Heart, label: "Wishlist", path: "/mobile/my-courses" },
  { icon: Settings, label: "Setting", path: "/mobile/profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || 
            (path === "/mobile" && location.pathname === "/mobile");
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[60px] transition-all ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
