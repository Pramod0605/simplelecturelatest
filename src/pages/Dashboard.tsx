import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEO';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StudentIDCard } from '@/components/dashboard/StudentIDCard';
import { SubjectProgressTable } from '@/components/dashboard/SubjectProgressTable';
import UpcomingClasses from '@/components/dashboard/UpcomingClasses';
import AssignmentsList from '@/components/dashboard/AssignmentsList';
import InstructorsList from '@/components/dashboard/InstructorsList';
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
          <div className="mb-6">
            <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg font-semibold shadow-lg">
              <Link to="/student-dashboard">
                View My Detailed Progress
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Full-width Student ID Card */}
          <StudentIDCard />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SubjectProgressTable />
            </div>
            <div className="space-y-6">
              <UpcomingClasses />
              <AssignmentsList />
            </div>
          </div>

          {/* Horizontal Instructors List */}
          <InstructorsList />

          {/* Batch Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BatchInfoCard />
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
