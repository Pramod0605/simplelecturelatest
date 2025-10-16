import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEO';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StudentIDCard } from '@/components/dashboard/StudentIDCard';
import { SubjectProgressTable } from '@/components/dashboard/SubjectProgressTable';
import { UpcomingClasses } from '@/components/dashboard/UpcomingClasses';
import { AssignmentsList } from '@/components/dashboard/AssignmentsList';
import { InstructorsList } from '@/components/dashboard/InstructorsList';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BatchInfoCard } from '@/components/dashboard/BatchInfoCard';
import { Footer } from '@/components/Footer';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <>
      <SEOHead title="My Dashboard | SimpleLecture" description="Your learning dashboard" />
      <div className="min-h-screen bg-background">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* View Detailed Progress Button */}
          <Link to="/student-dashboard">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg font-semibold shadow-lg">
              View My Detailed Progress
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          {/* Full-width Student ID Card */}
          <StudentIDCard />

          {/* Main Content: 4-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Subject Progress (narrow) */}
            <div className="lg:col-span-2">
              <SubjectProgressTable />
            </div>

            {/* Column 2: Upcoming Classes (medium) */}
            <div className="lg:col-span-3">
              <UpcomingClasses />
            </div>

            {/* Column 3: Homework/Assignments (medium) */}
            <div className="lg:col-span-4">
              <AssignmentsList />
            </div>

          {/* Column 4: Instructors (narrow) */}
            <div className="lg:col-span-3">
              <InstructorsList />
            </div>
          </div>

          {/* Batch Info Card */}
          <BatchInfoCard />

          {/* DPT section is now integrated into StudentIDCard */}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
