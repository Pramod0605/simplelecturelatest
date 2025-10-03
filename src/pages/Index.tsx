import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProgramsSection } from "@/components/ProgramsSection";
import { TopCourses } from "@/components/TopCourses";
import { PromotionalSection } from "@/components/PromotionalSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProgramsSection />
        <TopCourses />
        <PromotionalSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
