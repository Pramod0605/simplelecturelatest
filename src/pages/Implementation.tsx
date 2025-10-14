import { SEOHead } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Database } from "lucide-react";

const Implementation = () => {
  return (
    <>
      <SEOHead
        title="Implementation Guide - SimpleLecture"
        description="Complete implementation guide for SimpleLecture mobile app UI and backend integration"
        keywords="implementation, development guide, mobile app, backend integration"
        canonicalUrl="https://simplelecture.com/implementation"
      />
      <Header />
      
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">Implementation Guide</h1>
            <p className="text-lg text-muted-foreground">
              Step-by-step prompts organized by feature area. Copy each prompt to build the SimpleLecture platform.
            </p>
          </div>

          <Tabs defaultValue="mobile-ui" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="mobile-ui" className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Mobile App UI Design
              </TabsTrigger>
              <TabsTrigger value="backend" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Backend & Database
              </TabsTrigger>
            </TabsList>

            {/* MOBILE UI DESIGN TAB */}
            <TabsContent value="mobile-ui" className="space-y-6">
              <Tabs defaultValue="auth" className="w-full">
                <TabsList className="w-full flex flex-wrap gap-2 h-auto bg-muted/50 p-2">
                  <TabsTrigger value="auth">1. Authentication</TabsTrigger>
                  <TabsTrigger value="navigation">2. Navigation</TabsTrigger>
                  <TabsTrigger value="discovery">3. Home & Discovery</TabsTrigger>
                  <TabsTrigger value="learning">4. Learning Pages</TabsTrigger>
                  <TabsTrigger value="profile">5. Profile</TabsTrigger>
                  <TabsTrigger value="dashboard">6. Dashboard</TabsTrigger>
                </TabsList>

                {/* AUTH SCREENS */}
                <TabsContent value="auth" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 1: Mobile Login Screen</CardTitle>
                      <CardDescription>Create mobile login with email/password and Google sign-in</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Create mobile login screen at /mobile/login with:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>SimpleLecture logo at top</li>
                          <li>Email input with icon</li>
                          <li>Password with show/hide toggle</li>
                          <li>Remember me checkbox</li>
                          <li>Forgot Password link</li>
                          <li>Login button (full-width, primary)</li>
                          <li>Google sign-in button</li>
                          <li>Sign up link at bottom</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 2: Mobile Sign Up Screen</CardTitle>
                      <CardDescription>Registration with password strength meter</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Create sign-up at /mobile/signup with fields:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Full Name (required)</li>
                          <li>Email (validated)</li>
                          <li>Phone (+91 prefix, 10 digits)</li>
                          <li>Password with strength meter (weak/medium/strong bars)</li>
                          <li>Confirm Password</li>
                          <li>Terms checkbox</li>
                          <li>Sign Up button</li>
                          <li>Google sign-up option</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* NAVIGATION */}
                <TabsContent value="navigation" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 3: Bottom Navigation</CardTitle>
                      <CardDescription>5-tab bottom nav with icons and labels</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Update BottomNav with 5 tabs:</p>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>Explore (Compass icon) → /mobile/explore</li>
                          <li>Dashboard (LayoutDashboard) → /mobile/dashboard</li>
                          <li>My Learning (BookOpen) → /mobile/my-learning</li>
                          <li>My Assignments (ClipboardCheck) → /mobile/my-assignments</li>
                          <li>Profile (User) → /mobile/profile</li>
                        </ol>
                        <p className="mt-3">Active state: primary color, inactive: muted. Height: 64px with safe area padding.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 4: Top Bar Component</CardTitle>
                      <CardDescription>Reusable app bar with menu and notification</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Create TopBar component with:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Left: Hamburger menu icon</li>
                          <li>Center: Page title or badge</li>
                          <li>Right: Notification bell (with red dot if unread)</li>
                          <li>Sticky top, backdrop blur</li>
                          <li>Props: title, showBadge, notificationCount</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 5: Hamburger Drawer Menu</CardTitle>
                      <CardDescription>Side navigation with user info</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Update HamburgerMenu drawer:</p>
                        <p>Top: User avatar, name, email, View Profile link</p>
                        <p>Menu items: My Courses, Assignments, Certificates, Settings, Help, About, Logout</p>
                        <p>If not logged in: Show Login/Sign Up buttons</p>
                        <p>Slides from left, 80% width (max 320px), smooth animation</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* HOME & DISCOVERY */}
                <TabsContent value="discovery" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 6: Mobile Home Page</CardTitle>
                      <CardDescription>Home with hero carousel and filters</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Update /mobile-home with:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Top Bar: Hamburger, Category badge, Notification bell</li>
                          <li>Search bar with Study button</li>
                          <li>Hero Carousel: Same as desktop (hero image + gradient), auto-scroll 5s</li>
                          <li>Filter tabs: All, Paper-1, Commerce, Science (horizontal scroll)</li>
                          <li>Course cards (1-column): image, title, instructor, price (₹), badge</li>
                          <li>Bottom nav for navigation</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 7: Explore (Categories)</CardTitle>
                      <CardDescription>Category grid with subcategory sheets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Update /mobile/explore with:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>2-column category grid</li>
                          <li>Each card: Icon (48px), name, course count, gradient bg</li>
                          <li>Tap opens bottom sheet with subcategories</li>
                          <li>Subcategory list navigates to /mobile/programs?category=slug</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 8: Dashboard Page</CardTitle>
                      <CardDescription>Overview with stats and quick actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Create /mobile/dashboard with:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Welcome banner with streak (🔥 5 days)</li>
                          <li>Stats grid (2x2): Courses in Progress, Hours This Week, Upcoming Assignments, Streak</li>
                          <li>Continue Learning carousel (last accessed courses)</li>
                          <li>Upcoming Live Classes list</li>
                          <li>Weekly activity bar chart</li>
                          <li>Recommendations section</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* LEARNING PAGES */}
                <TabsContent value="learning" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 9: My Learning Page</CardTitle>
                      <CardDescription>Enrolled courses with tabs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Update /mobile/my-learning with tabs:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>In Progress: Cards with progress bar, Continue button</li>
                          <li>Completed: Cards with View Certificate button</li>
                          <li>Saved/Wishlist: Cards with Enroll Now button</li>
                          <li>Empty state: No courses yet with Explore CTA</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 10: My Assignments</CardTitle>
                      <CardDescription>Assignment list with status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Update /mobile/my-assignments:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Filter tabs: All, Pending, Submitted, Graded</li>
                          <li>Cards: Title, course, due date (red if &lt;24h), status badge</li>
                          <li>Submit button for pending, View Details for submitted</li>
                          <li>Graded: Show score prominently</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 11: Programs List</CardTitle>
                      <CardDescription>2-column grid with filters</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Update /mobile/programs:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Top: Back, Category name, Cart</li>
                          <li>Filter bar: Options, Filters, Grid toggle</li>
                          <li>2-column grid: circular icon, title, instructor, duration, price (₹), rating badge</li>
                          <li>Filters sheet: Price range, Duration, Level, Language</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 12: Program Detail</CardTitle>
                      <CardDescription>Detailed view with 5 tabs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Update /mobile/programs/:programId with:</p>
                        <p><strong>Header:</strong> Back, Share, Thumbnail with play button</p>
                        <p><strong>5 Tabs:</strong></p>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>Information: Description, prerequisites, FAQs</li>
                          <li>Content: List of subjects/courses</li>
                          <li>Content Detail: Hierarchical chapters/topics/videos</li>
                          <li>Reviews: Student reviews with ratings</li>
                          <li>Comments: Q&A section</li>
                        </ol>
                        <p><strong>Sticky CTA:</strong> Price + Enroll Now button</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* PROFILE */}
                <TabsContent value="profile" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 13: Profile Page</CardTitle>
                      <CardDescription>User profile with stats</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Update /mobile/profile:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Header: Cover image, avatar (100px), name, email</li>
                          <li>Stats: Courses Enrolled, Certificates, Hours, Streak</li>
                          <li>Menu sections: Learning, Account, Support</li>
                          <li>Items: Certificates, Payments, Settings, Help, About, Logout</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 14: Settings Page</CardTitle>
                      <CardDescription>App preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Create /mobile/settings with sections:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Notifications: Push, Email, Reminders (toggles)</li>
                          <li>Preferences: Language, Theme, Video Quality, Auto-play</li>
                          <li>Privacy: Profile visibility, Activity, Analytics</li>
                          <li>Storage: Downloaded courses size, Clear cache</li>
                          <li>Account: Delete account (with confirmation)</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DASHBOARD ENHANCEMENT */}
                <TabsContent value="dashboard" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 15: Desktop Dashboard Redesign</CardTitle>
                      <CardDescription>4-column layout with Student ID card</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Redesign /dashboard with:</p>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>Full-width Student ID Card: Avatar (left), profile info (center), QR + Barcode (right)</li>
                          <li>4-Column Grid: Subject Progress (narrow) | Upcoming Classes (medium) | Assignments (medium) | Notice Board (narrow)</li>
                          <li>Full-width DPT Section: Streak, average score, weekly graph, Take DPT button</li>
                          <li>Full-width Teachers Grid: Cards with avatar, name, subjects, contact info</li>
                        </ol>
                        <p>Install react-barcode for barcode generation.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 16: Mobile Dashboard Complete Redesign</CardTitle>
                      <CardDescription>Comprehensive mobile dashboard with all features</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Redesign /mobile/dashboard with MobileLayout wrapper:</p>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>Quick Stats: 2x2 grid (Courses, Hours, Assignments, Streak)</li>
                          <li>Live Classes: Banner with JOIN NOW button for ongoing classes</li>
                          <li>Class Timetable: Today/Tomorrow/Week tabs with current class highlighted</li>
                          <li>My Courses: Expandable cards with progress, subjects, last accessed</li>
                          <li>Subject Progress: Colored bars, Continue Learning button</li>
                          <li>Assignments: Filter tabs (All/Pending/Submitted/Graded), days remaining</li>
                          <li>DPT: Weekly calendar, streak, Take DPT button</li>
                          <li>Teachers: Avatar grid with quick actions</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* BACKEND & DATABASE TAB */}
            <TabsContent value="backend" className="space-y-6">
              <Tabs defaultValue="auth-setup" className="w-full">
                <TabsList className="w-full flex flex-wrap gap-2 h-auto bg-muted/50 p-2">
                  <TabsTrigger value="auth-setup">1. Authentication</TabsTrigger>
                  <TabsTrigger value="data-fetch">2. Data Fetching</TabsTrigger>
                  <TabsTrigger value="user-progress">3. User Progress</TabsTrigger>
                  <TabsTrigger value="ai-features">4. AI Features</TabsTrigger>
                  <TabsTrigger value="scalability">5. Scalability</TabsTrigger>
                </TabsList>

                {/* AUTHENTICATION */}
                <TabsContent value="auth-setup" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 1: Supabase Auth Setup</CardTitle>
                      <CardDescription>Configure authentication with email and Google</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Create src/lib/auth.ts:

export const signUp = async (email, password, fullName, phone) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone }
    }
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/mobile-home' }
  });
  if (error) throw error;
  return data;
};`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 2: Auth Context & Protected Routes</CardTitle>
                      <CardDescription>Create auth state management</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Create src/contexts/AuthContext.tsx:

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>
    {children}
  </AuthContext.Provider>;
};

// Wrap App with AuthProvider in main.tsx`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 3: Review RLS Policies</CardTitle>
                      <CardDescription>Ensure database security</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p>Run Supabase linter to check RLS policies on:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>profiles (users can only see/update their own)</li>
                          <li>enrollments (students see their enrollments)</li>
                          <li>student_progress (user-specific)</li>
                          <li>assignments & submissions (user-specific)</li>
                          <li>certificates (user-specific)</li>
                        </ul>
                        <p className="mt-3">Fix all critical and high-priority security issues</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DATA FETCHING */}
                <TabsContent value="data-fetch" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 4: Fetch Programs with Filters</CardTitle>
                      <CardDescription>Create usePrograms hook</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Create src/hooks/usePrograms.ts:

export const usePrograms = (filters) => {
  return useQuery({
    queryKey: ['programs', filters],
    queryFn: async () => {
      let query = supabase.from('programs')
        .select('*, instructors(*), categories(*)');
      
      if (filters?.category) query = query.eq('category_id', filters.category);
      if (filters?.level) query = query.eq('level', filters.level);
      if (filters?.minPrice) query = query.gte('price', filters.minPrice);
      if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Usage: const { data: programs, isLoading } = usePrograms({ category: 'ai' });`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 5: Program Detail with Subjects</CardTitle>
                      <CardDescription>Fetch nested program data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Create src/hooks/useProgramDetail.ts:

export const useProgramDetail = (programId) => {
  return useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs')
        .select(\`
          *,
          instructors(*),
          subjects(*, chapters(*, topics(*, subtopics(*))))
        \`)
        .eq('id', programId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });
};

// Check if single subject: program?.subjects?.length === 1`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 6: User Enrollments</CardTitle>
                      <CardDescription>Fetch enrolled programs with progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Create src/hooks/useEnrollments.ts:

export const useEnrollments = (status) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['enrollments', user?.id, status],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('enrollments')
        .select('*, programs(*), student_progress(*)')
        .eq('student_id', user.id);
      
      if (status === 'completed') {
        query = query.eq('completion_status', 100);
      } else if (status === 'in_progress') {
        query = query.lt('completion_status', 100);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 7: User Assignments</CardTitle>
                      <CardDescription>Fetch assignments with submissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Create src/hooks/useAssignments.ts:

export const useAssignments = (status) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['assignments', user?.id, status],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('assignments')
        .select('*, programs(*), submissions(*)')
        .eq('student_id', user.id)
        .order('due_date', { ascending: true });
      
      if (status === 'pending') {
        query = query.is('submissions', null);
      } else if (status === 'submitted') {
        query = query.not('submissions', 'is', null)
                     .is('submissions.grade', null);
      } else if (status === 'graded') {
        query = query.not('submissions.grade', 'is', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};`}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* USER PROGRESS */}
                <TabsContent value="user-progress" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 8: Track Learning Progress</CardTitle>
                      <CardDescription>Update chapter completion</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Create src/lib/progress.ts:

export const markChapterComplete = async (userId, chapterId, programId) => {
  await supabase.from('student_progress').upsert({
    user_id: userId,
    chapter_id: chapterId,
    program_id: programId,
    completed: true,
    completed_at: new Date().toISOString(),
  });
  
  // Update program completion percentage
  await updateProgramCompletion(userId, programId);
};

export const updateWatchTime = async (userId, topicId, seconds) => {
  await supabase.from('watch_history').insert({
    user_id: userId,
    topic_id: topicId,
    watch_time_seconds: seconds,
    watched_at: new Date().toISOString(),
  });
};`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 9: Certificate Generation</CardTitle>
                      <CardDescription>Award certificates on completion</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Create src/lib/certificates.ts:

export const generateCertificate = async (userId, programId) => {
  // Check 100% completion
  const { data: enrollment } = await supabase.from('enrollments')
    .select('completion_status')
    .eq('student_id', userId)
    .eq('program_id', programId)
    .single();
  
  if (enrollment?.completion_status !== 100) {
    throw new Error('Program not yet completed');
  }
  
  const certificateId = crypto.randomUUID();
  
  await supabase.from('certificates').insert({
    id: certificateId,
    user_id: userId,
    program_id: programId,
    issued_at: new Date().toISOString(),
    certificate_url: \`/certificates/\${certificateId}.pdf\`,
  });
  
  return certificateId;
};`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 10: Learning Streaks</CardTitle>
                      <CardDescription>Calculate daily activity streak</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Create src/lib/streaks.ts:

export const calculateStreak = async (userId) => {
  const { data: activities } = await supabase
    .from('learning_activity')
    .select('activity_date')
    .eq('user_id', userId)
    .order('activity_date', { ascending: false });
  
  if (!activities || activities.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const activity of activities) {
    const activityDate = new Date(activity.activity_date);
    activityDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor(
      (currentDate - activityDate) / (1000 * 60 * 60 * 24)
    );
    
    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }
  
  return streak;
};`}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI FEATURES */}
                <TabsContent value="ai-features" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 11: AI Doubt Clearing</CardTitle>
                      <CardDescription>Call edge function for doubt resolution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Update src/lib/api/aiTutor.ts:

export const askDoubt = async (question, context) => {
  const { data, error } = await supabase.functions.invoke('ai-doubt-clear', {
    body: {
      question,
      programId: context.programId,
      chapterId: context.chapterId,
      topicId: context.topicId,
    }
  });
  
  if (error) throw error;
  return data.answer;
};

// Usage in component:
const mutation = useMutation({ mutationFn: askDoubt });
const answer = await mutation.mutateAsync({ question, context });`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 12: AI MCQ Generation</CardTitle>
                      <CardDescription>Generate practice questions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Add to src/lib/api/aiTutor.ts:

export const generateMCQs = async (topicId, count = 10) => {
  const { data, error } = await supabase.functions.invoke('ai-generate-mcqs', {
    body: { topicId, count }
  });
  
  if (error) throw error;
  return data.questions;
};

// Response format:
// [{ question, options: [], correctAnswer: 0, explanation }]`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 13: AI Tutor Chat</CardTitle>
                      <CardDescription>Conversational AI assistant</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Add to src/lib/api/aiTutor.ts:

export const chatWithTutor = async (messages, context) => {
  const { data, error } = await supabase.functions.invoke('ai-tutor-chat', {
    body: { messages, context }
  });
  
  if (error) throw error;
  return data.reply;
};

// Usage:
const [messages, setMessages] = useState([]);

const sendMessage = async (content) => {
  const newMessages = [...messages, { role: 'user', content }];
  setMessages(newMessages);
  
  const reply = await chatWithTutor(newMessages, { programId });
  setMessages([...newMessages, { role: 'assistant', content: reply }]);
};`}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SCALABILITY */}
                <TabsContent value="scalability" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 14: React Query Caching</CardTitle>
                      <CardDescription>Optimize data fetching</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Update src/lib/queryClient.ts:

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Per-query optimization:
useQuery({
  queryKey: ['programs'],
  queryFn: fetchPrograms,
  staleTime: 1000 * 60 * 10, // 10 min for frequently accessed
});`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 15: Database Optimization</CardTitle>
                      <CardDescription>Indexes and materialized views</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Run SQL migration:

-- Add indexes
CREATE INDEX idx_programs_category ON programs(category_id);
CREATE INDEX idx_programs_level ON programs(level);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_progress_user ON student_progress(user_id, program_id);

-- Materialized view for analytics
CREATE MATERIALIZED VIEW student_analytics AS
SELECT 
  user_id,
  COUNT(DISTINCT program_id) as enrolled_courses,
  SUM(watch_time_seconds) as total_watch_time,
  COUNT(DISTINCT CASE WHEN completed = true THEN chapter_id END) as completed_chapters
FROM student_progress
GROUP BY user_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW student_analytics;`}</pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 16: Load Testing Strategy</CardTitle>
                      <CardDescription>Performance for 50M users</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                        <p><strong>Scalability checklist:</strong></p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>✅ Database partitioning (student_progress by year)</li>
                          <li>✅ Materialized views for analytics</li>
                          <li>✅ Indexes on all foreign keys</li>
                          <li>✅ RLS policies for security</li>
                          <li>✅ CDN for static assets (Supabase Storage)</li>
                          <li>✅ Rate limiting in edge functions (100 req/min)</li>
                          <li>✅ Pagination (50 items per page)</li>
                          <li>✅ React Query caching</li>
                          <li>✅ Connection pooling (Supabase auto)</li>
                          <li>✅ Monitoring with Supabase analytics</li>
                        </ul>
                        <p className="mt-3"><strong>Monitoring:</strong> Set alerts for query response time &gt; 1s, error rate &gt; 1%, connections &gt; 80%</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prompt 17: INR Currency Formatting</CardTitle>
                      <CardDescription>Display prices in Indian Rupees</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs whitespace-pre-wrap">{`Update src/lib/utils.ts (already has formatINR):

export const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Usage in components:
import { formatINR } from '@/lib/utils';

<span>{formatINR(program.price)}</span>
// Output: ₹5,999`}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default Implementation;