import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 });
  }

  let event;

  try {
    event = await stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  console.log('Received event:', event.type);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionChange(subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed for invoice:', invoice.id);
        if (invoice.subscription) {
          await handlePaymentFailed(invoice.subscription as string);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function handleSubscriptionChange(subscription: any) {
  // Try to get user_id from subscription metadata first
  let userId = subscription.metadata?.supabase_user_id;

  // Fallback: look up user by stripe_customer_id in profiles
  if (!userId && subscription.customer) {
    console.log('Looking up user by stripe_customer_id:', subscription.customer);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (profile) {
      userId = profile.id;
      console.log('Found user via stripe_customer_id:', userId);
    }
  }

  if (!userId) {
    console.error('Could not determine user for subscription:', subscription.id);
    return;
  }

  const priceId = subscription.items?.data[0]?.price?.id;
  const planType = subscription.items?.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    price_id: priceId,
    plan_type: planType,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  };

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

async function handleSubscriptionDeleted(subscription: any) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating deleted subscription:', error);
    throw error;
  }

  console.log('Subscription deleted:', subscription.id);
}

async function handlePaymentFailed(subscriptionId: string) {
  // Update subscription status to past_due
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription for payment failure:', error);
    throw error;
  }

  console.log('Subscription marked as past_due:', subscriptionId);
}
