import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEOHead } from '@/components/SEO';
import { SmartHeader } from '@/components/SmartHeader';
import { Footer } from '@/components/Footer';

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Payment Failed | SimpleLecture" description="Payment failed" />
      <SmartHeader />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <XCircle className="h-20 w-20 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't process your payment. Please try again.
          </p>

          <div className="space-y-3">
            <Button onClick={() => navigate('/cart')} className="w-full" size="lg">
              Retry Payment
            </Button>
            <Button onClick={() => navigate('/courses')} variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Need help? <a href="mailto:support@simplelecture.com" className="text-primary underline">Contact Support</a>
          </p>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default PaymentFailed;
