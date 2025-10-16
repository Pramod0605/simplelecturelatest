import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ExploreProgramsSection } from "@/components/ExploreProgramsSection";
import { BestsellersSection } from "@/components/BestsellersSection";
import { TopCourses } from "@/components/TopCourses";
import { PromotionalSection } from "@/components/PromotionalSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO";
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo/structuredData";

const Index = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      generateOrganizationSchema(),
      generateWebsiteSchema()
    ]
  };

  return (
    <>
      <SEOHead
        title="AI-Powered Learning Platform | Master Your Future"
        description="India's first AI-powered learning platform for board exams, entrance tests, and skill development. Learn from AI tutors at 99% less cost. Join 50,000+ students mastering their future."
        keywords="AI tutoring, online learning, NEET, JEE, board exams, entrance exams, skill development, mastery-based learning, affordable education"
        canonicalUrl="https://9b289e9b-2c66-4e4a-8ec5-e3ca4d126fbb.lovableproject.com"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <ExploreProgramsSection />
          <BestsellersSection />
          <TopCourses />
          <PromotionalSection />
          <TestimonialsSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
