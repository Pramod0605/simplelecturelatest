import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { SEOHead } from '@/components/SEO';
import { useCart } from '@/hooks/useCart';
import { formatINR } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const MobileCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();

  const discount = location.state?.discount || 0;
  const promoCode = location.state?.promoCode || null;
  const finalAmount = total - discount;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    state: '',
    city: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!acceptedTerms) {
      toast({
        title: 'Terms Required',
        description: 'Please accept terms and conditions',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create payment order with correct data structure
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-payment-order',
        {
          body: {
            userId: user.id,
            amount: finalAmount,
            courses: items.map((item) => ({
              id: item.course_id,
              price: item.course_price,
              name: item.course_name
            })),
            customerInfo: formData,
            promoCode
          },
        }
      );

      if (orderError) throw orderError;

      console.log('Order created:', orderData);

      // If Razorpay order was created, open checkout
      if (orderData.razorpayOrderId && orderData.razorpayKeyId && window.Razorpay) {
        const options = {
          key: orderData.razorpayKeyId,
          amount: finalAmount * 100,
          currency: 'INR',
          name: 'SimpleLecture',
          description: `Payment for ${items.length} course(s)`,
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#6366f1'
          },
          handler: async (response: any) => {
            console.log('Razorpay payment response:', response);
            
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'verify-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: orderData.orderId,
                  userId: user.id,
                  courses: items.map((item) => ({
                    id: item.course_id,
                    price: item.course_price
                  }))
                }
              }
            );

            if (verifyError || !verifyData?.verified) {
              toast({
                title: 'Payment Verification Failed',
                description: 'Please contact support if amount was deducted',
                variant: 'destructive',
              });
              return;
            }

            await clearCart();
            navigate('/mobile/payment-success', {
              state: {
                orderId: orderData.orderId,
                amount: finalAmount,
                programs: items.map(item => ({
                  id: item.course_id,
                  program_name: item.course_name
                })),
              },
            });
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              toast({
                title: 'Payment Cancelled',
                description: 'You cancelled the payment',
              });
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', (response: any) => {
          console.error('Payment failed:', response.error);
          toast({
            title: 'Payment Failed',
            description: response.error.description || 'Payment could not be processed',
            variant: 'destructive',
          });
          setProcessing(false);
        });
        razorpay.open();
      } else {
        // Fallback: demo mode without Razorpay
        console.log('Running in demo mode - no Razorpay configured');
        
        // Update payment status to success for demo
        await supabase
          .from('payments')
          .update({ status: 'success', completed_at: new Date().toISOString() })
          .eq('order_id', orderData.orderId);

        // Create enrollments
        for (const item of items) {
          await supabase
            .from('enrollments')
            .upsert({
              student_id: user.id,
              course_id: item.course_id,
              is_active: true,
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }, { onConflict: 'student_id,course_id' });
        }

        await clearCart();
        navigate('/mobile/payment-success', {
          state: {
            orderId: orderData.orderId,
            amount: finalAmount,
            programs: items.map(item => ({
              id: item.course_id,
              program_name: item.course_name
            })),
          },
        });
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  return (
    <>
      <SEOHead title="Checkout | SimpleLecture" description="Complete your purchase" />
      <div className="min-h-screen bg-background pb-32">
        <div className="sticky top-0 z-40 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Link to="/mobile/cart">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-lg">Checkout</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Card className="p-4">
            <h2 className="font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground line-clamp-1">{item.course_name}</span>
                  <span className="font-semibold">{formatINR(item.course_price)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {promoCode && `(${promoCode})`}</span>
                  <span>-{formatINR(discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-xl">{formatINR(finalAmount)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-bold mb-4">Contact Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-sm">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="state" className="text-sm">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-sm">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm cursor-pointer">
                  I accept the terms and conditions
                </label>
              </div>
            </form>
          </Card>
        </div>

        {/* Sticky Bottom Pay Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button
            onClick={handleSubmit}
            className="w-full"
            size="lg"
            disabled={processing}
          >
            {processing ? 'Processing...' : `Pay ${formatINR(finalAmount)}`}
          </Button>
        </div>
      </div>
    </>
  );
};

export default MobileCheckout;
