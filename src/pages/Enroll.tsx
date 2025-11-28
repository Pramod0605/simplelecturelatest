import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  Tag, 
  Sparkles,
  ArrowLeft,
  Shield,
  Clock,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const Enroll = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate = useNavigate();
  const { data: userData } = useCurrentUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [discount, setDiscount] = useState<any>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    state: '',
    city: '',
  });

  // Pre-fill form data from user profile
  useEffect(() => {
    if (userData?.profile) {
      setFormData({
        fullName: userData.profile.full_name || '',
        email: userData.email || '',
        phone: userData.profile.phone_number || '',
        state: '',
        city: '',
      });
    }
  }, [userData]);

  // Fetch course details
  const { data: course, isLoading } = useQuery({
    queryKey: ['course-enroll', courseSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_subjects (
            popular_subjects (
              name
            )
          )
        `)
        .eq('slug', courseSlug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!courseSlug,
  });

  // Check if user is already enrolled
  useEffect(() => {
    const checkEnrollment = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !course) return;

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', course.id)
        .eq('is_active', true)
        .single();

      if (enrollment) {
        toast.info('You are already enrolled in this course');
        navigate('/dashboard');
      }
    };

    checkEnrollment();
  }, [course, navigate]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !course) return;
    
    setIsApplyingPromo(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { code: promoCode.toUpperCase(), course_id: course.id }
      });

      if (error) throw error;

      if (data.valid) {
        setDiscount(data);
        toast.success('Promo code applied successfully!');
      } else {
        toast.error(data.message || 'Invalid promo code');
        setDiscount(null);
      }
    } catch (error: any) {
      console.error('Error applying promo:', error);
      toast.error('Failed to apply promo code');
      setDiscount(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const calculateFinalPrice = () => {
    if (!course) return 0;
    const basePrice = course.price_inr || 0;
    
    if (!discount) return basePrice;

    if (discount.discount_percent) {
      return basePrice - (basePrice * discount.discount_percent / 100);
    } else if (discount.discount_amount) {
      return Math.max(0, basePrice - discount.discount_amount);
    }
    
    return basePrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (!course) return;

    // Validate form
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to continue');
        navigate('/auth');
        return;
      }

      const finalAmount = calculateFinalPrice();
      
      // Create payment order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-payment-order', {
        body: {
          amount: finalAmount,
          courses: [{ id: course.id, name: course.name, price: finalAmount }],
          customerInfo: formData,
          promoCode: discount ? promoCode.toUpperCase() : null,
          userId: user.id
        }
      });

      if (orderError) throw orderError;

      // Simulate payment success (in production, integrate with Razorpay)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('Enrollment successful!');
      
      navigate('/payment-success', {
        state: {
          orderId: orderData.orderId,
          amount: finalAmount,
          courses: [{ id: course.id, course_name: course.name }]
        }
      });
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast.error(error.message || 'Failed to process enrollment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Skeleton className="h-96 mb-8" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Course Not Found</h1>
            <Button asChild>
              <Link to="/programs">Browse All Programs</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const subjects = course.course_subjects?.map((cs: any) => cs.popular_subjects?.name).filter(Boolean) || [];
  const originalPrice = course.price_inr || 0;
  const finalPrice = calculateFinalPrice();
  const discountAmount = originalPrice - finalPrice;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`Enroll in ${course.name} | SimpleLecture`}
        description={`Enroll in ${course.name} and start learning today`}
      />
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to={`/programs/${courseSlug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Enrollment Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Complete Your Enrollment</CardTitle>
                  <p className="text-muted-foreground">Fill in your details to get started</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="Your state"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Your city"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm cursor-pointer">
                        I agree to the terms and conditions and privacy policy
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isProcessing || !agreedToTerms}
                    >
                      {isProcessing ? 'Processing...' : `Pay ₹${finalPrice.toLocaleString()}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Course Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.name}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{course.name}</h3>
                    {subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {subjects.map((subject: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Promo Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="h-5 w-5" />
                    Have a Promo Code?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={!!discount}
                    />
                    {discount ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDiscount(null);
                          setPromoCode('');
                        }}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCode.trim()}
                      >
                        {isApplyingPromo ? 'Checking...' : 'Apply'}
                      </Button>
                    )}
                  </div>
                  {discount && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        ✓ {discount.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Price Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Price Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Course Price</span>
                    <span>₹{originalPrice.toLocaleString()}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{finalPrice.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* What's Included */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    What's Included
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Full course access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>1 Year validity</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Certificate on completion</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Secure payment</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Enroll;
