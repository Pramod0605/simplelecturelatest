import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export const SmartHeader = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Show default Header while checking auth (prevents layout shift)
  if (isLoggedIn === null) {
    return <Header />;
  }

  // Show appropriate header based on auth state
  return isLoggedIn ? <DashboardHeader /> : <Header />;
};
