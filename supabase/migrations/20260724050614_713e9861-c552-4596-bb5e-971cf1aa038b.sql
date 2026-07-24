CREATE OR REPLACE FUNCTION public.trg_propriete_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_suffix INT := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  v_base := regexp_replace(
    lower(extensions.unaccent(NEW.nom)),
    '[^a-z0-9]+',
    '-',
    'g'
  );
  v_base := trim(both '-' from v_base);

  IF v_base = '' THEN
    v_base := 'propriete';
  END IF;

  v_slug := v_base;
  WHILE EXISTS (
    SELECT 1
    FROM public.proprietes
    WHERE slug = v_slug
      AND id <> COALESCE(NEW.id, gen_random_uuid())
  ) LOOP
    v_suffix := v_suffix + 1;
    v_slug := v_base || '-' || v_suffix;
  END LOOP;

  NEW.slug := v_slug;
  RETURN NEW;
END;
$$;