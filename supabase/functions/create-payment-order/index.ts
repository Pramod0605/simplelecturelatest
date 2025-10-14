import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, programs, customerInfo } = await req.json();
    
    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, integrate with Razorpay here
    // const razorpay = new Razorpay({ key_id: 'YOUR_KEY', key_secret: 'YOUR_SECRET' });
    // const order = await razorpay.orders.create({ amount: amount * 100, currency: 'INR' });
    
    return new Response(
      JSON.stringify({ orderId, amount, status: 'created' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
