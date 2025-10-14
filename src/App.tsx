import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MobileHome from "./pages/MobileHome";
import MobilePrograms from "./pages/mobile/MobilePrograms";
import MobileProgramDetail from "./pages/mobile/MobileProgramDetail";
import MobileDashboard from "./pages/mobile/MobileDashboard";
import MobileMyAssignments from "./pages/mobile/MobileMyAssignments";
import MobileExplore from "./pages/mobile/MobileExplore";
import MobileProfile from "./pages/mobile/MobileProfile";
import MobileMyLearning from "./pages/mobile/MobileMyLearning";
import Implementation from "./pages/Implementation";

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/programs/:programId" element={<ProgramDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mobile-home" element={<MobileHome />} />
            <Route path="/mobile/programs" element={<MobilePrograms />} />
            <Route path="/mobile/programs/:programId" element={<MobileProgramDetail />} />
            <Route path="/mobile/dashboard" element={<MobileDashboard />} />
            <Route path="/mobile/my-assignments" element={<MobileMyAssignments />} />
            <Route path="/mobile/explore" element={<MobileExplore />} />
            <Route path="/mobile/profile" element={<MobileProfile />} />
            <Route path="/mobile/my-learning" element={<MobileMyLearning />} />
            <Route path="/implementation" element={<Implementation />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
