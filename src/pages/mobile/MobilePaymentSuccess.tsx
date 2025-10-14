import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEOHead } from '@/components/SEO';
import { formatINR } from '@/lib/utils';
import confetti from 'canvas-confetti';

const MobilePaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, amount, programs } = location.state || {};

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  if (!orderId) {
    navigate('/mobile');
    return null;
  }

  return (
    <>
      <SEOHead title="Payment Successful | SimpleLecture" description="Your payment was successful" />
      <div className="min-h-screen bg-background p-4 flex items-center">
        <Card className="w-full p-6">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
            <p className="text-sm text-muted-foreground">Your payment was successful</p>
          </div>

          <div className="bg-muted p-4 rounded-lg mb-4 text-sm">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="font-mono font-semibold text-xs">{orderId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount Paid</p>
                <p className="text-lg font-bold text-green-600">{formatINR(amount)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Programs:</p>
              <div className="space-y-1">
                {programs?.map((program: any) => (
                  <div key={program.id} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-xs font-medium">{program.program_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2 text-sm">🎉 You now have access to:</h3>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>All course videos and materials</li>
              <li>AI-powered doubt clearing</li>
              <li>Practice quizzes and assignments</li>
              <li>Certificate upon completion</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Valid for:</strong> 1 Year
            </p>
          </div>

          <Button onClick={() => navigate('/mobile/dashboard')} className="w-full" size="lg">
            Go to My Dashboard
          </Button>
        </Card>
      </div>
    </>
  );
};

export default MobilePaymentSuccess;
