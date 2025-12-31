import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  HelpCircle, 
  MessageSquare, 
  ArrowLeft, 
  BookOpen,
  FileText,
  Ticket,
  CreditCard,
  Settings,
  GraduationCap,
  Shield,
  Wrench,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { SupportFAQSearch } from "@/components/support/SupportFAQSearch";
import { SupportCategoryTabs } from "@/components/support/SupportCategoryTabs";
import { SupportFAQs } from "@/components/support/SupportFAQs";
import { SupportChat } from "@/components/support/SupportChat";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { SupportTicketList } from "@/components/support/SupportTicketList";
import { useSupportFAQs, useSearchFAQs } from "@/hooks/useSupportFAQs";
import { useSupportAssistant } from "@/hooks/useSupportAssistant";
import { supabase } from "@/integrations/supabase/client";

const ARTICLES = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn how to navigate the platform and start your learning journey.",
    icon: BookOpen,
    content: `## Welcome to SimpleLecture!

**Creating Your Account**
1. Click "Sign Up" on the homepage or navigate to the registration page
2. Enter your full name, email address, and phone number
3. Create a secure password (at least 8 characters)
4. Verify your email or phone number to activate your account

**Exploring Courses**
- Browse available programs and courses from the homepage
- Use the search bar to find specific subjects or topics
- Filter courses by category, price, or popularity
- View course details including syllabus, instructor info, and reviews

**Enrolling in a Course**
1. Add your desired course to the cart
2. Apply any promo codes for discounts
3. Complete the checkout process via Razorpay
4. Access your enrolled courses from the Dashboard

**Navigating Your Dashboard**
After logging in, your Dashboard gives you quick access to:
- Your enrolled courses
- Learning progress and statistics
- Upcoming live classes
- Recent notifications and announcements`
  },
  {
    id: "course-navigation",
    title: "Course Navigation",
    description: "Master the course interface, video player, and learning materials.",
    icon: GraduationCap,
    content: `## Understanding the Learning Page

**Subject Navigation**
- Use the subject navigation bar at the top to switch between subjects
- Each subject contains multiple chapters organized in order

**Chapters & Topics Sidebar**
- The left sidebar shows all chapters in the current subject
- Click on a chapter to expand and see its topics
- Topics are marked with icons showing completion status

**Available Learning Tabs**
- **Classes**: Watch recorded live class sessions
- **AI Assistant**: Get instant doubt resolution with our AI tutor
- **Podcast**: Listen to audio lessons while on the go
- **MCQs**: Practice with topic-specific multiple choice questions
- **DPT (Daily Practice Test)**: Take daily tests to reinforce learning
- **Notes**: Access downloadable PDF notes and study materials
- **Assignments**: Complete and submit your homework
- **Previous Year Papers**: Practice with past exam questions

**Tracking Your Progress**
- Progress bars show completion percentage for each topic
- Mark topics as complete after finishing all materials
- Your overall course progress is visible on the Dashboard`
  },
  {
    id: "account-settings",
    title: "Account Settings",
    description: "Manage your profile, preferences, and notification settings.",
    icon: Settings,
    content: `## Managing Your Account

**Accessing Profile Settings**
1. Click on your profile avatar in the top navigation
2. Select "Profile" or "Settings" from the dropdown
3. Navigate to the section you want to update

**Updating Personal Information**
- **Full Name**: Edit your display name
- **Phone Number**: Update your contact number
- **Date of Birth**: Set your birth date for personalized content
- **Profile Photo**: Upload a new profile picture

**Student ID Card**
- View and download your digital Student ID Card
- Contains your unique student ID, photo, and enrollment details
- Can be used for identity verification

**Notification Preferences**
- Enable/disable email notifications
- Control push notifications for mobile app
- Set preferences for:
  - Live class reminders
  - Assignment due dates
  - New course announcements
  - Promotional offers`
  },
  {
    id: "payment-billing",
    title: "Payment & Billing",
    description: "Understand payment methods, invoices, and subscription management.",
    icon: CreditCard,
    content: `## Payment & Billing Guide

**Adding Courses to Cart**
1. Browse courses and click "Add to Cart"
2. Review items in your cart
3. Adjust quantities if purchasing for multiple users

**Applying Promo Codes**
- Enter your promo code in the designated field
- Click "Apply" to see the discounted price
- Only one promo code can be used per transaction

**Checkout Process**
1. Review your cart and applied discounts
2. Click "Proceed to Checkout"
3. Complete payment via Razorpay (supports UPI, cards, net banking, wallets)
4. Receive confirmation email with invoice

**Viewing Payment History**
- Navigate to your Profile > Payment History
- View all past transactions with dates and amounts
- Download invoices for any transaction

**If Payment Fails**
- Check your bank account for any deductions
- Wait 24-48 hours for automatic refund if charged
- Contact support with transaction ID if issue persists
- Retry payment using a different method`
  },
  {
    id: "certificates",
    title: "Certificates & Progress",
    description: "Track your progress and download course completion certificates.",
    icon: Shield,
    content: `## Tracking Progress & Earning Certificates

**Accessing Your Dashboard**
Navigate to the Student Dashboard from the main menu to see all your learning statistics.

**Dashboard Tabs**

**Overview Tab**
- Quick statistics: total study time, courses enrolled, completion rate
- Recent activity summary
- Upcoming live classes and deadlines

**My Progress Tab**
- Detailed progress for each enrolled course
- Subject-wise and chapter-wise completion tracking
- Time spent on videos, MCQs, and assignments
- Streaks and learning consistency

**My Tests Tab**
- All quiz and test scores
- Performance analytics and trends
- Comparison with class averages
- Areas for improvement

**My Attendance Tab**
- Live class attendance records
- Missed classes with recording links
- Overall attendance percentage

**Downloading Certificates**
1. Complete 100% of a course (all videos, MCQs, and assignments)
2. Navigate to Dashboard > My Progress
3. Click "Download Certificate" for completed courses
4. Certificates are generated as PDF files`
  },
  {
    id: "technical-support",
    title: "Technical Support",
    description: "Troubleshoot common issues with video playback, login, and more.",
    icon: Wrench,
    content: `## Technical Troubleshooting Guide

**Video Playback Issues**
- Ensure stable internet connection (minimum 2 Mbps recommended)
- Try lowering video quality in the player settings
- Clear browser cache and cookies
- Disable browser extensions that might block content
- Try a different browser or device

**Login & Password Issues**
- Use "Forgot Password" to reset via email or phone
- Check if your account email is correct
- Clear browser cache if login page doesn't load
- Disable VPN if you're having connection issues

**Browser Compatibility**
Recommended browsers for best experience:
- Google Chrome (latest version)
- Mozilla Firefox (latest version)
- Microsoft Edge (latest version)
- Safari (latest version on Mac/iOS)

**Mobile App**
- Download SimpleLecture app from App Store (iOS) or Play Store (Android)
- Ensure app is updated to the latest version
- Enable notifications for live class reminders
- Use "Download for Offline" feature for watching without internet

**Clearing Cache & Cookies**
1. Open browser settings
2. Navigate to Privacy/History settings
3. Select "Clear browsing data"
4. Check "Cookies" and "Cached images"
5. Click "Clear data" and refresh the page

**Still Having Issues?**
If the above steps don't resolve your problem:
- Note any error messages you see
- Take a screenshot of the issue
- Contact our support team with details
- Use the AI Support Chat for quick assistance`
  },
];

const Support = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mainTab, setMainTab] = useState("faqs");
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const { data: faqs, isLoading: faqsLoading } = useSupportFAQs(selectedCategory);
  const { data: searchResults, isLoading: searchLoading } = useSearchFAQs(searchTerm);

  const {
    messages,
    isLoading: chatLoading,
    currentTicketId,
    createTicket,
    sendMessage,
    resolveTicket,
    escalateTicket,
    clearMessages,
    setMessages,
    setCurrentTicketId
  } = useSupportAssistant();

  // Check auth status
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  // Load existing ticket messages
  const loadTicketMessages = async (ticketId: string) => {
    const { data: ticketMessages } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (ticketMessages) {
      setMessages(ticketMessages.map((m) => ({
        id: m.id,
        role: m.sender_type === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
        createdAt: new Date(m.created_at)
      })));
      setCurrentTicketId(ticketId);
      setMainTab("faqs");
      setShowChat(true);
    }
  };

  const handleStartChat = async (category: string, subject: string, message: string) => {
    if (!isAuthenticated) {
      navigate('/auth?tab=login');
      return;
    }

    const ticket = await createTicket(category, subject, message);
    if (ticket) {
      setShowChat(true);
      // Send the initial message to AI
      await sendMessage(message, ticket.id);
    }
  };

  const handleResolve = async () => {
    if (currentTicketId) {
      const success = await resolveTicket(currentTicketId);
      if (success) {
        setShowChat(false);
        clearMessages();
      }
    }
  };

  const handleEscalate = async () => {
    if (currentTicketId) {
      const success = await escalateTicket(currentTicketId);
      if (success) {
        setShowChat(false);
        clearMessages();
      }
    }
  };

  const handleBackToFAQs = () => {
    setShowChat(false);
    clearMessages();
  };

  const displayFaqs = searchTerm.length >= 2 ? searchResults : faqs;
  const isLoadingFaqs = searchTerm.length >= 2 ? searchLoading : faqsLoading;
  
  // Show only 4 FAQs initially, all when searching or expanded
  const visibleFaqs = searchTerm.length >= 2 ? displayFaqs : (showAllFaqs ? displayFaqs : displayFaqs?.slice(0, 4));
  const hasMoreFaqs = (displayFaqs?.length || 0) > 4;

  // Reset showAllFaqs when category changes
  useEffect(() => {
    setShowAllFaqs(false);
  }, [selectedCategory]);

  // Check if AI has responded (show feedback buttons)
  const showFeedback = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant';

  return (
    <>
      <Helmet>
        <title>Help Center & FAQs - SimpleLecture</title>
        <meta name="description" content="Get help with your SimpleLecture account, payments, courses, and more. Browse FAQs or chat with our AI support assistant." />
      </Helmet>
      
      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-6 gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>

            <div className="text-center max-w-3xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary mb-4">
                <HelpCircle className="h-5 w-5" />
                <span className="font-medium">Help Center</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                How can we help you?
              </h1>
              <p className="text-muted-foreground text-lg">
                Search our FAQs or chat with our AI assistant for quick answers
              </p>
            </div>

            <SupportFAQSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="articles" className="gap-2">
                <FileText className="h-4 w-4" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="faqs" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQs
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-2">
                <Ticket className="h-4 w-4" />
                My Support Tickets
              </TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articles">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ARTICLES.map((article) => {
                  const isExpanded = expandedArticle === article.id;
                  return (
                    <Collapsible
                      key={article.id}
                      open={isExpanded}
                      onOpenChange={(open) => setExpandedArticle(open ? article.id : null)}
                      className={isExpanded ? "md:col-span-2 lg:col-span-3" : ""}
                    >
                      <Card className="hover:shadow-md transition-all">
                        <CollapsibleTrigger asChild>
                          <div className="cursor-pointer">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-primary/10 rounded-lg">
                                    <article.icon className="h-5 w-5 text-primary" />
                                  </div>
                                  <CardTitle className="text-lg">{article.title}</CardTitle>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <CardDescription className="mb-4">
                                {article.description}
                              </CardDescription>
                              {!isExpanded && (
                                <div className="flex items-center text-primary text-sm font-medium">
                                  Read more <ArrowRight className="h-4 w-4 ml-1" />
                                </div>
                              )}
                            </CardContent>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-6 pb-6">
                            <Separator className="mb-4" />
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {article.content.split('\n').map((line, index) => {
                                if (line.startsWith('## ')) {
                                  return <h2 key={index} className="text-xl font-bold mt-4 mb-3 text-foreground">{line.replace('## ', '')}</h2>;
                                } else if (line.startsWith('**') && line.endsWith('**')) {
                                  return <h3 key={index} className="font-semibold mt-4 mb-2 text-foreground">{line.replace(/\*\*/g, '')}</h3>;
                                } else if (line.match(/^\d+\./)) {
                                  return <p key={index} className="ml-4 text-muted-foreground">{line}</p>;
                                } else if (line.startsWith('- ')) {
                                  return <p key={index} className="ml-4 text-muted-foreground">• {line.replace('- ', '')}</p>;
                                } else if (line.trim() === '') {
                                  return <div key={index} className="h-2" />;
                                } else {
                                  return <p key={index} className="text-muted-foreground">{line}</p>;
                                }
                              })}
                            </div>
                            <Button 
                              variant="ghost" 
                              onClick={() => setExpandedArticle(null)}
                              className="mt-4 gap-2"
                            >
                              Show less
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs">
              {showChat ? (
                <div className="space-y-4">
                  <Button 
                    variant="ghost" 
                    onClick={handleBackToFAQs}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to FAQs
                  </Button>
                  
                  <SupportChat
                    messages={messages}
                    isLoading={chatLoading}
                    onSendMessage={(msg) => sendMessage(msg)}
                    ticketId={currentTicketId}
                    onResolve={handleResolve}
                    onEscalate={handleEscalate}
                    showFeedback={showFeedback}
                  />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Category Tabs */}
                  {!searchTerm && (
                    <div className="flex justify-center">
                      <SupportCategoryTabs 
                        selectedCategory={selectedCategory} 
                        onCategoryChange={setSelectedCategory} 
                      />
                    </div>
                  )}

                  {/* FAQs Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">
                        {searchTerm ? `Search Results for "${searchTerm}"` : "Frequently Asked Questions"}
                      </h2>
                    </div>
                    <SupportFAQs 
                      faqs={visibleFaqs} 
                      isLoading={isLoadingFaqs}
                      searchTerm={searchTerm}
                    />
                    
                    {/* See More / Show Less Button */}
                    {!searchTerm && hasMoreFaqs && (
                      <div className="text-center mt-6">
                        {!showAllFaqs ? (
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAllFaqs(true)}
                            className="gap-2"
                          >
                            See More ({(displayFaqs?.length || 0) - 4} more)
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            onClick={() => setShowAllFaqs(false)}
                            className="gap-2"
                          >
                            Show Less
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </section>

                  <Separator className="my-8" />

                  {/* Chat Section */}
                  <section>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-secondary-foreground mb-4">
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-medium">Still need help?</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Chat with our AI Assistant</h2>
                      <p className="text-muted-foreground">
                        Our AI can help with account, payment, technical, and course-related support questions.
                      </p>
                    </div>

                    {isAuthenticated ? (
                      <SupportTicketForm onSubmit={handleStartChat} isLoading={chatLoading} />
                    ) : (
                      <Card className="max-w-md mx-auto">
                        <CardContent className="py-8 text-center">
                          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-semibold mb-2">Login Required</h3>
                          <p className="text-muted-foreground mb-4">
                            Please log in to start a support conversation
                          </p>
                          <Button onClick={() => navigate('/auth?tab=login')}>
                            Log In to Continue
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </section>
                </div>
              )}
            </TabsContent>

            {/* My Support Tickets Tab */}
            <TabsContent value="tickets">
              {isAuthenticated ? (
                <SupportTicketList onSelectTicket={loadTicketMessages} />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Login Required</h3>
                    <p className="text-muted-foreground mb-4">
                      Please log in to view your support tickets
                    </p>
                    <Button onClick={() => navigate('/auth?tab=login')}>
                      Log In
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Support;
