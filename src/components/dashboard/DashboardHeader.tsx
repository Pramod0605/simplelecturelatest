import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/website-logo.png";
import { DashboardMenu } from "./DashboardMenu";
import { NotificationModal } from "./NotificationModal";
import { MegaMenu } from "@/components/MegaMenu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNotices } from "@/hooks/useNotices";

export const DashboardHeader = () => {
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { unreadCount } = useNotices();

  const { data: profile } = useQuery({
    queryKey: ["dashboard-header-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return { ...data, email: user.email } as { full_name?: string | null; avatar_url?: string | null; email?: string | null };
    },
  });

  const initials = (profile?.full_name || profile?.email || "U").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="SimpleLecture Logo" className="h-8" />
          </Link>
          <MegaMenu />
          <div className="relative hidden md:flex w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses, assignments, classes..." className="pl-9" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" onClick={() => setNotificationOpen(true)}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* Profile */}
          <Button variant="ghost" className="px-1" onClick={() => navigate("/profile")}> 
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User"} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm">{profile?.full_name || "Student"}</span>
            </div>
          </Button>

          {/* Right-side expanding menu */}
          <DashboardMenu />
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal open={notificationOpen} onOpenChange={setNotificationOpen} />
    </header>
  );
};