import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  text: string;
  course: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Priya Sharma",
    role: "NEET Qualifier",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    rating: 5,
    text: "SimpleLecture's AI tutor helped me understand complex biology concepts at my own pace. The mastery-based approach ensured I was truly prepared for NEET. Scored 680/720!",
    course: "NEET Mastery Program",
  },
  {
    id: "2",
    name: "Rahul Kumar",
    role: "JEE Advanced Rank 342",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    rating: 5,
    text: "The AI-generated MCQs and doubt-clearing feature were game-changers. I could practice unlimited questions and get instant explanations. Best investment for JEE prep!",
    course: "JEE Advanced Program",
  },
  {
    id: "3",
    name: "Ananya Reddy",
    role: "12th Board Topper",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    rating: 5,
    text: "From struggling with physics to scoring 98%. The chapter-wise progression and AI tutor made learning so structured. My parents loved the progress reports too!",
    course: "12th Board Excellence",
  },
  {
    id: "4",
    name: "Arjun Patel",
    role: "CET State Rank 89",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    rating: 5,
    text: "At just ₹800/year, this is 100x better than my ₹80,000 coaching. AI tutor was available 24/7, no traveling, and personalized attention. Highly recommended!",
    course: "CET Booster",
  },
  {
    id: "5",
    name: "Sneha Desai",
    role: "Web Developer",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80",
    rating: 5,
    text: "The skill development courses are incredible. Learned full-stack development in 6 months with AI-powered practice projects. Landed my dream job!",
    course: "Web Development Bootcamp",
  },
  {
    id: "6",
    name: "Vikram Singh",
    role: "MBA Aspirant",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    rating: 5,
    text: "The adaptive learning path and AI-generated mock tests were perfect for CAT prep. Cleared with 99.2 percentile. SimpleLecture is the future of education!",
    course: "MBA Entrance Program",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <Badge className="mb-4">Success Stories</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Our <span className="bg-gradient-primary bg-clip-text text-transparent">Students Say</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful learners who transformed their careers
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id}
              className="relative hover:shadow-hover transition-all duration-300 group overflow-hidden"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-16 h-16 text-primary" />
              </div>

              <CardContent className="pt-6">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Course Badge */}
                <Badge variant="secondary" className="mb-6 text-xs">
                  {testimonial.course}
                </Badge>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="relative">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-background flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16">
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              50K+
            </div>
            <p className="text-muted-foreground">Active Students</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              4.8/5
            </div>
            <p className="text-muted-foreground">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              95%
            </div>
            <p className="text-muted-foreground">Success Rate</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              24/7
            </div>
            <p className="text-muted-foreground">AI Support</p>
          </div>
        </div>
      </div>
    </section>
  );
};
