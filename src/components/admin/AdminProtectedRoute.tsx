import { Navigate, Outlet } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

export const AdminProtectedRoute = () => {
  const { data: userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
