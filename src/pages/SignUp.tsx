import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Sparkles, Users, Award, Zap, Shield, Smartphone } from "lucide-react";
import logo from "@/assets/simplelecture-logo.jpg";

const benefits = [
  { icon: Sparkles, title: "AI-Powered Tutors", description: "Get instant doubt clearing 24/7" },
  { icon: Users, title: "1M+ Students", description: "Join our thriving community" },
  { icon: Award, title: "Certificates", description: "From top institutions" },
  { icon: Zap, title: "Fast Learning", description: "At your own pace" },
  { icon: Shield, title: "Secure & Trusted", description: "Your data is safe" },
  { icon: Smartphone, title: "Learn Anywhere", description: "Web, iOS & Android" },
];

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    
    // Calculate password strength
    if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Supabase auth
    console.log("Sign up:", formData);
  };

  return (
    <>
      <SEOHead
        title="Sign Up - SimpleLecture | Start Learning Today"
        description="Join 1M+ students. Access AI-powered courses in Data Science, Generative AI, and more. Sign up for free and start learning!"
        keywords="sign up, register, online courses India, AI learning platform, SimpleLecture registration"
        canonicalUrl="https://simplelecture.com/signup"
      />
      
      {/* Header with Logo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <img src={logo} alt="SimpleLecture" className="h-12" />
          </Link>
        </div>
      </div>
      
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background pt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Left Panel - Promotional */}
            <div className="space-y-8 lg:pr-12">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                  Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">1M+ Students</span> Learning with SimpleLecture
                </h1>
                <p className="text-lg text-muted-foreground">
                  Transform your career with AI-powered education. Start learning today!
                </p>
              </div>

              {/* Stats Counter */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">1M+</p>
                    <p className="text-sm text-muted-foreground">Students</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">1000+</p>
                    <p className="text-sm text-muted-foreground">Courses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">99.9%</p>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                  </CardContent>
                </Card>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Why Sign Up?</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {benefits.map(({ icon: Icon, title, description }) => (
                    <div key={title} className="flex gap-3 p-4 rounded-lg bg-card hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="hidden lg:block">
                <p className="text-sm text-muted-foreground mb-3">Trusted by students from:</p>
                <div className="flex gap-4 items-center">
                  <div className="px-4 py-2 bg-card rounded-lg">
                    <p className="font-semibold text-foreground">IIT Partnership</p>
                  </div>
                  <div className="px-4 py-2 bg-card rounded-lg">
                    <p className="font-semibold text-foreground">🔒 Secure Payment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Sign Up Form */}
            <div>
              <Card className="shadow-xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Create Your Account</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="flex gap-2 mt-1">
                        <div className="w-16 flex items-center justify-center bg-muted rounded-md border">
                          <span className="text-sm font-medium">+91</span>
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="9876543210"
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
                        className="mt-1"
                      />
                      <div className="mt-2 flex gap-1">
                        <div className={`h-1 flex-1 rounded ${passwordStrength === "weak" ? "bg-red-500" : passwordStrength === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                        <div className={`h-1 flex-1 rounded ${passwordStrength === "medium" || passwordStrength === "strong" ? "bg-yellow-500" : "bg-muted"}`} />
                        <div className={`h-1 flex-1 rounded ${passwordStrength === "strong" ? "bg-green-500" : "bg-muted"}`} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Strength: <span className="font-semibold capitalize">{passwordStrength}</span>
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                      />
                      <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                        I accept the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg" disabled={!formData.acceptTerms}>
                      Start Learning Free
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <Button type="button" variant="outline" className="w-full h-12">
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign up with Google
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary font-semibold hover:underline">
                      Login
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default SignUp;
