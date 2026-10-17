import {
  stripe,
  getTierFromPriceId,
  subscriptionPeriod,
  invoiceSubscriptionId,
  unixToIso,
  isLiveKey,
} from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';

// deno-lint-ignore no-explicit-any
type StripeObject = Record<string, any>;

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 });
  }

  let event: StripeObject;

  try {
    event = await stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  console.log('Received event:', event.type, event.id);

  // Mode mismatch is logged, not rejected: rejecting would stop billing
  // outright if the key and endpoint were ever deliberately mixed. The log
  // line makes a misconfiguration visible.
  if (typeof event.livemode === 'boolean' && event.livemode !== isLiveKey()) {
    console.warn(
      `Mode mismatch: event ${event.id} livemode=${event.livemode} but STRIPE_SECRET_KEY is ${isLiveKey() ? 'live' : 'test'}`
    );
  }

  // Idempotency: Stripe retries and can deliver an event more than once.
  // Every handler below is safe to repeat (upserts and status reads), so a
  // duplicate is harmless; skipping it saves work and keeps the log honest.
  if (await alreadyProcessed(event.id)) {
    console.log('Duplicate event skipped:', event.id);
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionChange(event.data.object);
        break;
      }

      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object);
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const subscriptionId = invoiceSubscriptionId(event.data.object);
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await handleSubscriptionChange(subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed for invoice:', invoice.id);
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (subscriptionId) {
          await handlePaymentFailed(subscriptionId);
        }
        break;
      }
    }

    await markProcessed(event);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});

async function alreadyProcessed(eventId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('stripe_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();
  if (error) {
    // Never block billing on the bookkeeping table.
    console.warn('stripe_events lookup failed, processing anyway:', error.message);
    return false;
  }
  return !!data;
}

async function markProcessed(event: StripeObject): Promise<void> {
  const { error } = await supabaseAdmin
    .from('stripe_events')
    .upsert(
      { id: event.id, type: event.type, livemode: !!event.livemode },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  if (error) console.warn('stripe_events insert failed:', error.message);
}

async function handleSubscriptionChange(subscription: StripeObject) {
  // Try to get user_id from subscription metadata first
  let userId = subscription.metadata?.supabase_user_id;

  // Fallback: look up user by stripe_customer_id in profiles
  if (!userId && subscription.customer) {
    console.log('Looking up user by stripe_customer_id:', subscription.customer);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .maybeSingle();

    if (profile) {
      userId = profile.id;
      console.log('Found user via stripe_customer_id:', userId);
    }
  }

  if (!userId) {
    console.error('Could not determine user for subscription:', subscription.id);
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planType = subscription.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

  // Determine tier: prefer metadata (set during checkout), fallback to price ID mapping
  const tier = subscription.metadata?.tier || (priceId ? getTierFromPriceId(priceId) : 'pro');

  const period = subscriptionPeriod(subscription);

  // deno-lint-ignore no-explicit-any
  const subscriptionData: Record<string, any> = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    price_id: priceId,
    plan_type: planType,
    tier,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: unixToIso(subscription.canceled_at),
  };
  // Only write period fields we could read; never overwrite with null.
  if (period.start) subscriptionData.current_period_start = period.start;
  if (period.end) subscriptionData.current_period_end = period.end;
  if (!period.start || !period.end) {
    console.warn('Subscription period missing from payload:', subscription.id);
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }

  console.log('Subscription updated:', subscription.id, subscription.status);
}

async function handleSubscriptionDeleted(subscription: StripeObject) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: unixToIso(subscription.canceled_at) ?? new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating deleted subscription:', error);
    throw error;
  }

  console.log('Subscription deleted:', subscription.id);
}

async function handlePaymentFailed(subscriptionId: string) {
  // Read the subscription's current state from Stripe instead of hard-setting
  // past_due: events can arrive out of order, and a later successful retry
  // must not be overwritten by an earlier failure.
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionChange(subscription);
    console.log('Subscription refreshed after payment failure:', subscriptionId, subscription.status);
    return;
  } catch (err) {
    console.warn('Could not refetch subscription, falling back to past_due:', (err as Error).message);
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId)
    .in('status', ['active', 'trialing']);

  if (error) {
    console.error('Error updating subscription for payment failure:', error);
    throw error;
  }

  console.log('Subscription marked as past_due:', subscriptionId);
}
