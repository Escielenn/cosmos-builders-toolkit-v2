# StellarForge Stack Architecture
## Claude Code Reference Document

> ⚠️ **ASPIRATIONAL — NOT CURRENT.** This document describes a **Clerk-based auth architecture that was never implemented**. The live product (v0.66xx) uses **Supabase Auth** end-to-end (see `src/contexts/AuthContext`, `src/integrations/supabase/client.ts`). Per the StellarForge II stack decision (settled 2026-06-11, see `StellarForge.tools Part IIi/STELLARFORGE_II_IMPLEMENTATION_PLAN_v2.md` §1.3): **the stack stays Vite + React Router + Supabase incl. Supabase Auth — no Clerk, no Next.js**. The Clerk migration described below is deferred indefinitely. Do NOT write auth code against this document; the as-built reference is the codebase itself until a `STACK-CURRENT.md` lands.

**Last updated:** April 2026 (flagged aspirational 2026-06-11)  
**Purpose:** ~~Canonical reference for how all services connect.~~ Historical/aspirational reference only — see banner above.

---

## Architecture Decision Summary

**Clerk** handles all authentication (identity, sessions, OAuth, org management).  
**Supabase** handles all data (user records, subscriptions, app content, RLS).  
**Vercel** handles hosting and serverless edge functions (API routes, webhooks).  
**Stripe** handles all billing (subscriptions, invoices, org seat management).  
**Resend** handles all transactional email.

These are separate concerns. They do not overlap. Do not use Supabase Auth — it has been replaced by Clerk entirely.

---

## Service Map

```
Browser / React Client
        │
        ├── Clerk (auth)
        │     ├── Sign-in / Sign-up UI (pre-built Clerk components)
        │     ├── Session management (automatic, JWT-based)
        │     ├── OAuth providers (Google, GitHub, etc. — toggled in Clerk dashboard)
        │     ├── Magic links and passkeys
        │     └── Organizations (multi-user, seat-based billing groups)
        │
        ├── Supabase (data)
        │     ├── Postgres database (users, organizations, subscriptions, app data)
        │     ├── Row Level Security (RLS) policies gated on Clerk JWT
        │     ├── Edge Functions (when Supabase-side logic is needed)
        │     └── Storage (file uploads if needed)
        │
        └── Vercel (hosting + API layer)
              ├── Next.js app (React, TypeScript, Tailwind)
              ├── API routes (/api/*) — serverless edge functions
              ├── Clerk webhook handler (/api/webhooks/clerk)
              └── Stripe webhook handler (/api/webhooks/stripe)
```

---

## Authentication Flow (Clerk)

Clerk owns the entire auth surface. The app never writes its own login UI, OAuth callback handling, or session management.

### How a User Session Works

1. User visits the app.
2. Clerk's `<ClerkProvider>` wraps the entire React app.
3. Unauthenticated users are redirected to Clerk-hosted or embedded sign-in.
4. After sign-in, Clerk issues a JWT.
5. That JWT is attached to every Supabase request so RLS policies can identify the user.
6. On sign-out, Clerk invalidates the session.

### JWT Configuration (Critical)

Clerk must be configured with a custom JWT template that Supabase can read. In the Clerk dashboard, create a JWT template named `supabase` with this payload:

```json
{
  "sub": "{{user.id}}",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "org_id": "{{org.id}}",
  "org_role": "{{org.role}}"
}
```

In the Supabase client, pass this token:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'

export function useSupabaseClient() {
  const { getToken } = useAuth()
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken({ template: 'supabase' })
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${token}`,
            },
          })
        },
      },
    }
  )
}
```

---

## User Sync (Clerk → Supabase)

Clerk is the source of truth for identity. Supabase stores a mirror of user records for relational queries, RLS, and subscription state.

### Webhook Handler

When a user is created or updated in Clerk, a webhook fires to `/api/webhooks/clerk`. This handler writes to the Supabase `users` table.

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role for webhook writes
)

export async function POST(req: Request) {
  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  let event: WebhookEvent
  
  try {
    event = wh.verify(payload, headers) as WebhookEvent
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  switch (event.type) {
    case 'user.created':
    case 'user.updated':
      await supabase.from('users').upsert({
        clerk_user_id: event.data.id,
        email: event.data.email_addresses[0]?.email_address,
        first_name: event.data.first_name,
        last_name: event.data.last_name,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clerk_user_id' })
      break

    case 'user.deleted':
      await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('clerk_user_id', event.data.id)
      break

    case 'organization.created':
    case 'organization.updated':
      await supabase.from('organizations').upsert({
        clerk_org_id: event.data.id,
        name: event.data.name,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clerk_org_id' })
      break

    case 'organizationMembership.created':
      await supabase.from('org_members').upsert({
        clerk_org_id: event.data.organization.id,
        clerk_user_id: event.data.public_user_data.user_id,
        role: event.data.role,
      }, { onConflict: 'clerk_org_id, clerk_user_id' })
      break

    case 'organizationMembership.deleted':
      await supabase.from('org_members')
        .delete()
        .eq('clerk_org_id', event.data.organization.id)
        .eq('clerk_user_id', event.data.public_user_data.user_id)
      break
  }

  return new Response('OK', { status: 200 })
}
```

---

## Database Schema (Supabase / Postgres)

The primary user identifier throughout the entire schema is `clerk_user_id`. Never use Supabase's native `auth.uid()` — that belongs to Supabase Auth, which is not in use.

```sql
-- Core user record (synced from Clerk)
CREATE TABLE users (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id     TEXT UNIQUE NOT NULL,
  email             TEXT NOT NULL,
  first_name        TEXT,
  last_name         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ  -- soft delete only
);

-- Individual subscriptions (personal Pro tier)
CREATE TABLE subscriptions (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id         TEXT REFERENCES users(clerk_user_id),
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                  TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro'
  status                TEXT NOT NULL DEFAULT 'inactive', -- 'active' | 'inactive' | 'past_due' | 'canceled'
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations (schools, writing programs, cohorts)
CREATE TABLE organizations (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_org_id          TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                  TEXT NOT NULL DEFAULT 'free', -- 'free' | 'group' | 'classroom' | 'institution'
  status                TEXT NOT NULL DEFAULT 'inactive',
  seat_limit            INTEGER DEFAULT 5,
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Organization membership (synced from Clerk)
CREATE TABLE org_members (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_org_id   TEXT REFERENCES organizations(clerk_org_id),
  clerk_user_id  TEXT REFERENCES users(clerk_user_id),
  role           TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  joined_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_org_id, clerk_user_id)
);
```

---

## Row Level Security (RLS)

All tables have RLS enabled. The Clerk JWT `sub` claim is used to identify the current user.

```sql
-- Helper function to extract Clerk user ID from JWT
CREATE OR REPLACE FUNCTION clerk_user_id() RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )
$$ LANGUAGE SQL STABLE;

-- Users can read their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (clerk_user_id = clerk_user_id());

-- Subscription access policy:
-- User has personal active sub OR belongs to org with active sub
CREATE POLICY "content_access" ON worlds  -- apply this pattern to any content table
  FOR SELECT USING (
    -- Personal subscription
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.clerk_user_id = clerk_user_id()
      AND s.status = 'active'
    )
    OR
    -- Org subscription
    EXISTS (
      SELECT 1 FROM org_members om
      JOIN organizations o ON o.clerk_org_id = om.clerk_org_id
      WHERE om.clerk_user_id = clerk_user_id()
      AND o.status = 'active'
    )
  );
```

---

## Billing Flow (Stripe)

Stripe handles all payment processing. StellarForge never stores card data.

### Subscription Tiers

| Plan | Type | Price | Stripe Product |
|------|------|-------|----------------|
| Free | Individual | $0 | — |
| Pro | Individual | $4.99/mo or $49/yr | `price_pro_monthly` / `price_pro_annual` |
| Group | Org (up to 10) | TBD | `price_group` |
| Classroom | Org (up to 50) | TBD | `price_classroom` |
| Institution | Org (unlimited) | TBD | `price_institution` |

### Stripe Webhook Handler

Stripe events update subscription status in Supabase.

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const subscription = event.data.object as Stripe.Subscription
  const isOrg = subscription.metadata?.type === 'organization'
  const table = isOrg ? 'organizations' : 'subscriptions'
  const idField = isOrg ? 'clerk_org_id' : 'clerk_user_id'
  const idValue = subscription.metadata?.clerk_id

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await supabase.from(table).update({
        stripe_subscription_id: subscription.id,
        status: subscription.status === 'active' ? 'active' : 'inactive',
        plan: subscription.metadata?.plan ?? 'pro',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq(idField, idValue)
      break

    case 'customer.subscription.deleted':
      await supabase.from(table).update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      }).eq(idField, idValue)
      break
  }

  return new Response('OK', { status: 200 })
}
```

---

## Environment Variables

All of the following must be present in `.env.local` (development) and Vercel environment settings (production).

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # server-side only, never expose to client

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...
```

---

## Vercel Deployment Notes

- The app is a Next.js 14+ project using the App Router.
- Webhook routes (`/api/webhooks/*`) must be excluded from Clerk's auth middleware — they receive unauthenticated POST requests from external services.
- Set `SUPABASE_SERVICE_ROLE_KEY` only as a server-side environment variable in Vercel. It must never be exposed to the client.

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',  // webhooks are always public
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
```

---

## File Structure (Auth & Billing Layer)

```
app/
  api/
    webhooks/
      clerk/route.ts          ← Clerk user/org sync to Supabase
      stripe/route.ts         ← Stripe subscription state sync
    billing/
      create-checkout/route.ts  ← Creates Stripe checkout session
      portal/route.ts           ← Opens Stripe customer portal
  (auth)/
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
  dashboard/
    page.tsx                  ← Protected, requires active session
  
lib/
  supabase.ts                 ← Supabase client with Clerk JWT
  stripe.ts                   ← Stripe client instance
  
middleware.ts                 ← Clerk auth middleware
```

---

## Explicit Do Not Do List

- **Do not use Supabase Auth** (`supabase.auth.signIn`, `supabase.auth.signUp`, etc.). It is not part of this stack. Clerk handles all of this.
- **Do not use `auth.uid()`** in RLS policies. Use the `clerk_user_id()` helper function defined above.
- **Do not expose `SUPABASE_SERVICE_ROLE_KEY`** in any client-side code or `NEXT_PUBLIC_` variable.
- **Do not write login or OAuth UI from scratch.** Use Clerk's `<SignIn />` and `<SignUp />` components.
- **Do not add new OAuth providers** by modifying code. Toggle them in the Clerk dashboard.
- **Do not store Stripe card data** or PII beyond what Stripe handles.
- **Do not create a new Supabase user via `supabase.auth.admin.createUser()`** — the sync happens via Clerk webhook only.

---

## Data Flow Summary

```
User signs up
  → Clerk creates identity record
  → Clerk fires user.created webhook
  → /api/webhooks/clerk writes to Supabase users table

User subscribes (individual)
  → Stripe checkout session created with clerk_user_id in metadata
  → Payment completes, Stripe fires customer.subscription.created
  → /api/webhooks/stripe updates subscriptions table in Supabase

Org admin creates organization
  → Clerk creates org record
  → Clerk fires organization.created webhook
  → /api/webhooks/clerk writes to Supabase organizations table

Org subscribes
  → Same Stripe flow, metadata.type = 'organization', metadata.clerk_id = clerk_org_id

User accesses protected content
  → Clerk session provides JWT
  → JWT passed to Supabase client
  → Supabase RLS policy checks personal OR org subscription status
  → Access granted or denied at database level
```
