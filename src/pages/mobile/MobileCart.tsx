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
import { BottomNav } from '@/components/mobile/BottomNav';

const MobileCart = () => {
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
        <div className="min-h-screen bg-background pb-20">
          <div className="sticky top-0 z-40 bg-background border-b p-4">
            <div className="flex items-center gap-3">
              <Link to="/mobile/programs">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="font-semibold text-lg">Shopping Cart</h1>
            </div>
          </div>

          <div className="p-4">
            <Card className="p-8 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6 text-sm">Start exploring our programs</p>
              <Link to="/mobile/programs">
                <Button size="lg">Explore Programs</Button>
              </Link>
            </Card>
          </div>

          <BottomNav />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Shopping Cart | SimpleLecture" description="Review your selected programs" />
      <div className="min-h-screen bg-background pb-32">
        <div className="sticky top-0 z-40 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Link to="/mobile/programs">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-lg">Shopping Cart ({items.length})</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 line-clamp-2">{item.course_name}</h3>
                  <p className="text-lg font-bold text-primary">{formatINR(item.course_price)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.id)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}

          <Card className="p-4">
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
                <span className="text-2xl">{formatINR(finalAmount)}</span>
              </div>
            </div>

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
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sticky Bottom Checkout Button */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t">
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate('/mobile/checkout', { state: { discount, discountCode } })}
          >
            Proceed to Checkout • {formatINR(finalAmount)}
          </Button>
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default MobileCart;
