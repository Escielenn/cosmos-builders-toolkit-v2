-- Force PostgREST to reload its schema cache (already applied)
NOTIFY pgrst, 'reload schema';
