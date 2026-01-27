import { corsHeaders } from '../_shared/cors.ts';
import { stripe, PRICE_IDS } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.0';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the user from the auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
    );

    // Extract the JWT token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { priceType, successUrl, cancelUrl } = await req.json();

    if (!priceType || !['monthly', 'yearly'].includes(priceType)) {
      throw new Error('Invalid price type');
    }

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: PRICE_IDS[priceType as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/pricing?success=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?canceled=true`,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
