import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEOHead } from '@/components/SEO';
import { SmartHeader } from '@/components/SmartHeader';
import { Footer } from '@/components/Footer';
import { formatINR } from '@/lib/utils';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, amount, courses } = location.state || {};

  useEffect(() => {
    // Confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  if (!orderId) {
    navigate('/');
    return null;
  }

  return (
    <>
      <SEOHead title="Payment Successful | SimpleLecture" description="Your payment was successful" />
      <SmartHeader />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-4 md:p-8">
          <div className="text-center mb-6 md:mb-8">
            <CheckCircle className="h-16 w-16 md:h-20 md:w-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Thank You for Your Purchase!</h1>
            <p className="text-sm md:text-base text-muted-foreground">Your payment was successful</p>
          </div>

          <div className="bg-muted p-4 md:p-6 rounded-lg mb-4 md:mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono font-semibold">{orderId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatINR(amount)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Courses Purchased:</p>
              <div className="space-y-2">
                {courses?.map((course: any) => (
                  <div key={course.id} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{course.course_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-primary/10 p-6 rounded-lg mb-6">
            <h3 className="font-bold mb-3 text-lg">Enrollment Confirmed!</h3>
            <p className="mb-3 text-sm">You now have full access to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm mb-4">
              <li>All course videos and materials</li>
              <li>AI-powered doubt clearing assistant</li>
              <li>Practice quizzes and assignments</li>
              <li>Daily practice tests (DPT)</li>
              <li>Certificate upon completion</li>
              <li>Live doubt sessions (if applicable)</li>
            </ul>
            <div className="bg-background/80 p-3 rounded-md">
              <p className="text-sm font-semibold">
                Access valid for: <span className="text-primary">1 Year from today</span>
              </p>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground mb-6">
            <p>A confirmation email has been sent to your registered email address</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Button onClick={() => navigate('/student-dashboard')} className="flex-1" size="lg">
              Go to My Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Receipt
            </Button>
          </div>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default PaymentSuccess;
