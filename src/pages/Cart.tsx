import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SEOHead } from '@/components/SEO';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/hooks/useCart';
import { formatINR } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Cart = () => {
  const { items, loading, removeFromCart, total } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    };

    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  if (checkingAuth || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <>
        <SEOHead title="Shopping Cart | SimpleLecture" description="Your shopping cart" />
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto p-8 text-center">
              <LogIn className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground mb-6">
                Please login or sign up to view your cart and make purchases
              </p>
              <div className="flex gap-3">
                <Link to="/auth?tab=login" className="flex-1">
                  <Button size="lg" className="w-full">Login</Button>
                </Link>
                <Link to="/auth?tab=signup" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full">Sign Up</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <SEOHead title="Shopping Cart | SimpleLecture" description="Your shopping cart" />
        <Header />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto p-8 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Start exploring our programs</p>
              <Link to="/programs">
                <Button size="lg">Explore Programs</Button>
              </Link>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead title="Shopping Cart | SimpleLecture" description="Review your selected programs" />
      <Header />
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
                      <h3 className="font-semibold text-lg mb-1">{item.course_name}</h3>
                      <p className="text-2xl font-bold text-primary">{formatINR(item.course_price)}</p>
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
      <Footer />
    </>
  );
};

export default Cart;
