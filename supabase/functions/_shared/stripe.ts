import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

export const PRICE_IDS = {
  monthly: Deno.env.get('STRIPE_MONTHLY_PRICE_ID')!,
  yearly: Deno.env.get('STRIPE_YEARLY_PRICE_ID')!,
};
