import { User, Settings, BookOpen, Award, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SEOHead } from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";

const MobileProfile = () => {
  const menuItems = [
    { icon: BookOpen, label: "My Courses", path: "/mobile/my-learning" },
    { icon: Award, label: "Certificates", path: "/mobile/certificates" },
    { icon: Settings, label: "Settings", path: "/mobile/settings" },
  ];

  return (
    <>
      <SEOHead title="Profile | SimpleLecture" description="Your profile" />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-6">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>UN</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold mb-1">User Name</h1>
            <p className="text-sm opacity-90">user@example.com</p>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-4 -mt-8">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Courses</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">5</p>
            <p className="text-xs text-muted-foreground">Certificates</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">7</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card key={item.path} className="p-4">
                <button className="flex items-center gap-3 w-full text-left">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </Card>
            );
          })}
          
          <Card className="p-4">
            <button className="flex items-center gap-3 w-full text-left text-red-600">
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </Card>
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default MobileProfile;
