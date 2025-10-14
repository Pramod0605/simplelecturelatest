import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { StudentIDCard } from '@/components/dashboard/StudentIDCard';
import { NoticeBoard } from '@/components/dashboard/NoticeBoard';
import { SubjectProgressTable } from '@/components/dashboard/SubjectProgressTable';
import { UpcomingClasses } from '@/components/dashboard/UpcomingClasses';
import { AssignmentsList } from '@/components/dashboard/AssignmentsList';
import { DPTCard } from '@/components/dashboard/DPTCard';
import { TeachersList } from '@/components/dashboard/TeachersList';

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
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">My Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 space-y-6">
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

            {/* Column 4: Notice Board (narrow) */}
            <div className="lg:col-span-3">
              <NoticeBoard />
            </div>
          </div>

          {/* Full-width DPT Statistics */}
          <DPTCard />

          {/* Full-width Teachers Section */}
          <TeachersList />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
