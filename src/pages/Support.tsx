import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, MessageSquare, ArrowLeft, BookOpen } from "lucide-react";
import { SupportFAQSearch } from "@/components/support/SupportFAQSearch";
import { SupportCategoryTabs } from "@/components/support/SupportCategoryTabs";
import { SupportFAQs } from "@/components/support/SupportFAQs";
import { SupportChat } from "@/components/support/SupportChat";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { SupportTicketList } from "@/components/support/SupportTicketList";
import { useSupportFAQs, useSearchFAQs } from "@/hooks/useSupportFAQs";
import { useSupportAssistant } from "@/hooks/useSupportAssistant";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Support = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      setMessages(ticketMessages.map((m, i) => ({
        id: m.id,
        role: m.sender_type === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
        createdAt: new Date(m.created_at)
      })));
      setCurrentTicketId(ticketId);
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
          {showChat ? (
            <div className="max-w-3xl mx-auto">
              <Button 
                variant="ghost" 
                onClick={handleBackToFAQs}
                className="mb-4 gap-2"
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
              <section className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {searchTerm ? `Search Results for "${searchTerm}"` : "Frequently Asked Questions"}
                  </h2>
                </div>
                <SupportFAQs 
                  faqs={displayFaqs} 
                  isLoading={isLoadingFaqs}
                  searchTerm={searchTerm}
                />
              </section>

              <Separator className="my-8" />

              {/* Chat Section */}
              <section className="max-w-3xl mx-auto">
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
                  <Card>
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

              {/* User's Tickets */}
              {isAuthenticated && (
                <section className="max-w-3xl mx-auto mt-8">
                  <SupportTicketList onSelectTicket={loadTicketMessages} />
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Support;
