import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-students.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Learning Platform
            </Badge>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                Master Your Future
                <span className="block bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  With AI Tutors
                </span>
              </h1>
              
              <p className="text-xl text-white/90 max-w-2xl leading-relaxed">
                Join thousands of learners advancing their skills through expert-led courses. 
                Connect with top instructors, learn anytime, and unlock new career opportunities 
                on one AI-powered platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all group"
              >
                Enroll in Courses
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                Book a Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white flex items-center justify-center"
                    >
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  ))}
                </div>
                <div className="text-white">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/80">
                    Trusted by <span className="font-bold">2,500+</span> Students
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative lg:block hidden">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <img
                src={heroImage}
                alt="Students learning together"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl animate-bounce">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Start Now!</p>
                  <p className="text-sm text-muted-foreground">Learning Anywhere, Anytime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
