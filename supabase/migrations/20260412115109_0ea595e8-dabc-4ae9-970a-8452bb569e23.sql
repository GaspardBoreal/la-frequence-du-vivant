
-- 1. Add shared_to_web columns
ALTER TABLE public.marcheur_textes 
ADD COLUMN IF NOT EXISTS shared_to_web boolean NOT NULL DEFAULT false;

ALTER TABLE public.marcheur_medias 
ADD COLUMN IF NOT EXISTS shared_to_web boolean NOT NULL DEFAULT false;

-- 2. Add slug to community_profiles
ALTER TABLE public.community_profiles 
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- 3. Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- 4. Function to generate slug (using extensions.unaccent)
CREATE OR REPLACE FUNCTION public.generate_community_slug(p_prenom text, p_nom text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(
    regexp_replace(
      extensions.unaccent(trim(COALESCE(p_prenom, '')) || '-' || trim(COALESCE(p_nom, ''))),
      '[^a-z0-9\-]', '', 'g'
    )
  );
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'marcheur-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;
  
  final_slug := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.community_profiles WHERE slug = final_slug) THEN
      RETURN final_slug;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
END;
$$;

-- 5. Trigger for auto-slug
CREATE OR REPLACE FUNCTION public.auto_generate_community_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := public.generate_community_slug(NEW.prenom, NEW.nom);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_slug_community ON public.community_profiles;
CREATE TRIGGER trg_auto_slug_community
  BEFORE INSERT ON public.community_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_community_slug();

-- 6. RLS policies for anonymous access
CREATE POLICY "Public can view web-shared texts"
  ON public.marcheur_textes FOR SELECT TO anon
  USING (shared_to_web = true);

CREATE POLICY "Public can view web-shared medias"
  ON public.marcheur_medias FOR SELECT TO anon
  USING (shared_to_web = true);

CREATE POLICY "Public can view profiles by slug"
  ON public.community_profiles FOR SELECT TO anon
  USING (slug IS NOT NULL);

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_marcheur_textes_shared_web ON public.marcheur_textes (shared_to_web) WHERE shared_to_web = true;
CREATE INDEX IF NOT EXISTS idx_marcheur_medias_shared_web ON public.marcheur_medias (shared_to_web) WHERE shared_to_web = true;
CREATE INDEX IF NOT EXISTS idx_community_profiles_slug ON public.community_profiles (slug) WHERE slug IS NOT NULL;

-- 8. Generate slugs for existing profiles
UPDATE public.community_profiles
SET slug = public.generate_community_slug(prenom, nom)
WHERE slug IS NULL;
