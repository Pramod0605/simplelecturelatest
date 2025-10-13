import { SEOHead } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Database } from "lucide-react";

const Implementation = () => {
  return (
    <>
      <SEOHead
        title="Implementation Guide - SimpleLecture"
        description="Complete guide for implementing mobile UI and backend integration"
        keywords="implementation, mobile app, backend, supabase"
        canonicalUrl="https://simplelecture.com/implementation"
      />
      <Header />
      
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Implementation Guide
            </h1>
            <p className="text-lg text-muted-foreground">
              Step-by-step prompts for building mobile UI and integrating backend
            </p>
          </div>

          <Tabs defaultValue="mobile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile App UI Design
              </TabsTrigger>
              <TabsTrigger value="backend" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Backend & Database Integration
              </TabsTrigger>
            </TabsList>

            {/* Mobile UI Tab */}
            <TabsContent value="mobile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mobile App UI Implementation Prompts</CardTitle>
                  <CardDescription>
                    Copy these prompts one by one to build the mobile app UI in React Native or bolt.new
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="space-y-8">
                    
                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 1: Bottom Navigation</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create a bottom navigation bar with 5 tabs:<br/>
                          - Explore (🔍 icon)<br/>
                          - Search (🔎 icon)<br/>
                          - My Learning (📚 icon)<br/>
                          - IRE (🏆 icon)<br/>
                          - Profile (👤 icon)<br/><br/>
                          Active tab should have primary color, inactive tabs muted.<br/>
                          Icons should be 24px, labels 12px.<br/>
                          Total height: 64px with safe area inset.
                        </code>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 2: Mobile Home Screen</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create mobile home screen with:<br/>
                          1. Top bar: Hamburger (left), Course badge (center), Gift+Points (right)<br/>
                          2. Search bar: Large, rounded, with "Study" button inside<br/>
                          3. Hero carousel: Auto-scroll every 5s, 3 slides with course promos<br/>
                          4. Filter tabs: Horizontal scroll, "All" selected by default<br/>
                          5. Course cards: 1-column grid with image, title, price (₹), badge<br/>
                          6. Bottom navigation (from Prompt 1)<br/><br/>
                          Use mock data for now. Focus on smooth animations.
                        </code>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 3: Explore Page with Category Grid</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create explore page with:<br/>
                          - Header: Back button, "Explore" title, Search icon<br/>
                          - Category grid: 2 columns, colorful cards with icons<br/>
                          - Each card shows: Icon, Category name, Course count<br/>
                          - Tap opens subcategory bottom sheet<br/>
                          - Subcategory sheet: List with arrows, "View All" button<br/><br/>
                          Categories: Generative AI, Data Science, Cyber Security, etc.
                        </code>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 4: Search Page</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create search page with:<br/>
                          - Auto-focused search input at top<br/>
                          - Recent searches: Horizontal chips with X icons<br/>
                          - Trending searches: "Trending Now" section with clickable items<br/>
                          - Filter button (opens bottom sheet)<br/>
                          - Results: Course cards (same as home)<br/>
                          - Empty state: "No results" with illustration
                        </code>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 5: My Learning Page</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create My Learning page with:<br/>
                          - If not logged in: Show login prompt card with benefits<br/>
                          - If logged in: Show tabs (In Progress | Completed | Saved)<br/>
                          - Course progress cards: Image, title, progress bar, "Continue" button<br/>
                          - Empty state: "Start learning!" with suggested courses<br/><br/>
                          Use mock login state (toggle button for testing).
                        </code>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 6: IRE Programs Page</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create IRE (Indian Ranking Exams) page with:<br/>
                          - Hero: "Ace Your Entrance Exams"<br/>
                          - Exam cards: NEET, JEE, UPSC, Banking, SSC<br/>
                          - Each card: Icon, Exam name, "View Programs" button<br/>
                          - Featured programs section below<br/>
                          - Mock test CTA banner
                        </code>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 7: Profile Page</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create profile page with:<br/>
                          - Header: Avatar, Name, Email, "Edit Profile" button<br/>
                          - Stats grid: 4 cards (Courses, Hours, Certificates, Streak)<br/>
                          - Menu items: Certificates, Payments, Settings, Help, Privacy, Logout<br/>
                          - Use mock user data: Name "John Doe", 5 courses, 24 hours
                        </code>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 8: Sign Up Screen</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create sign up screen with:<br/>
                          - Scrollable form with fields: Full Name, Email, Phone (+91), Password, Confirm Password<br/>
                          - Password strength indicator (weak/medium/strong)<br/>
                          - Terms checkbox<br/>
                          - "Sign Up" button (full width)<br/>
                          - Google sign-in button<br/>
                          - "Already have account? Login" link<br/>
                          - Mobile-optimized keyboard handling
                        </code>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 9: Login Screen</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create login screen with:<br/>
                          - Email and Password inputs<br/>
                          - "Show/Hide" password toggle<br/>
                          - "Remember me" checkbox<br/>
                          - "Forgot password?" link<br/>
                          - "Login" button (full width, primary color)<br/>
                          - Google sign-in button<br/>
                          - "New user? Sign up" link<br/>
                          - Biometric login option (Face ID/Fingerprint) placeholder
                        </code>
                      </div>
                    </div>

                    <div className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Prompt 10: Hamburger Menu Drawer</h3>
                      <div className="bg-card p-4 rounded-md mt-3">
                        <code className="text-sm">
                          Create side drawer menu with:<br/>
                          - Header: Avatar + Name (or "Login" button if not authenticated)<br/>
                          - Menu items: Home, Dashboard, My Programs, Browse, IRE, Assignments, Profile, Logout<br/>
                          - Items requiring auth should show lock icon when not logged in<br/>
                          - Footer: App version "v1.0.0", Social media icons<br/>
                          - Smooth slide-in animation from left
                        </code>
                      </div>
                    </div>

                    <div className="bg-primary/10 p-6 rounded-lg mt-8">
                      <h3 className="text-lg font-bold text-foreground mb-3">General Mobile Guidelines</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Min touch target: 44px</li>
                        <li>• Base font size: 16px</li>
                        <li>• Use system fonts for performance</li>
                        <li>• Implement skeleton loaders</li>
                        <li>• Add pull-to-refresh where applicable</li>
                        <li>• Handle keyboard avoiding view</li>
                        <li>• Use safe area insets</li>
                        <li>• Dark mode support (optional for v2)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backend Integration Tab */}
            <TabsContent value="backend" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Backend Integration Prompts</CardTitle>
                  <CardDescription>
                    Execute these prompts sequentially AFTER UI is complete
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="space-y-8">
                    {/* Integration prompts... */}
                    
                    <div className="border-l-4 border-secondary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Integration 1: Setup Authentication</h3>
                      <div className="bg-card p-4 rounded-md mt-3 overflow-x-auto">
                        <pre className="text-xs"><code>{`// Update Sign Up page
const { data, error } = await supabase.auth.signUp({
  email: form.email,
  password: form.password,
  options: {
    data: {
      full_name: form.fullName,
      phone: form.phone
    }
  }
});

// Update Login page
const { data, error } = await supabase.auth.signInWithPassword({
  email: form.email,
  password: form.password
});

// Setup auth state listener in App.tsx
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ?? null);
  });
}, []);`}</code></pre>
                      </div>
                    </div>

                    <div className="border-l-4 border-secondary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Integration 2: Fetch Programs Data</h3>
                      <div className="bg-card p-4 rounded-md mt-3 overflow-x-auto">
                        <pre className="text-xs"><code>{`// Update Mobile Home to use usePrograms() hook
const { data: programs, isLoading } = usePrograms();

// Add loading states (skeleton loaders)
if (isLoading) return <SkeletonLoader />;

// Add error states with retry button
if (error) return <ErrorState onRetry={refetch} />;`}</code></pre>
                      </div>
                    </div>

                    <div className="border-l-4 border-secondary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Integration 3: Implement Search</h3>
                      <div className="bg-card p-4 rounded-md mt-3 overflow-x-auto">
                        <pre className="text-xs"><code>{`// Create useSearch(query) hook
const { data } = await supabase
  .from('programs')
  .select('*')
  .ilike('title', \\\`%\\\${query}%\\\`)
  .order('created_at', { ascending: false });

// Add debouncing (300ms)
const debouncedSearch = useDebounce(query, 300);

// Store recent searches in localStorage
localStorage.setItem('recentSearches', JSON.stringify(searches));`}</code></pre>
                      </div>
                    </div>

                    <div className="border-l-4 border-secondary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Integration 4: My Learning Page</h3>
                      <div className="bg-card p-4 rounded-md mt-3 overflow-x-auto">
                        <pre className="text-xs"><code>{`// Fetch user enrollments
const { data: enrollments } = await supabase
  .from('enrollments')
  .select(\\`
    *,
    programs (*)
  \\\`)
  .eq('user_id', user.id);

// Fetch user progress
const { data: progress } = await supabase
  .from('student_progress')
  .select('*')
  .eq('student_id', user.id);

// Calculate completion percentage
const completionPercentage = (progress.length / totalTopics) * 100;`}</code></pre>
                      </div>
                    </div>

                    <div className="border-l-4 border-secondary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Integration 5: Profile Data</h3>
                      <div className="bg-card p-4 rounded-md mt-3 overflow-x-auto">
                        <pre className="text-xs"><code>{`// Fetch user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// Update profile
await supabase
  .from('profiles')
  .update({ full_name, phone })
  .eq('id', user.id);`}</code></pre>
                      </div>
                    </div>

                    <div className="border-l-4 border-secondary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Integration 6: AI Features</h3>
                      <div className="bg-card p-4 rounded-md mt-3 overflow-x-auto">
                        <pre className="text-xs"><code>{`// Call AI tutor chat
const response = await supabase.functions.invoke('ai-tutor-chat', {
  body: {
    messages: chatHistory,
    course_context: currentCourse.id
  }
});

// Call doubt clearing
const answer = await askDoubt(question, topicId, studentId);

// Generate MCQs
const mcqs = await generateMCQs(topicId, 'medium', 5);`}</code></pre>
                      </div>
                    </div>

                    <div className="border-l-4 border-secondary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Integration 7: Currency (INR)</h3>
                      <div className="bg-card p-4 rounded-md mt-3 overflow-x-auto">
                        <pre className="text-xs"><code>{`// Use formatINR utility
import { formatINR } from '@/lib/utils';

// All prices
<span>{formatINR(course.price_inr)}</span>

// Utility already created in utils.ts`}</code></pre>
                      </div>
                    </div>

                    <div className="border-l-4 border-secondary pl-6 py-4 bg-muted/30 rounded-r-lg">
                      <h3 className="text-lg font-bold text-foreground mt-0">Integration 8: Caching & Performance</h3>
                      <div className="bg-card p-4 rounded-md mt-3 overflow-x-auto">
                        <pre className="text-xs"><code>{`// React Query already implemented ✅
// Verify cache times in hooks:
const { data } = useQuery({
  queryKey: ['programs'],
  queryFn: fetchPrograms,
  staleTime: 15 * 60 * 1000, // 15 minutes
});

// Prefetch on navigation
queryClient.prefetchQuery(['programs', category]);`}</code></pre>
                      </div>
                    </div>

                    <div className="bg-secondary/10 p-6 rounded-lg mt-8">
                      <h3 className="text-lg font-bold text-foreground mb-3">Scalability for 50M Users</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>✅ Database partitioning (student_progress by year)</li>
                        <li>✅ Materialized views (student_analytics)</li>
                        <li>✅ Indexes on all foreign keys</li>
                        <li>✅ RLS policies for security</li>
                        <li>✅ React Query caching (15 min staleTime)</li>
                        <li>✅ Edge functions (auto-scaling)</li>
                        <li>• Add CDN for static assets</li>
                        <li>• Setup read replicas</li>
                        <li>• Implement rate limiting</li>
                        <li>• Enable pagination (20 items/page)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default Implementation;
