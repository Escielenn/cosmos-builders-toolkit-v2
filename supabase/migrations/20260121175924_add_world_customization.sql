-- Add customization columns to worlds table
ALTER TABLE public.worlds
ADD COLUMN header_image_url TEXT,
ADD COLUMN icon TEXT DEFAULT 'globe';

-- Add world_notes table for free-form notes
CREATE TABLE public.world_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on world_notes
ALTER TABLE public.world_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for world_notes
CREATE POLICY "Users can view own world notes"
  ON public.world_notes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create world notes"
  ON public.world_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own world notes"
  ON public.world_notes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own world notes"
  ON public.world_notes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_world_notes_updated_at
  BEFORE UPDATE ON public.world_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for world header images
INSERT INTO storage.buckets (id, name, public)
VALUES ('world-headers', 'world-headers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view world headers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'world-headers');

CREATE POLICY "Authenticated users can upload world headers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'world-headers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own world headers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'world-headers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own world headers"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'world-headers' AND auth.uid()::text = (storage.foldername(name))[1]);
