import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Zap, ArrowRight } from "lucide-react";

export const PromotionalSection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-primary opacity-95" />
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Limited Time Offer
          </Badge>

          {/* Heading */}
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Transform Your Career with
            <span className="block mt-2">AI-Powered Learning</span>
          </h2>

          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Get unlimited access to 50,000+ courses, AI tutors, and expert-led content. 
            Start your journey to mastery today at 99% less cost than traditional coaching.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">99% Cost Savings</h3>
              <p className="text-white/80">Learn at a fraction of traditional coaching costs</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered Tutors</h3>
              <p className="text-white/80">24/7 personalized learning assistance</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Mastery-Based Progress</h3>
              <p className="text-white/80">Unlock topics as you master each concept</p>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 inline-block">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-left">
                  <p className="text-white/80 text-sm mb-1">Special Launch Offer</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold text-white">₹800</span>
                    <span className="text-2xl text-white/60 line-through">₹22,000</span>
                    <Badge className="bg-success text-white">Save 96%</Badge>
                  </div>
                  <p className="text-white/80 text-sm mt-1">per year</p>
                </div>
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 shadow-xl group whitespace-nowrap"
                >
                  Start Learning Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          <p className="text-white/70 text-sm">
            Join 50,000+ students already learning on SimpleLecture
          </p>
        </div>
      </div>
    </section>
  );
};
