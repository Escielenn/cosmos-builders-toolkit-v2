import { getCorsHeaders } from '../_shared/cors.ts';
import { exchangeCodeForToken } from '../_shared/notion.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { verifyState, stateSecret } from '../_shared/oauth-state.ts';

// Handles Notion OAuth callback - exchanges code for token
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const { code, state } = await req.json();

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    // Verify the signed state (15-minute window). An unsigned or altered
    // state is rejected, so a forged user id cannot claim this connection.
    const stateData = await verifyState(state, stateSecret(), 15 * 60 * 1000);
    if (!stateData) {
      throw new Error('Authorization expired or invalid. Please try again.');
    }
    const { userId } = stateData;

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
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notion auth callback error:', error);
    // Return 200 with error for consistent handling
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
