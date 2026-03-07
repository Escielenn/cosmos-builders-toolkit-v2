import { getCorsHeaders } from '../_shared/cors.ts';
import { stripe, getPriceId } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.0';

const ALLOWED_REDIRECT_BASE = 'https://stellarforge.tools';

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
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

    const { priceType, tier = 'pro' } = await req.json();

    if (!priceType || !['monthly', 'yearly'].includes(priceType)) {
      throw new Error('Invalid price type');
    }

    if (!['pro', 'vanguard'].includes(tier)) {
      throw new Error('Invalid tier');
    }

    const priceId = getPriceId(tier, priceType);
    if (!priceId) {
      throw new Error(`Price ID not configured for ${tier} ${priceType}. Check Stripe secret env vars.`);
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

    // Create checkout session with hardcoded trusted redirect URLs
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${ALLOWED_REDIRECT_BASE}/pricing?success=true`,
      cancel_url: `${ALLOWED_REDIRECT_BASE}/pricing?canceled=true`,
      subscription_data: {
        metadata: { supabase_user_id: user.id, tier },
      },
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
