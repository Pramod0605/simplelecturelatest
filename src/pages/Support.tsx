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
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Loader2
} from "lucide-react";
import { SupportFAQSearch } from "@/components/support/SupportFAQSearch";
import { SupportCategoryTabs } from "@/components/support/SupportCategoryTabs";
import { SupportFAQs } from "@/components/support/SupportFAQs";
import { SupportChat } from "@/components/support/SupportChat";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { SupportTicketList } from "@/components/support/SupportTicketList";
import { useSupportFAQs, useSearchFAQs } from "@/hooks/useSupportFAQs";
import { useSupportAssistant } from "@/hooks/useSupportAssistant";
import { useSupportArticles, useUserArticleFeedback, useSubmitArticleFeedback, SupportArticle } from "@/hooks/useSupportArticles";
import { supabase } from "@/integrations/supabase/client";
import { LucideIcon } from "lucide-react";

// Icon mapping for database articles
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  GraduationCap,
  Settings,
  CreditCard,
  Shield,
  Wrench,
  HelpCircle,
  FileText,
};
const getArticleIcon = (iconName: string): LucideIcon => {
  return ICON_MAP[iconName] || BookOpen;
};

const Support = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mainTab, setMainTab] = useState("faqs");
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const { data: faqs, isLoading: faqsLoading } = useSupportFAQs(selectedCategory);
  const { data: searchResults, isLoading: searchLoading } = useSearchFAQs(searchTerm);
  
  // Articles hooks
  const { data: articles, isLoading: articlesLoading } = useSupportArticles();
  const { data: userFeedback } = useUserArticleFeedback(userId);
  const submitFeedback = useSubmitArticleFeedback();

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
      setUserId(user?.id);
    });
  }, []);
  
  // Get user's feedback for a specific article
  const getUserFeedbackForArticle = (articleId: string) => {
    return userFeedback?.find(f => f.article_id === articleId);
  };

  // Handle feedback submission
  const handleFeedback = (articleId: string, isHelpful: boolean) => {
    if (!userId) {
      navigate('/auth?tab=login');
      return;
    }
    
    const existingFeedback = getUserFeedbackForArticle(articleId);
    submitFeedback.mutate({
      articleId,
      userId,
      isHelpful,
      existingFeedback,
    });
  };

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
              {articlesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {articles?.map((article) => {
                    const isExpanded = expandedArticle === article.id;
                    const IconComponent = getArticleIcon(article.icon_name);
                    const feedback = getUserFeedbackForArticle(article.id);
                    
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
                                      <IconComponent className="h-5 w-5 text-primary" />
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
                              
                              {/* Feedback Section */}
                              <Separator className="my-4" />
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Was this article helpful?</p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant={feedback?.is_helpful === true ? "default" : "outline"}
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFeedback(article.id, true);
                                    }}
                                    disabled={submitFeedback.isPending}
                                    className="gap-1"
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                    Yes {article.helpful_count > 0 && `(${article.helpful_count})`}
                                  </Button>
                                  <Button
                                    variant={feedback?.is_helpful === false ? "destructive" : "outline"}
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFeedback(article.id, false);
                                    }}
                                    disabled={submitFeedback.isPending}
                                    className="gap-1"
                                  >
                                    <ThumbsDown className="h-4 w-4" />
                                    No {article.not_helpful_count > 0 && `(${article.not_helpful_count})`}
                                  </Button>
                                </div>
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
              )}
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
