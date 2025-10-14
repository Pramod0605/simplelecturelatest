import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Eye, EyeOff, Sparkles, Users, Award, Zap, Shield, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/website-logo.png";

const promos = [
  "Welcome! Start your learning journey",
  "Access 1,000+ courses instantly",
  "Your AI tutor is ready to help",
];

const benefits = [
  { icon: Sparkles, title: "AI-Powered Tutors", description: "Get instant doubt clearing 24/7" },
  { icon: Users, title: "50,000+ Students", description: "Join our thriving community" },
  { icon: Award, title: "Certificates", description: "From top institutions" },
  { icon: Zap, title: "Fast Learning", description: "At your own pace" },
  { icon: Shield, title: "Secure & Trusted", description: "Your data is safe" },
  { icon: Smartphone, title: "Learn Anywhere", description: "Web, iOS & Android" },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePasswordChange = (password: string) => {
    setSignupData({ ...signupData, password });
    
    if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!signupData.acceptTerms) {
      toast({
        title: "Accept Terms",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signupData.fullName,
            phone: signupData.phone,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "Welcome to SimpleLecture! You can now start learning.",
      });
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Auth Failed",
        description: error.message || "Could not authenticate with Google.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SEOHead
        title={activeTab === "login" ? "Login - SimpleLecture | Access Your Courses" : "Sign Up - SimpleLecture | Start Learning Today"}
        description={activeTab === "login" ? "Login to SimpleLecture to continue your learning journey. Access AI-powered courses for 10th, PUC, NEET, JEE and more." : "Join 50,000+ students. Access AI-powered courses in Board Exams, NEET, JEE, and more. Sign up for just ₹2000/year!"}
        keywords="login, sign up, online learning India, SimpleLecture, NEET, JEE, board exams"
        canonicalUrl={`https://simplelecture.com/auth?tab=${activeTab}`}
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
            <div className="hidden lg:flex flex-col justify-center space-y-8 pr-12">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-foreground leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    {activeTab === "login" ? promos[currentPromo] : "Join 50,000+ Students"}
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  {activeTab === "login" 
                    ? "Continue your learning journey with AI-powered education" 
                    : "Transform your career with AI-powered education at just ₹2000/year"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">50K+</p>
                  <p className="text-sm text-muted-foreground mt-1">Active Students</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">100+</p>
                  <p className="text-sm text-muted-foreground mt-1">Courses</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground mt-1">AI Support</p>
                </div>
              </div>

              {activeTab === "signup" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Why Sign Up?</h2>
                  <div className="grid gap-4">
                    {benefits.slice(0, 4).map(({ icon: Icon, title, description }) => (
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
              )}

              {activeTab === "login" && (
                <div className="p-6 rounded-lg bg-card border">
                  <p className="text-muted-foreground italic">
                    "I scored 95% in II PUC and got selected for NEET with SimpleLecture's AI tutors. Best ₹2000 I ever spent!"
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">PS</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Priya Sharma</p>
                      <p className="text-sm text-muted-foreground">NEET Aspirant, Bangalore</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Auth Forms */}
            <div className="flex items-center">
              <Card className="w-full shadow-xl">
                <CardContent className="p-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    {/* Login Tab */}
                    <TabsContent value="login">
                      <div className="mb-6">
                        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back!</h2>
                        <p className="text-muted-foreground">Login to continue your learning</p>
                      </div>
                      
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            required
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative mt-1">
                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={loginData.password}
                              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                              required
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="remember"
                              checked={loginData.rememberMe}
                              onCheckedChange={(checked) => setLoginData({ ...loginData, rememberMe: checked as boolean })}
                            />
                            <Label htmlFor="remember" className="text-sm cursor-pointer">
                              Remember me
                            </Label>
                          </div>
                          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                            Forgot Password?
                          </Link>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                          {loading ? "Logging in..." : "Login"}
                        </Button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                          </div>
                        </div>

                        <Button type="button" variant="outline" className="w-full h-12" onClick={handleGoogleAuth}>
                          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Sign in with Google
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Sign Up Tab */}
                    <TabsContent value="signup">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-foreground">Create Your Account</h2>
                        <p className="text-muted-foreground">Start learning at just ₹2000/year</p>
                      </div>
                      
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={signupData.fullName}
                            onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                            required
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="signup-email">Email *</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={signupData.email}
                            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
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
                              value={signupData.phone}
                              onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                              required
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="signup-password">Password *</Label>
                          <div className="relative mt-1">
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              value={signupData.password}
                              onChange={(e) => handlePasswordChange(e.target.value)}
                              required
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
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
                          <div className="relative mt-1">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Re-enter your password"
                              value={signupData.confirmPassword}
                              onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                              required
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="terms"
                            checked={signupData.acceptTerms}
                            onCheckedChange={(checked) => setSignupData({ ...signupData, acceptTerms: checked as boolean })}
                          />
                          <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                            I accept the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                          </Label>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg" disabled={!signupData.acceptTerms || loading}>
                          {loading ? "Creating Account..." : "Start Learning Free"}
                        </Button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                          </div>
                        </div>

                        <Button type="button" variant="outline" className="w-full h-12" onClick={handleGoogleAuth}>
                          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Sign up with Google
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
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

export default Auth;
