import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SEOHead } from '@/components/SEO';
import { useCart } from '@/hooks/useCart';
import { formatINR } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Cart = () => {
  const { items, loading, removeFromCart, total } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const applyDiscount = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: 'Invalid Code',
          description: 'Discount code not found or expired',
          variant: 'destructive',
        });
        return;
      }

      const discountAmount = data.discount_percent
        ? (total * data.discount_percent) / 100
        : data.discount_amount || 0;

      setDiscount(discountAmount);
      setDiscountApplied(true);
      toast({
        title: 'Discount Applied',
        description: `You saved ${formatINR(discountAmount)}!`,
      });
    } catch (error) {
      console.error('Error applying discount:', error);
    }
  };

  const finalAmount = total - discount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <SEOHead title="Shopping Cart | SimpleLecture" description="Your shopping cart" />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto p-8 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Start exploring our courses</p>
              <Link to="/courses">
                <Button size="lg">Explore Courses</Button>
              </Link>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Shopping Cart | SimpleLecture" description="Review your selected programs" />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Link to="/courses">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>

          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item.program_name}</h3>
                      <p className="text-2xl font-bold text-primary">{formatINR(item.program_price)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatINR(total)}</span>
                  </div>

                  {discountApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatINR(discount)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatINR(finalAmount)}</span>
                  </div>
                </div>

                {/* Discount Code */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Discount Code</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      disabled={discountApplied}
                    />
                    <Button
                      onClick={applyDiscount}
                      disabled={discountApplied || !discountCode}
                      variant="outline"
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/checkout', { state: { discount, discountCode } })}
                >
                  Proceed to Checkout
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
