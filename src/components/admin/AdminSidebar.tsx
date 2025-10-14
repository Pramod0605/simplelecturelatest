import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FolderTree, 
  Target, 
  BookOpen, 
  BookMarked,
  GraduationCap,
  Users,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: FolderTree, label: "Categories", path: "/admin/categories" },
  { icon: Target, label: "Explore by Goal", path: "/admin/explore-by-goal" },
  { icon: BookOpen, label: "Popular Subjects", path: "/admin/popular-subjects" },
  { icon: BookMarked, label: "Programs", path: "/admin/programs" },
  { icon: GraduationCap, label: "Courses", path: "/admin/courses" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">SimpleLecture</h1>
        <p className="text-sm text-muted-foreground">Admin Panel</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};
