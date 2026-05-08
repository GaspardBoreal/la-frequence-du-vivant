
-- 1. Trigger: prevent any non-manual upsert from overwriting a manual entry
CREATE OR REPLACE FUNCTION public.protect_manual_species_translations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- If the existing row is manual, only another manual update may change it
    IF OLD.source = 'manual' AND COALESCE(NEW.source, '') <> 'manual' THEN
      -- Silently keep the existing manual value
      RETURN OLD;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_manual_species_translations ON public.species_translations;
CREATE TRIGGER trg_protect_manual_species_translations
BEFORE UPDATE ON public.species_translations
FOR EACH ROW
EXECUTE FUNCTION public.protect_manual_species_translations();

-- 2. Admin RPC to set a manual (locked) translation
CREATE OR REPLACE FUNCTION public.set_species_translation_manual(
  _scientific_name text,
  _common_name_fr text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.species_translations (scientific_name, common_name_fr, source, confidence_level)
  VALUES (_scientific_name, _common_name_fr, 'manual', 'high')
  ON CONFLICT (scientific_name) DO UPDATE
    SET common_name_fr = EXCLUDED.common_name_fr,
        source = 'manual',
        confidence_level = 'high',
        updated_at = now();
END;
$$;

-- 3. Fix the known wrong entry
UPDATE public.species_translations
SET common_name_fr = 'Grande sauterelle verte',
    source = 'manual',
    confidence_level = 'high',
    updated_at = now()
WHERE scientific_name = 'Tettigonia viridissima';
