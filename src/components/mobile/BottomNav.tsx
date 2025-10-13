import { Link, useLocation } from "react-router-dom";
import { BookOpen, User, Compass, LayoutDashboard, ClipboardCheck } from "lucide-react";

const navItems = [
  { icon: Compass, label: "Explore", path: "/mobile/explore" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/mobile/dashboard" },
  { icon: BookOpen, label: "My Learning", path: "/mobile/my-learning" },
  { icon: ClipboardCheck, label: "Assignments", path: "/mobile/my-assignments" },
  { icon: User, label: "Profile", path: "/mobile/profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
