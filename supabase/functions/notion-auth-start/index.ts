import { getCorsHeaders } from '../_shared/cors.ts';
import { NOTION_CLIENT_ID, NOTION_REDIRECT_URI } from '../_shared/notion.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.0';

// Initiates Notion OAuth flow
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    // Get token from request body (bypasses gateway auth issues)
    let token: string | undefined;

    // Try to get token from body first
    try {
      const body = await req.json();
      token = body?.token;
    } catch {
      // No body or invalid JSON - try header as fallback
    }

    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    if (!token) {
      throw new Error('Not authenticated: No token provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Server configuration error: Missing Supabase credentials');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError) {
      throw new Error(`Authentication failed: ${userError.message}`);
    }

    if (!user) {
      throw new Error('Not authenticated: Invalid token');
    }

    // Check Notion OAuth configuration
    if (!NOTION_CLIENT_ID) {
      throw new Error('Notion OAuth not configured: Missing NOTION_CLIENT_ID. Please set this secret in Supabase Edge Functions settings.');
    }

    if (!NOTION_REDIRECT_URI) {
      throw new Error('Notion OAuth not configured: Missing NOTION_REDIRECT_URI. Please set this secret in Supabase Edge Functions settings.');
    }

    // Generate state for CSRF protection (include user ID)
    const state = btoa(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    }));

    // Build Notion OAuth URL
    const params = new URLSearchParams({
      client_id: NOTION_CLIENT_ID,
      redirect_uri: NOTION_REDIRECT_URI,
      response_type: 'code',
      owner: 'user',
      state,
    });

    const authUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;

    return new Response(
      JSON.stringify({ success: true, authUrl, state }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notion auth start error:', error);
    // Return 200 with error in body - Supabase client handles this better than non-2xx
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
