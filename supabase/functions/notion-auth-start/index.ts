import { corsHeaders } from '../_shared/cors.ts';
import { NOTION_CLIENT_ID, NOTION_REDIRECT_URI } from '../_shared/notion.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.0';

// Initiates Notion OAuth flow
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    if (!NOTION_CLIENT_ID || !NOTION_REDIRECT_URI) {
      throw new Error('Notion OAuth not configured');
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
      JSON.stringify({ authUrl, state }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notion auth start error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
