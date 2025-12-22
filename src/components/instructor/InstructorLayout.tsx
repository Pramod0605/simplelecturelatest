import { Outlet } from "react-router-dom";
import { InstructorSidebar } from "./InstructorSidebar";

export const InstructorLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <InstructorSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
