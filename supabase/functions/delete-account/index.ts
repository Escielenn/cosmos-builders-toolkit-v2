// delete-account: permanently deletes the signed-in user's account.
//
// Order matters. Billing is stopped first, and if Stripe cannot confirm that,
// nothing else happens: an account must never be deleted while it is still
// being charged. Then contributions to other people's worlds are re-credited
// to those worlds' owners (prepare_account_deletion), uploaded files are
// removed, and finally the auth user is deleted, which cascades through every
// user-owned table.
//
// verify_jwt is off in config.toml, matching the other functions: the JWT is
// verified below with auth.getUser(), and the request must also carry an
// explicit typed confirmation.

import { getCorsHeaders } from '../_shared/cors.ts';
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.0';

const CONFIRMATION = 'DELETE';

type StorageObject = { bucket: string; name: string };

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function isAlreadyGone(err: unknown): boolean {
  const e = err as { code?: string; status?: number };
  return e?.code === 'resource_missing' || e?.status === 404;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors);
  }

  // ── Who is asking ──
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Not authenticated' }, 401, cors);

  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
  );
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user) return json({ error: 'Not authenticated' }, 401, cors);

  // ── Did they mean it ──
  let body: { confirm?: string } = {};
  try {
    body = await req.json();
  } catch {
    // fall through to the confirmation check
  }
  if (body.confirm !== CONFIRMATION) {
    return json({ error: 'Confirmation required' }, 400, cors);
  }

  console.log('Account deletion requested:', user.id);

  // ── 1. Stop billing. Abort on any failure that is not "already gone". ──
  try {
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id);

    for (const sub of subs ?? []) {
      if (!sub.stripe_subscription_id || sub.status === 'canceled') continue;
      try {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        console.log('Canceled subscription:', sub.stripe_subscription_id);
      } catch (err) {
        if (!isAlreadyGone(err)) throw err;
      }
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id);
        console.log('Deleted Stripe customer for user:', user.id);
      } catch (err) {
        if (!isAlreadyGone(err)) throw err;
      }
    }
  } catch (err) {
    console.error('Billing shutdown failed, account NOT deleted:', user.id, (err as Error).message);
    return json({ error: 'Billing could not be stopped. Account not deleted.', stage: 'billing' }, 502, cors);
  }

  // ── 2. Re-credit contributions to other worlds; list files to remove ──
  const { data: plan, error: planError } = await supabaseAdmin.rpc('prepare_account_deletion', {
    p_user_id: user.id,
  });
  if (planError) {
    console.error('prepare_account_deletion failed:', planError.message);
    return json({ error: 'Deletion could not be prepared. Account not deleted.', stage: 'prepare' }, 500, cors);
  }

  // ── 3. Remove uploaded files. Failures are logged, not fatal: the account
  // deletion still proceeds, and the log names what needs manual cleanup. ──
  const objects: StorageObject[] = plan?.storage_objects ?? [];
  const byBucket = new Map<string, string[]>();
  for (const o of objects) {
    byBucket.set(o.bucket, [...(byBucket.get(o.bucket) ?? []), o.name]);
  }
  for (const [bucket, names] of byBucket) {
    for (let i = 0; i < names.length; i += 100) {
      const batch = names.slice(i, i + 100);
      const { error } = await supabaseAdmin.storage.from(bucket).remove(batch);
      if (error) {
        console.error(`Storage cleanup failed in ${bucket} for ${user.id}:`, error.message, batch);
      }
    }
  }

  // ── 4. Delete the account. Cascades through every user-owned table. ──
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('auth.admin.deleteUser failed:', user.id, deleteError.message);
    return json({ error: 'Account could not be deleted.', stage: 'delete' }, 500, cors);
  }

  console.log('Account deleted:', user.id, 'files removed:', objects.length, 'recredited:', plan?.recredited);
  return json({ deleted: true }, 200, cors);
});
