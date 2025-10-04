import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-students.jpg";

const promos = [
  {
    title: "Unlock Unlimited Live Classes for Your Workforce",
    points: [
      "700+ Live classes monthly",
      "550+ Learning solutions",
      "100+ Hands-on projects with labs",
    ],
    cta: "Explore SimpleLecture Learning Hub+",
  },
  {
    title: "Master Your Future With AI Tutors",
    points: [
      "AI-powered personalized learning",
      "24/7 doubt clearing with AI assistants",
      "Learn at 99% less cost than traditional tutoring",
    ],
    cta: "Start Learning Now",
  },
  {
    title: "Achieve 100% Mastery in Every Subject",
    points: [
      "Mastery-based learning approach",
      "Practice until perfect with unlimited questions",
      "Track your progress with detailed analytics",
    ],
    cta: "Join 50,000+ Students",
  },
];

export const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[75vh] flex items-center overflow-hidden bg-gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content - Scrolling Promos */}
          <div className="space-y-8">
            {promos.map((promo, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  currentSlide === index
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 absolute translate-x-8 pointer-events-none"
                }`}
              >
                <div className="space-y-6">
                  <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                    {promo.title}
                  </h1>
                  
                  <div className="space-y-4">
                    {promo.points.map((point, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                        <p className="text-lg text-white/90">{point}</p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    size="lg" 
                    className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all group mt-6"
                  >
                    {promo.cta}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Slide Indicators */}
            <div className="flex gap-2 pt-4">
              {promos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 rounded-full transition-all ${
                    currentSlide === index ? "bg-white w-8" : "bg-white/40 w-4"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="relative lg:block hidden">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={heroImage}
                alt="Students learning together"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
