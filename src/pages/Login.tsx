import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/website-logo.png";

const promos = [
  "Welcome back! Continue your learning journey",
  "Access 1,000+ courses instantly",
  "Your AI tutor is ready to help",
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  useState(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promos.length);
    }, 3000);
    return () => clearInterval(interval);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Supabase auth
    console.log("Login:", formData);
  };

  return (
    <>
      <SEOHead
        title="Login - SimpleLecture | Access Your Courses"
        description="Login to SimpleLecture to continue your learning journey. Access AI-powered courses and track your progress."
        keywords="login, sign in, online learning, SimpleLecture login"
        canonicalUrl="https://simplelecture.com/login"
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
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Left Panel - Promotional */}
            <div className="hidden lg:flex flex-col justify-center space-y-8 pr-12">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-foreground leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    {promos[currentPromo]}
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Join thousands of students learning with AI-powered education
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">1M+</p>
                  <p className="text-sm text-muted-foreground mt-1">Active Students</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">1000+</p>
                  <p className="text-sm text-muted-foreground mt-1">Courses</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground mt-1">AI Support</p>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-card border">
                <p className="text-muted-foreground italic">
                  "SimpleLecture transformed my career. The AI tutor helped me understand complex concepts easily!"
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">RS</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Rahul Sharma</p>
                    <p className="text-sm text-muted-foreground">Data Scientist</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex items-center">
              <Card className="w-full shadow-xl">
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back!</h2>
                  <p className="text-muted-foreground mb-8">Login to continue your learning</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <Label htmlFor="email">Email</Label>
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
                      <Label htmlFor="password">Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                          checked={formData.rememberMe}
                          onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
                        />
                        <Label htmlFor="remember" className="text-sm cursor-pointer">
                          Remember me
                        </Label>
                      </div>
                      <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot Password?
                      </Link>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg">
                      Login
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
                      Sign in with Google
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    New user?{" "}
                    <Link to="/signup" className="text-primary font-semibold hover:underline">
                      Create an account
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

export default Login;
