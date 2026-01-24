import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
