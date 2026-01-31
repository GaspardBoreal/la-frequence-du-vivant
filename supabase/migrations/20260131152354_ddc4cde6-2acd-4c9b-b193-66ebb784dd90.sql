-- ============================================
-- PUBLIC EXPORTS: Bucket + Table + RLS
-- ============================================

-- 1. Créer le bucket public pour stocker les ePUB/PDF
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-exports', 'public-exports', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique de lecture publique sur le bucket
CREATE POLICY "Public can read exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-exports');

-- 3. Politique d'écriture pour les admins authentifiés
CREATE POLICY "Authenticated admins can upload exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public-exports' 
  AND auth.role() = 'authenticated'
  AND public.check_is_admin_user(auth.uid())
);

-- 4. Politique de suppression pour les admins
CREATE POLICY "Authenticated admins can delete exports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public-exports' 
  AND auth.role() = 'authenticated'
  AND public.check_is_admin_user(auth.uid())
);

-- 5. Créer la table published_exports
CREATE TABLE public.published_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiant unique pour URL publique
  slug text UNIQUE NOT NULL,
  
  -- Lien avec exploration (optionnel)
  exploration_id uuid REFERENCES explorations(id) ON DELETE SET NULL,
  
  -- Métadonnées affichées
  title text NOT NULL,
  subtitle text,
  description text,
  author text DEFAULT 'Gaspard Boréal',
  cover_url text,
  
  -- Fichier stocké
  file_url text NOT NULL,
  file_size_bytes bigint,
  file_type text DEFAULT 'epub',
  
  -- Direction artistique utilisée
  artistic_direction text,
  
  -- Stats
  download_count integer DEFAULT 0,
  
  -- Dates
  published_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Activer RLS
ALTER TABLE public.published_exports ENABLE ROW LEVEL SECURITY;

-- 7. Politique de lecture publique
CREATE POLICY "Public can view published exports"
ON public.published_exports FOR SELECT 
USING (true);

-- 8. Politique de gestion admin
CREATE POLICY "Admins can insert exports"
ON public.published_exports FOR INSERT
WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can update exports"
ON public.published_exports FOR UPDATE
USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete exports"
ON public.published_exports FOR DELETE
USING (public.check_is_admin_user(auth.uid()));

-- 9. Index pour lookup rapide par slug
CREATE INDEX idx_published_exports_slug ON public.published_exports(slug);

-- 10. Fonction pour incrémenter le compteur de téléchargements
CREATE OR REPLACE FUNCTION public.increment_download_count(export_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE published_exports 
  SET download_count = download_count + 1,
      updated_at = now()
  WHERE slug = export_slug;
END;
$$;