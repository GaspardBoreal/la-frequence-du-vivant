
CREATE OR REPLACE FUNCTION public.apply_taxonomy_alias_on_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_data jsonb;
BEGIN
  IF NEW.species_data IS NULL OR jsonb_typeof(NEW.species_data) <> 'array' THEN
    RETURN NEW;
  END IF;

  SELECT jsonb_agg(
    CASE
      WHEN sp ? 'scientificName' AND public.resolve_species_alias(sp->>'scientificName', NEW.marche_id) <> (sp->>'scientificName')
        THEN jsonb_set(sp, '{scientificName}',
               to_jsonb(public.resolve_species_alias(sp->>'scientificName', NEW.marche_id)))
      WHEN sp ? 'scientific_name' AND public.resolve_species_alias(sp->>'scientific_name', NEW.marche_id) <> (sp->>'scientific_name')
        THEN jsonb_set(sp, '{scientific_name}',
               to_jsonb(public.resolve_species_alias(sp->>'scientific_name', NEW.marche_id)))
      ELSE sp
    END
  )
  INTO v_new_data
  FROM jsonb_array_elements(NEW.species_data) sp;

  IF v_new_data IS NOT NULL THEN
    NEW.species_data := v_new_data;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_taxonomy_alias_on_snapshot ON public.biodiversity_snapshots;
CREATE TRIGGER trg_apply_taxonomy_alias_on_snapshot
  BEFORE INSERT OR UPDATE OF species_data, marche_id
  ON public.biodiversity_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.apply_taxonomy_alias_on_snapshot();
