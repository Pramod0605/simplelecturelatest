import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, courses, customerInfo, promoCode, userId } = await req.json();
    
    console.log('Payment order request:', { amount, courses, customerInfo, promoCode, userId });

    if (!userId || !courses || courses.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate discount if promo code provided
    let discountAmount = 0;
    let promoCodeId = null;

    if (promoCode) {
      const { data: discount } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .single();

      if (discount && discount.is_active) {
        promoCodeId = discount.id;
        if (discount.discount_percent) {
          discountAmount = Math.round((amount * discount.discount_percent) / 100);
        } else if (discount.discount_amount) {
          discountAmount = discount.discount_amount;
        }
      }
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        user_id: userId,
        amount_inr: amount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        status: 'completed', // In production, this would be 'pending' until Razorpay confirms
        payment_gateway: 'razorpay',
        metadata: { customerInfo, promoCode: promoCode || null }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      throw paymentError;
    }

    console.log('Payment created:', payment.id);

    // Create order items
    const orderItems = courses.map((course: any) => ({
      payment_id: payment.id,
      course_id: course.id,
      price_inr: course.price || finalAmount
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      throw orderItemsError;
    }

    console.log('Order items created');

    // Create enrollments for each course
    const enrollments = courses.map((course: any) => ({
      student_id: userId,
      course_id: course.id,
      is_active: true,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    }));

    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .insert(enrollments);

    if (enrollmentError) {
      console.error('Error creating enrollments:', enrollmentError);
      throw enrollmentError;
    }

    console.log('Enrollments created');

    // Increment promo code usage
    if (promoCodeId) {
      await supabase
        .from('discount_codes')
        .update({ times_used: supabase.rpc('increment', { row_id: promoCodeId }) })
        .eq('id', promoCodeId);

      console.log('Promo code usage incremented');
    }

    return new Response(
      JSON.stringify({ 
        orderId, 
        amount: finalAmount, 
        status: 'created',
        paymentId: payment.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Payment order error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
