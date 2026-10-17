// Signed OAuth `state` values.
//
// The Notion OAuth state used to be plain base64 of {userId, timestamp}. The
// callback trusted it, so anyone who knew a user's id could forge a state and
// attach their own Notion workspace to that user; that user's later exports
// would land in the attacker's workspace. The state is now
// base64url(payload).base64url(HMAC-SHA256(payload)), keyed by a server-only
// secret, and the callback rejects anything that does not verify.

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export interface OAuthState {
  userId: string;
  timestamp: number;
  nonce: string;
}

export async function signState(
  payload: Omit<OAuthState, 'nonce'>,
  secret: string,
): Promise<string> {
  if (!secret) throw new Error('State signing secret missing');
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const body = b64url(encoder.encode(JSON.stringify({ ...payload, nonce })));
  return `${body}.${b64url(await hmac(secret, body))}`;
}

/** Returns the payload if the signature verifies and it is younger than maxAgeMs; otherwise null. */
export async function verifyState(
  state: string,
  secret: string,
  maxAgeMs: number,
  now: number = Date.now(),
): Promise<OAuthState | null> {
  if (!secret || typeof state !== 'string') return null;
  const parts = state.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  let given: Uint8Array;
  try {
    given = fromB64url(sig);
  } catch {
    return null;
  }
  if (!constantTimeEqual(given, await hmac(secret, body))) return null;

  let payload: OAuthState;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
  } catch {
    return null;
  }
  if (typeof payload?.userId !== 'string' || typeof payload?.timestamp !== 'number') return null;
  if (now - payload.timestamp > maxAgeMs || payload.timestamp - now > 60_000) return null;
  return payload;
}

/** Server-only signing key. The service-role key is present in every edge function and never leaves the server. */
export function stateSecret(): string {
  return Deno.env.get('OAUTH_STATE_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}
