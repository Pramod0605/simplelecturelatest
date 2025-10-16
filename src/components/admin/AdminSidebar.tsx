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
  LogOut,
  Flame,
  ChevronRight,
  UserCheck,
  UserCircle,
  UsersRound,
  ShieldCheck,
  Calendar,
  HelpCircle,
  FileText,
  Building2,
  UserPlus,
  CalendarDays,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const [openCategories, setOpenCategories] = useState(true);
  const [openPrograms, setOpenPrograms] = useState(false);
  const [openUsers, setOpenUsers] = useState(false);
  const [openHR, setOpenHR] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border bg-background">
        <h1 className="text-xl font-bold tracking-tight text-foreground">SIMPLE LECTURE</h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )
          }
        >
          <Flame className="h-4 w-4" />
          <span>Dashboard</span>
        </NavLink>

        {/* Manage Category */}
        <Collapsible open={openCategories} onOpenChange={setOpenCategories}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-md hover:bg-sidebar-accent/50 text-sm font-medium text-sidebar-foreground transition-all group">
            <div className="flex items-center gap-3">
              <FolderTree className="h-4 w-4" />
              <span>Manage Category</span>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-transform", openCategories && "rotate-90")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1 ml-7 pl-3 border-l border-sidebar-border">
            <NavLink
              to="/admin/categories"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Categories
            </NavLink>
            <NavLink
              to="/admin/explore-by-goal"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Explore by Goal
            </NavLink>
          </CollapsibleContent>
        </Collapsible>

        {/* Manage Programs */}
        <Collapsible open={openPrograms} onOpenChange={setOpenPrograms}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-md hover:bg-sidebar-accent/50 text-sm font-medium text-sidebar-foreground transition-all">
            <div className="flex items-center gap-3">
              <BookMarked className="h-4 w-4" />
              <span>Manage Programs</span>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-transform", openPrograms && "rotate-90")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1 ml-7 pl-3 border-l border-sidebar-border">
            <NavLink
              to="/admin/courses"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Courses
            </NavLink>
            <NavLink
              to="/admin/popular-subjects"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Subjects
            </NavLink>
            <NavLink
              to="/admin/question-bank"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Question Bank
            </NavLink>
            <NavLink
              to="/admin/assignments"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Assignments
            </NavLink>
          </CollapsibleContent>
        </Collapsible>

        {/* Enrollments */}
        <Collapsible open={openUsers} onOpenChange={setOpenUsers}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-md hover:bg-sidebar-accent/50 text-sm font-medium text-sidebar-foreground transition-all">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              <span>Enrollments</span>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-transform", openUsers && "rotate-90")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1 ml-7 pl-3 border-l border-sidebar-border">
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Student Management
            </NavLink>
            <NavLink
              to="/admin/batches"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Batches
            </NavLink>
            <NavLink
              to="/admin/parents"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Parents
            </NavLink>
            <NavLink
              to="/admin/instructors"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Instructors
            </NavLink>
            <NavLink
              to="/admin/staff"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Staff
            </NavLink>
          </CollapsibleContent>
        </Collapsible>

        {/* Human Resource */}
        <Collapsible open={openHR} onOpenChange={setOpenHR}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-md hover:bg-sidebar-accent/50 text-sm font-medium text-sidebar-foreground transition-all">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4" />
              <span>Human Resource</span>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-transform", openHR && "rotate-90")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1 ml-7 pl-3 border-l border-sidebar-border">
            <NavLink
              to="/admin/hr/instructors"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Manage Instructors
            </NavLink>
            <NavLink
              to="/admin/hr/departments"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Departments
            </NavLink>
            <NavLink
              to="/admin/hr/timetable"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Timetable
            </NavLink>
            <NavLink
              to="/admin/hr/live-classes"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              Manage Live Classes
            </NavLink>
          </CollapsibleContent>
        </Collapsible>

        {/* Manage Academics */}
        <NavLink
          to="/admin/academics"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )
          }
        >
          <Calendar className="h-4 w-4" />
          <span>Manage Academics</span>
        </NavLink>

        {/* Documentation */}
        <NavLink
          to="/admin/settings/documentation"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )
          }
        >
          <HelpCircle className="h-4 w-4" />
          <span>Documentation</span>
        </NavLink>

        {/* Settings */}
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )
          }
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};
