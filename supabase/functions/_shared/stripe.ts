// Stripe API helper using fetch (compatible with Deno/Supabase Edge Functions)
const STRIPE_API_BASE = 'https://api.stripe.com/v1';

const getStripeKey = () => Deno.env.get('STRIPE_SECRET_KEY') || '';

export const PRICE_IDS = {
  monthly: Deno.env.get('STRIPE_MONTHLY_PRICE_ID') || '',
  yearly: Deno.env.get('STRIPE_YEARLY_PRICE_ID') || '',
};

async function stripeRequest(endpoint: string, method: string = 'GET', body?: Record<string, any>) {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${getStripeKey()}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const options: RequestInit = { method, headers };

  if (body) {
    options.body = new URLSearchParams(flattenObject(body)).toString();
  }

  const response = await fetch(`${STRIPE_API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Stripe API error');
  }

  return data;
}

// Flatten nested objects for URL encoding (Stripe format)
function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}[${key}]` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object') {
          Object.assign(result, flattenObject(item, `${newKey}[${index}]`));
        } else {
          result[`${newKey}[${index}]`] = String(item);
        }
      });
    } else if (value !== undefined && value !== null) {
      result[newKey] = String(value);
    }
  }

  return result;
}

export const stripe = {
  customers: {
    create: async (params: { email?: string; metadata?: Record<string, string> }) => {
      return stripeRequest('/customers', 'POST', params);
    },
    retrieve: async (id: string) => {
      return stripeRequest(`/customers/${id}`);
    },
  },
  checkout: {
    sessions: {
      create: async (params: {
        customer: string;
        line_items: Array<{ price: string; quantity: number }>;
        mode: string;
        success_url: string;
        cancel_url: string;
        subscription_data?: { metadata?: Record<string, string> };
        allow_promotion_codes?: boolean;
      }) => {
        return stripeRequest('/checkout/sessions', 'POST', params);
      },
    },
  },
  billingPortal: {
    sessions: {
      create: async (params: { customer: string; return_url: string }) => {
        return stripeRequest('/billing_portal/sessions', 'POST', params);
      },
    },
  },
  subscriptions: {
    retrieve: async (id: string) => {
      return stripeRequest(`/subscriptions/${id}`);
    },
    update: async (id: string, params: Record<string, any>) => {
      return stripeRequest(`/subscriptions/${id}`, 'POST', params);
    },
  },
  webhooks: {
    constructEvent: async (payload: string, signature: string, secret: string) => {
      const encoder = new TextEncoder();

      // Parse signature header
      const parts = signature.split(',');
      const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
      const v1Signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];

      if (!timestamp || !v1Signature) {
        throw new Error('Invalid signature format');
      }

      // Check timestamp (allow 5 minute tolerance)
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - parseInt(timestamp)) > 300) {
        throw new Error('Webhook timestamp too old');
      }

      // Compute expected signature using HMAC-SHA256
      const signedPayload = `${timestamp}.${payload}`;
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signedPayload)
      );

      // Convert to hex string
      const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Constant-time comparison to prevent timing attacks
      if (expectedSignature.length !== v1Signature.length) {
        throw new Error('Invalid webhook signature');
      }

      let mismatch = 0;
      for (let i = 0; i < expectedSignature.length; i++) {
        mismatch |= expectedSignature.charCodeAt(i) ^ v1Signature.charCodeAt(i);
      }

      if (mismatch !== 0) {
        throw new Error('Invalid webhook signature');
      }

      return JSON.parse(payload);
    },
  },
};
