import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "react-qr-code";
import { useAttendance } from "@/hooks/useAttendance";

export const StudentIDCard = () => {
  const { percentage: attendancePercentage } = useAttendance();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return { ...data, email: user.email };
    },
  });

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <Card className="p-6">
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">
            Welcome, {profile?.full_name || 'Student'}!
          </h2>
          <p className="text-muted-foreground mb-4">
            {profile?.email || 'student@example.com'}
          </p>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Attendance</p>
              <p className="text-2xl font-bold text-primary">{attendancePercentage}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Student ID</p>
              <p className="text-lg font-mono">{profile?.id?.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="bg-white p-3 rounded-lg">
            <QRCode
              value={profile?.id || 'student-id'}
              size={100}
              level="M"
            />
          </div>
          <p className="text-xs text-muted-foreground">Student QR</p>
        </div>
      </div>
    </Card>
  );
};
