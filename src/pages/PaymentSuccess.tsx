import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEOHead } from '@/components/SEO';
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8">
          <div className="text-center mb-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Thank You for Your Purchase!</h1>
            <p className="text-muted-foreground">Your payment was successful</p>
          </div>

          <div className="bg-muted p-6 rounded-lg mb-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
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
                    <span className="font-medium">{course.program_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-primary/10 p-6 rounded-lg mb-6">
            <h3 className="font-bold mb-2">🎉 You now have access to:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All course videos and materials</li>
              <li>AI-powered doubt clearing assistant</li>
              <li>Practice quizzes and assignments</li>
              <li>Daily practice tests (DPT)</li>
              <li>Certificate upon completion</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              <strong>Access valid for:</strong> 1 Year from today
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground mb-6">
            <p>✉️ A confirmation email has been sent to your registered email address</p>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => navigate('/dashboard')} className="flex-1" size="lg">
              Go to My Dashboard
            </Button>
            <Button variant="outline" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Receipt
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default PaymentSuccess;
