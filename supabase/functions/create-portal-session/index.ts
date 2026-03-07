import { getCorsHeaders } from '../_shared/cors.ts';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.0';

const ALLOWED_REDIRECT_BASE = 'https://stellarforge.tools';

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
    );

    // Extract the JWT token from the Bearer header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Get customer ID from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${ALLOWED_REDIRECT_BASE}/profile`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Portal session error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
