import { corsHeaders } from '../_shared/cors.ts';
import { exchangeCodeForToken } from '../_shared/notion.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';

// Handles Notion OAuth callback - exchanges code for token
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, state } = await req.json();

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      throw new Error('Invalid state parameter');
    }

    const { userId, timestamp } = stateData;

    // Check state is not too old (15 minutes)
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      throw new Error('Authorization expired. Please try again.');
    }

    if (!userId) {
      throw new Error('Invalid state: missing user ID');
    }

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code);

    // Store connection in database
    const { error: upsertError } = await supabaseAdmin
      .from('notion_connections')
      .upsert(
        {
          user_id: userId,
          access_token: tokenData.access_token,
          workspace_id: tokenData.workspace_id,
          workspace_name: tokenData.workspace_name,
          workspace_icon: tokenData.workspace_icon,
          bot_id: tokenData.bot_id,
          duplicated_template_id: tokenData.duplicated_template_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('Database error:', upsertError);
      throw new Error('Failed to save Notion connection');
    }

    return new Response(
      JSON.stringify({
        success: true,
        workspace_name: tokenData.workspace_name,
        workspace_icon: tokenData.workspace_icon,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notion auth callback error:', error);
    // Return 200 with error for consistent handling
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
