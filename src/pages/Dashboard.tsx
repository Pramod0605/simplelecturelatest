import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, TrendingUp, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEOHead } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { StudentIDCard } from '@/components/dashboard/StudentIDCard';
import { NoticeBoard } from '@/components/dashboard/NoticeBoard';
import { SubjectProgressTable } from '@/components/dashboard/SubjectProgressTable';
import { UpcomingClasses } from '@/components/dashboard/UpcomingClasses';
import { AssignmentsList } from '@/components/dashboard/AssignmentsList';
import { DPTCard } from '@/components/dashboard/DPTCard';
import { CompletionGraph } from '@/components/dashboard/CompletionGraph';
import { TeachersList } from '@/components/dashboard/TeachersList';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDPT } from '@/hooks/useDPT';

const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();
  const { streak } = useDPT();

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
          {/* Student ID Card with Profile */}
          <StudentIDCard />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Courses Enrolled</p>
                  <p className="text-2xl font-bold">{stats.enrolledCourses}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-950/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chapters Done</p>
                  <p className="text-2xl font-bold">{stats.completedChapters}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-950/20 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours Studied</p>
                  <p className="text-2xl font-bold">{stats.totalHours}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-950/20 rounded-lg">
                  <Award className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                  <p className="text-2xl font-bold">{streak}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <NoticeBoard />
              <SubjectProgressTable />
              <CompletionGraph />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <DPTCard />
              <UpcomingClasses />
              <AssignmentsList />
              <TeachersList />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
