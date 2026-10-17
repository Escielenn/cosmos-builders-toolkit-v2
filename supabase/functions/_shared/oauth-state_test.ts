// Run: deno test supabase/functions/_shared/oauth-state_test.ts
import { deepStrictEqual as assertEquals, ok } from 'node:assert';
import { signState, verifyState } from './oauth-state.ts';

const SECRET = 'test-secret';
const MIN = 60_000;

Deno.test('a signed state verifies and round-trips the user', async () => {
  const s = await signState({ userId: 'u1', timestamp: 1_000_000 }, SECRET);
  const v = await verifyState(s, SECRET, 15 * MIN, 1_000_000 + MIN);
  assertEquals(v?.userId, 'u1');
});

Deno.test('the old unsigned format is rejected', async () => {
  const legacy = btoa(JSON.stringify({ userId: 'victim', timestamp: Date.now() }));
  assertEquals(await verifyState(legacy, SECRET, 15 * MIN), null);
});

Deno.test('changing the user id breaks the signature', async () => {
  const s = await signState({ userId: 'attacker', timestamp: Date.now() }, SECRET);
  const [, sig] = s.split('.');
  const forgedBody = btoa(JSON.stringify({ userId: 'victim', timestamp: Date.now(), nonce: 'x' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  assertEquals(await verifyState(`${forgedBody}.${sig}`, SECRET, 15 * MIN), null);
});

Deno.test('a different secret does not verify', async () => {
  const s = await signState({ userId: 'u1', timestamp: Date.now() }, SECRET);
  assertEquals(await verifyState(s, 'other-secret', 15 * MIN), null);
});

Deno.test('expired and future-dated states are rejected', async () => {
  const s = await signState({ userId: 'u1', timestamp: 1_000_000 }, SECRET);
  assertEquals(await verifyState(s, SECRET, 15 * MIN, 1_000_000 + 16 * MIN), null);
  assertEquals(await verifyState(s, SECRET, 15 * MIN, 1_000_000 - 2 * MIN), null);
});

Deno.test('garbage is rejected without throwing', async () => {
  for (const g of ['', 'a.b.c', 'no-dot', '!!!.###', 'eyJ.@@']) {
    assertEquals(await verifyState(g, SECRET, 15 * MIN), null);
  }
  ok(true);
});
