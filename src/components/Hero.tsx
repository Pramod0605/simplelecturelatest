import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import heroBoardExams from "@/assets/hero-board-exams.jpg";
import heroNeet from "@/assets/hero-neet.jpg";
import heroJee from "@/assets/hero-jee.jpg";
import heroIntegrated from "@/assets/hero-integrated.jpg";

const heroSlides = [
  {
    title: "Score 90+ in Your Board Exams",
    subtitle: "10th, I PUC, II PUC - Complete AI-Powered Coaching",
    points: [
      "All subjects covered (Physics, Chemistry, Maths, Biology)",
      "24/7 AI doubt clearing in Hindi, English, Kannada",
      "Unlimited practice questions & tests",
    ],
    cta: "Start Learning at Just ₹2000/Year",
    image: heroBoardExams,
  },
  {
    title: "Crack NEET with AI-Powered Tutoring",
    subtitle: "99% Cost Reduction. 100% Success Rate.",
    points: [
      "Physics, Chemistry, Biology - Complete Coverage",
      "AI-generated mock tests matching NEET pattern",
      "Personalized weak area improvement",
    ],
    cta: "Join 50,000+ NEET Aspirants at ₹2000",
    image: heroNeet,
  },
  {
    title: "IIT Dreams Made Affordable",
    subtitle: "Complete JEE Main & Advanced Preparation",
    points: [
      "PCM with problem-solving techniques",
      "AI tutor explains every concept until mastery",
      "Previous years' papers & video solutions",
    ],
    cta: "Begin Your JEE Journey - ₹2000 Only",
    image: heroJee,
  },
  {
    title: "Excel in Both Board Exams & Entrance Tests",
    subtitle: "PUC + NEET or PUC + JEE Integrated",
    points: [
      "Dual preparation strategy",
      "Same syllabus, smarter approach",
      "Save time, maximize results",
    ],
    cta: "Get 2-Year Access - Just ₹2000",
    image: heroIntegrated,
  },
];

export const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentSlide === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/60" />
        </div>
      ))}

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl">
          {/* Content */}
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ${
                currentSlide === index
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 absolute -translate-x-8 pointer-events-none"
              }`}
            >
              <div className="space-y-6 animate-fade-in">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                  {slide.title}
                </h1>
                
                <p className="text-xl md:text-2xl text-white/90 font-medium">
                  {slide.subtitle}
                </p>
                
                <div className="space-y-4 pt-4">
                  {slide.points.map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                      <p className="text-lg md:text-xl text-white/95">{point}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <Button 
                    size="lg" 
                    className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all group text-lg px-8 py-6 h-auto"
                  >
                    {slide.cta}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Slide Indicators */}
          <div className="flex gap-2 pt-12">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 rounded-full transition-all ${
                  currentSlide === index ? "bg-white w-12" : "bg-white/40 w-8"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
