-- Fix function_search_path_mutable warnings: set search_path to prevent
-- search path injection attacks.
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

ALTER FUNCTION public.generate_ticket_number() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
