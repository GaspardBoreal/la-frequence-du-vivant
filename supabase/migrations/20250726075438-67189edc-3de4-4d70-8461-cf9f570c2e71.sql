
-- Create enum for media types
CREATE TYPE public.media_type AS ENUM ('photo', 'audio', 'video', 'document');

-- Create enum for study types
CREATE TYPE public.etude_type AS ENUM ('principale', 'complementaire', 'annexe');

-- Main marches table
CREATE TABLE public.marches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_marche TEXT,
  ville TEXT NOT NULL,
  region TEXT,
  coordonnees POINT,
  date TEXT,
  temperature NUMERIC,
  descriptif_court TEXT,
  descriptif_long TEXT,
  theme_principal TEXT,
  sous_themes TEXT[],
  lien_google_drive TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Studies table (30 pages per march)
CREATE TABLE public.marche_etudes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID REFERENCES public.marches(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  resume TEXT,
  chapitres JSONB,
  ordre INTEGER DEFAULT 1,
  type_etude etude_type DEFAULT 'principale',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Photos table
CREATE TABLE public.marche_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID REFERENCES public.marches(id) ON DELETE CASCADE NOT NULL,
  nom_fichier TEXT NOT NULL,
  url_supabase TEXT NOT NULL,
  url_originale TEXT,
  titre TEXT,
  description TEXT,
  ordre INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audio table
CREATE TABLE public.marche_audio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID REFERENCES public.marches(id) ON DELETE CASCADE NOT NULL,
  nom_fichier TEXT NOT NULL,
  url_supabase TEXT NOT NULL,
  url_originale TEXT,
  titre TEXT,
  description TEXT,
  duree_secondes INTEGER,
  format_audio TEXT,
  taille_octets BIGINT,
  ordre INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Videos table
CREATE TABLE public.marche_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID REFERENCES public.marches(id) ON DELETE CASCADE NOT NULL,
  nom_fichier TEXT NOT NULL,
  url_supabase TEXT NOT NULL,
  url_originale TEXT,
  titre TEXT,
  description TEXT,
  duree_secondes INTEGER,
  format_video TEXT,
  resolution TEXT,
  taille_octets BIGINT,
  thumbnail_url TEXT,
  ordre INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table (PDFs, etc.)
CREATE TABLE public.marche_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID REFERENCES public.marches(id) ON DELETE CASCADE NOT NULL,
  nom_fichier TEXT NOT NULL,
  url_supabase TEXT NOT NULL,
  url_originale TEXT,
  titre TEXT,
  description TEXT,
  type_document TEXT,
  taille_octets BIGINT,
  version INTEGER DEFAULT 1,
  ordre INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tags table for categorization
CREATE TABLE public.marche_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID REFERENCES public.marches(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  categorie TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(marche_id, tag)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.marches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_etudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is a public showcase)
CREATE POLICY "Public can view marches" ON public.marches FOR SELECT USING (true);
CREATE POLICY "Public can view etudes" ON public.marche_etudes FOR SELECT USING (true);
CREATE POLICY "Public can view photos" ON public.marche_photos FOR SELECT USING (true);
CREATE POLICY "Public can view audio" ON public.marche_audio FOR SELECT USING (true);
CREATE POLICY "Public can view videos" ON public.marche_videos FOR SELECT USING (true);
CREATE POLICY "Public can view documents" ON public.marche_documents FOR SELECT USING (true);
CREATE POLICY "Public can view tags" ON public.marche_tags FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_marches_ville ON public.marches(ville);
CREATE INDEX idx_marches_region ON public.marches(region);
CREATE INDEX idx_marches_date ON public.marches(date);
CREATE INDEX idx_marche_etudes_marche_id ON public.marche_etudes(marche_id);
CREATE INDEX idx_marche_photos_marche_id ON public.marche_photos(marche_id);
CREATE INDEX idx_marche_audio_marche_id ON public.marche_audio(marche_id);
CREATE INDEX idx_marche_videos_marche_id ON public.marche_videos(marche_id);
CREATE INDEX idx_marche_documents_marche_id ON public.marche_documents(marche_id);
CREATE INDEX idx_marche_tags_marche_id ON public.marche_tags(marche_id);
CREATE INDEX idx_marche_tags_tag ON public.marche_tags(tag);

-- Full-text search index on studies content
CREATE INDEX idx_marche_etudes_fulltext ON public.marche_etudes 
USING gin(to_tsvector('french', titre || ' ' || contenu || ' ' || COALESCE(resume, '')));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('marche-photos', 'marche-photos', true),
  ('marche-audio', 'marche-audio', true),
  ('marche-videos', 'marche-videos', true),
  ('etudes-pdf', 'etudes-pdf', true),
  ('documents-annexes', 'documents-annexes', true);

-- Storage policies for public access
CREATE POLICY "Public can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'marche-photos');
CREATE POLICY "Public can view audio" ON storage.objects FOR SELECT USING (bucket_id = 'marche-audio');
CREATE POLICY "Public can view videos" ON storage.objects FOR SELECT USING (bucket_id = 'marche-videos');
CREATE POLICY "Public can view PDFs" ON storage.objects FOR SELECT USING (bucket_id = 'etudes-pdf');
CREATE POLICY "Public can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents-annexes');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_marches_updated_at BEFORE UPDATE ON public.marches 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marche_etudes_updated_at BEFORE UPDATE ON public.marche_etudes 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
