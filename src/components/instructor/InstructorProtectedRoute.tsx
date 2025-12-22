import { Navigate, Outlet } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useCurrentAuthUser } from "@/hooks/useCurrentAuthUser";
import { Loader2 } from "lucide-react";

export const InstructorProtectedRoute = () => {
  const { data: authUser, isLoading: authLoading } = useCurrentAuthUser();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/auth" replace />;
  }

  // Allow teachers and admins to access instructor panel
  if (userRole !== "teacher" && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
