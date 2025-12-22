import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, BookOpen, Home, Calendar, User } from "lucide-react";

const navItems = [
  { icon: LayoutGrid, label: "Browse", path: "/programs" },
  { icon: BookOpen, label: "My Class", path: "/mobile/my-learning" },
  { icon: Home, label: "Home", path: "/mobile", isCenter: true },
  { icon: Calendar, label: "Schedule", path: "/mobile/dashboard" },
  { icon: User, label: "Profile", path: "/mobile/profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 md:hidden shadow-lg">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map(({ icon: Icon, label, path, isCenter }) => {
          const isActive = location.pathname === path || 
            (path === "/mobile" && location.pathname === "/mobile");
          
          if (isCenter) {
            return (
              <Link
                key={path}
                to={path}
                className="relative -mt-6"
              >
                <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isActive 
                    ? "bg-violet-500" 
                    : "bg-violet-500 hover:bg-violet-600"
                }`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </Link>
            );
          }
          
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[50px] transition-all ${
                isActive
                  ? "text-violet-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
              <span className={`text-[10px] mt-1 ${isActive ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
