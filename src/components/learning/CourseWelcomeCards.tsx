import { Star, FileText, Brain, Headphones, ClipboardCheck, BookOpen, Video, Award, Sparkles, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

const instructions = [
  { icon: Star, text: "Star important questions and find them easily in your tests!", color: "text-yellow-500" },
  { icon: FileText, text: "Previous year papers are waiting - practice like the real exam!", color: "text-blue-500" },
  { icon: Brain, text: "Got stuck? Ask our AI Assistant - it never sleeps!", color: "text-purple-500" },
  { icon: Headphones, text: "Listen to podcasts while chilling - learn on the go!", color: "text-green-500" },
  { icon: ClipboardCheck, text: "Track your progress with MCQs after every topic!", color: "text-orange-500" },
  { icon: BookOpen, text: "Notes are your best friends - read them anytime, anywhere!", color: "text-pink-500" },
  { icon: Video, text: "Watch video lectures at your own pace - pause, rewind, repeat!", color: "text-red-500" },
  { icon: Award, text: "Complete assignments to unlock your potential!", color: "text-indigo-500" },
  { icon: Target, text: "DPT tests help you master the trickiest questions!", color: "text-teal-500" },
  { icon: Sparkles, text: "Select a chapter from the sidebar to begin your journey!", color: "text-amber-500" },
];

interface CourseWelcomeCardsProps {
  courseName: string;
}

export function CourseWelcomeCards({ courseName }: CourseWelcomeCardsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Welcome to {courseName}! 🎉</h3>
        <p className="text-muted-foreground text-sm">Here's what you can do here</p>
      </div>

      {/* Scrolling Cards Container */}
      <div className="relative h-[350px] w-full max-w-lg overflow-hidden">
        {/* Gradient mask - top */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        
        {/* Gradient mask - bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling cards */}
        <div className="animate-scroll-up hover:pause-animation space-y-3 py-8">
          {/* Duplicate cards for seamless infinite scroll */}
          {[...instructions, ...instructions].map((item, index) => (
            <Card 
              key={index}
              className="mx-4 p-4 flex items-center gap-4 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 hover:scale-[1.02] transition-all duration-300 cursor-default"
            >
              <div className={`p-2 rounded-full bg-background/80 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground/90">{item.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
