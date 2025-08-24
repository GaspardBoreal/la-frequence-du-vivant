-- Create table for photo tags
CREATE TABLE public.marche_photo_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES public.marche_photos(id) ON DELETE CASCADE,
  tag text NOT NULL,
  categorie text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marche_photo_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Only authenticated users can insert photo_tags"
ON public.marche_photo_tags
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update photo_tags"
ON public.marche_photo_tags
FOR UPDATE
USING (true);

CREATE POLICY "Only authenticated users can delete photo_tags"
ON public.marche_photo_tags
FOR DELETE
USING (true);

CREATE POLICY "Public can view photo_tags"
ON public.marche_photo_tags
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_marche_photo_tags_photo_id ON public.marche_photo_tags(photo_id);
CREATE INDEX idx_marche_photo_tags_tag ON public.marche_photo_tags(tag);
CREATE INDEX idx_marche_photo_tags_categorie ON public.marche_photo_tags(categorie);

-- Unique constraint to prevent duplicate tags per photo
CREATE UNIQUE INDEX idx_marche_photo_tags_unique ON public.marche_photo_tags(photo_id, tag);