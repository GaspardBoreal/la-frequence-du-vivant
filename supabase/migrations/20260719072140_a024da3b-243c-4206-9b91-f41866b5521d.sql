
-- ============================================================
-- 1) Fonction utilitaire : résolution alias → canonical
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_species_alias(
  p_name text,
  p_marche_id uuid DEFAULT NULL
) RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH k AS (
    SELECT lower(trim(regexp_replace(
      translate(coalesce(p_name,''),
        'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÝÿÑñÇç',
        'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuYyNnCc'
      ), '\s+', ' ', 'g'))) AS key
  )
  SELECT COALESCE(
    (SELECT canonical_scientific_name
       FROM species_taxonomy_aliases, k
      WHERE alias_key = k.key
        AND marche_id = p_marche_id
      LIMIT 1),
    (SELECT canonical_scientific_name
       FROM species_taxonomy_aliases, k
      WHERE alias_key = k.key
        AND marche_id IS NULL
      LIMIT 1),
    p_name
  );
$$;

-- ============================================================
-- 2) Fonction utilitaire : résolution common_name_fr canonical
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_species_alias_common_fr(
  p_name text,
  p_marche_id uuid DEFAULT NULL
) RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH k AS (
    SELECT lower(trim(regexp_replace(
      translate(coalesce(p_name,''),
        'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÝÿÑñÇç',
        'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuYyNnCc'
      ), '\s+', ' ', 'g'))) AS key
  )
  SELECT COALESCE(
    (SELECT canonical_common_name_fr
       FROM species_taxonomy_aliases, k
      WHERE alias_key = k.key
        AND marche_id = p_marche_id
        AND canonical_common_name_fr IS NOT NULL
      LIMIT 1),
    (SELECT canonical_common_name_fr
       FROM species_taxonomy_aliases, k
      WHERE alias_key = k.key
        AND marche_id IS NULL
        AND canonical_common_name_fr IS NOT NULL
      LIMIT 1)
  );
$$;

-- ============================================================
-- 3) Trigger apply_taxonomy_alias_on_write
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_taxonomy_alias_on_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_canonical_sci text;
  v_canonical_fr  text;
  v_original      text := NEW.species_scientific_name;
BEGIN
  -- Résout par nom scientifique d'abord
  IF NEW.species_scientific_name IS NOT NULL AND btrim(NEW.species_scientific_name) <> '' THEN
    v_canonical_sci := public.resolve_species_alias(NEW.species_scientific_name, NEW.marche_id);
    v_canonical_fr  := public.resolve_species_alias_common_fr(NEW.species_scientific_name, NEW.marche_id);
  END IF;

  -- Fallback : résout via common_name_fr si le sci n'a rien donné
  IF (v_canonical_sci IS NULL OR v_canonical_sci = NEW.species_scientific_name)
     AND NEW.taxon_common_name_fr IS NOT NULL AND btrim(NEW.taxon_common_name_fr) <> '' THEN
    v_canonical_sci := public.resolve_species_alias(NEW.taxon_common_name_fr, NEW.marche_id);
    IF v_canonical_fr IS NULL THEN
      v_canonical_fr := public.resolve_species_alias_common_fr(NEW.taxon_common_name_fr, NEW.marche_id);
    END IF;
  END IF;

  IF v_canonical_sci IS NOT NULL AND v_canonical_sci <> COALESCE(NEW.species_scientific_name,'') THEN
    NEW.species_scientific_name := v_canonical_sci;
    NEW.notes := COALESCE(NEW.notes,'') ||
      CASE WHEN COALESCE(NEW.notes,'') = '' THEN '' ELSE E'\n' END ||
      '[alias] original=' || COALESCE(v_original,'');
  END IF;

  IF v_canonical_fr IS NOT NULL AND v_canonical_fr <> COALESCE(NEW.taxon_common_name_fr,'') THEN
    NEW.taxon_common_name_fr := v_canonical_fr;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_taxonomy_alias_on_write ON public.marcheur_observations;
CREATE TRIGGER trg_apply_taxonomy_alias_on_write
  BEFORE INSERT OR UPDATE OF species_scientific_name, taxon_common_name_fr, marche_id
  ON public.marcheur_observations
  FOR EACH ROW EXECUTE FUNCTION public.apply_taxonomy_alias_on_write();

-- ============================================================
-- 4) Backfill unique — observations existantes
-- ============================================================
DO $$
DECLARE
  r record;
  v_new_sci text;
  v_new_fr  text;
BEGIN
  FOR r IN
    SELECT id, species_scientific_name, taxon_common_name_fr, marche_id
      FROM public.marcheur_observations
     WHERE species_scientific_name IS NOT NULL OR taxon_common_name_fr IS NOT NULL
  LOOP
    v_new_sci := public.resolve_species_alias(r.species_scientific_name, r.marche_id);
    v_new_fr  := public.resolve_species_alias_common_fr(r.species_scientific_name, r.marche_id);
    IF (v_new_sci IS NOT NULL AND v_new_sci <> COALESCE(r.species_scientific_name,''))
       OR (v_new_fr IS NOT NULL AND v_new_fr <> COALESCE(r.taxon_common_name_fr,'')) THEN
      UPDATE public.marcheur_observations
         SET species_scientific_name = COALESCE(v_new_sci, species_scientific_name),
             taxon_common_name_fr    = COALESCE(v_new_fr,  taxon_common_name_fr)
       WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 5) Extension du trigger propagate_taxonomy_alias_to_curations
--    pour réécrire aussi les marcheur_observations
-- ============================================================
CREATE OR REPLACE FUNCTION public.propagate_taxonomy_alias_to_curations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pattern text := NEW.alias_key;
BEGIN
  -- 1) Réécriture des curations existantes (comportement d'origine)
  UPDATE public.exploration_curations ec
     SET entity_id = NEW.canonical_scientific_name
   WHERE lower(btrim(ec.entity_id)) = v_pattern
     AND (NEW.marche_id IS NULL OR EXISTS (
       SELECT 1 FROM public.exploration_marches em
        WHERE em.exploration_id = ec.exploration_id
          AND em.marche_id = NEW.marche_id
     ));

  -- 2) Nouveau : réécriture des observations marcheurs correspondantes
  UPDATE public.marcheur_observations mo
     SET species_scientific_name = NEW.canonical_scientific_name,
         taxon_common_name_fr    = COALESCE(NEW.canonical_common_name_fr, mo.taxon_common_name_fr),
         notes = COALESCE(mo.notes,'') ||
                 CASE WHEN COALESCE(mo.notes,'') = '' THEN '' ELSE E'\n' END ||
                 '[alias-propagated] original=' || COALESCE(mo.species_scientific_name, mo.taxon_common_name_fr, '')
   WHERE (NEW.marche_id IS NULL OR mo.marche_id = NEW.marche_id)
     AND (
       lower(btrim(coalesce(mo.species_scientific_name,''))) = v_pattern
       OR lower(btrim(coalesce(mo.taxon_common_name_fr,'')))  = v_pattern
     )
     AND coalesce(mo.species_scientific_name,'') <> NEW.canonical_scientific_name;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 6) Snapshots iNat : refresh alias sur species_data jsonb
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_biodiversity_snapshots_aliases()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_updated integer := 0;
  v_new_data jsonb;
BEGIN
  FOR r IN
    SELECT bs.id, bs.species_data, bs.marche_id
      FROM public.biodiversity_snapshots bs
     WHERE bs.species_data IS NOT NULL
  LOOP
    SELECT jsonb_agg(
      CASE
        WHEN sp ? 'scientificName' AND public.resolve_species_alias(sp->>'scientificName', r.marche_id) <> (sp->>'scientificName')
          THEN jsonb_set(sp, '{scientificName}',
                 to_jsonb(public.resolve_species_alias(sp->>'scientificName', r.marche_id)))
        WHEN sp ? 'scientific_name' AND public.resolve_species_alias(sp->>'scientific_name', r.marche_id) <> (sp->>'scientific_name')
          THEN jsonb_set(sp, '{scientific_name}',
                 to_jsonb(public.resolve_species_alias(sp->>'scientific_name', r.marche_id)))
        ELSE sp
      END
    )
    INTO v_new_data
    FROM jsonb_array_elements(r.species_data) sp;

    IF v_new_data IS NOT NULL AND v_new_data <> r.species_data THEN
      UPDATE public.biodiversity_snapshots
         SET species_data = v_new_data
       WHERE id = r.id;
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN v_updated;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.resolve_species_alias(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_species_alias_common_fr(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_biodiversity_snapshots_aliases() TO service_role;

-- Backfill initial des snapshots
SELECT public.refresh_biodiversity_snapshots_aliases();
