import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  category: string;
}

interface SupportMessage {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

interface SupportChatTabProps {
  onUnreadCountChange?: (count: number) => void;
}

export const SupportChatTab = ({ onUnreadCountChange }: SupportChatTabProps) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Fetch user's tickets
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, status, created_at, category")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);

      // Count unread (admin_responded) tickets
      const unreadCount = (data || []).filter(t => t.status === "admin_responded").length;
      onUnreadCountChange?.(unreadCount);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, sender_type, content, created_at")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark ticket as read if it was admin_responded
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket?.status === "admin_responded") {
        await supabase
          .from("support_tickets")
          .update({ status: "open" })
          .eq("id", ticketId);
        fetchTickets(); // Refresh to update badge
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicket.id,
        sender_type: "user",
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Update ticket status
      await supabase
        .from("support_tickets")
        .update({ status: "open", updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      setNewMessage("");
      fetchMessages(selectedTicket.id);
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleCreateNewTicket = async () => {
    if (!newTicketMessage.trim()) return;

    setCreatingTicket(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to create a support ticket");
        return;
      }

      // Create new ticket
      const { data: newTicket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: "Support Request",
          category: "General",
          status: "open",
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Add the message
      const { error: msgError } = await supabase.from("support_messages").insert({
        ticket_id: newTicket.id,
        sender_type: "user",
        content: newTicketMessage.trim(),
      });

      if (msgError) throw msgError;

      setNewTicketMessage("");
      await fetchTickets();
      
      // Open the new ticket conversation
      setSelectedTicket(newTicket);
      fetchMessages(newTicket.id);
      toast.success("Support request sent!");
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create support request");
    } finally {
      setCreatingTicket(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "admin_responded":
        return <Badge variant="destructive" className="text-xs">Admin Replied</Badge>;
      case "escalated_to_admin":
        return <Badge variant="secondary" className="text-xs">Escalated</Badge>;
      case "closed_resolved":
        return <Badge variant="outline" className="text-xs">Closed</Badge>;
      default:
        return <Badge variant="default" className="text-xs">Open</Badge>;
    }
  };

  const getRoleBadge = (senderType: string) => {
    switch (senderType) {
      case "admin":
        return <span className="text-xs font-medium text-primary">Admin</span>;
      case "assistant":
        return <span className="text-xs font-medium text-muted-foreground">AI</span>;
      default:
        return <span className="text-xs font-medium text-foreground">You</span>;
    }
  };

  // Conversation view
  if (selectedTicket) {
    return (
      <div className="flex flex-col flex-1 min-h-0 p-2 overflow-hidden">
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTicket(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{selectedTicket.subject}</h4>
            {getStatusBadge(selectedTicket.status)}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto border rounded-md mb-2 overscroll-contain touch-pan-y">
          <div className="p-2 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg text-sm ${
                  msg.sender_type === "user"
                    ? "bg-primary/10 ml-4"
                    : msg.sender_type === "admin"
                    ? "bg-destructive/10 mr-4"
                    : "bg-muted mr-4"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  {getRoleBadge(msg.sender_type)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">No messages yet</p>
            )}
          </div>
        </div>

        {selectedTicket.status !== "closed_resolved" && (
          <div className="flex gap-2 flex-shrink-0">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[44px] text-sm resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Ticket list view
  return (
    <div className="p-2 flex-1 min-h-0 flex flex-col overflow-hidden">
      <h4 className="text-sm font-medium mb-2 flex-shrink-0">Your Support Tickets</h4>
      
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No support tickets yet</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleTicketClick(ticket)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                  ticket.status === "admin_responded" ? "border-destructive/50 bg-destructive/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">{ticket.category}</p>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Message Input */}
      <div className="flex gap-2 flex-shrink-0 mt-2 pt-2 border-t">
        <Textarea
          value={newTicketMessage}
          onChange={(e) => setNewTicketMessage(e.target.value)}
          placeholder="Start a new support request..."
          className="min-h-[44px] text-sm resize-none"
        />
        <Button
          onClick={handleCreateNewTicket}
          disabled={!newTicketMessage.trim() || creatingTicket}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
