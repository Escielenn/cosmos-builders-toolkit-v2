// Run: deno test --allow-env supabase/functions/_shared/stripe_test.ts
import { deepStrictEqual as assertEquals } from 'node:assert';
import { subscriptionPeriod, invoiceSubscriptionId, unixToIso } from './stripe.ts';

const START = 1760000000; // 2025-10-09T08:53:20Z
const END = 1762678400;   // 2025-11-09T08:53:20Z

Deno.test('subscriptionPeriod reads the pre-basil top-level shape', () => {
  const sub = { current_period_start: START, current_period_end: END, items: { data: [{}] } };
  assertEquals(subscriptionPeriod(sub), {
    start: '2025-10-09T08:53:20.000Z',
    end: '2025-11-09T08:53:20.000Z',
  });
});

Deno.test('subscriptionPeriod reads the basil item-level shape', () => {
  const sub = { items: { data: [{ current_period_start: START, current_period_end: END }] } };
  assertEquals(subscriptionPeriod(sub), {
    start: '2025-10-09T08:53:20.000Z',
    end: '2025-11-09T08:53:20.000Z',
  });
});

Deno.test('subscriptionPeriod returns nulls instead of throwing on a missing period', () => {
  assertEquals(subscriptionPeriod({ items: { data: [] } }), { start: null, end: null });
  assertEquals(subscriptionPeriod({}), { start: null, end: null });
});

Deno.test('invoiceSubscriptionId reads every known shape', () => {
  assertEquals(invoiceSubscriptionId({ subscription: 'sub_legacy' }), 'sub_legacy');
  assertEquals(invoiceSubscriptionId({ subscription: { id: 'sub_expanded' } }), 'sub_expanded');
  assertEquals(
    invoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_basil' } } }),
    'sub_basil',
  );
  assertEquals(invoiceSubscriptionId({ subscription: null }), null);
  assertEquals(invoiceSubscriptionId({}), null);
});

Deno.test('unixToIso rejects non-numbers', () => {
  assertEquals(unixToIso(null), null);
  assertEquals(unixToIso(undefined), null);
  assertEquals(unixToIso('1760000000'), null);
  assertEquals(unixToIso(Number.NaN), null);
});
