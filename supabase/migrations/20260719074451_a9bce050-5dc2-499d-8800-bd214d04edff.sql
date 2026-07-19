CREATE OR REPLACE FUNCTION public.normalize_species_alias_key(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT lower(trim(regexp_replace(
    translate(coalesce(p_name,''),
      'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÝÿÑñÇç',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuYyNnCc'
    ), '\s+', ' ', 'g')));
$$;

CREATE OR REPLACE FUNCTION public.upsert_species_taxonomy_alias(
  p_marche_id uuid,
  p_alias_key text,
  p_canonical_scientific_name text,
  p_canonical_common_name_fr text DEFAULT NULL,
  p_reason text DEFAULT 'manual',
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_alias_key text := public.normalize_species_alias_key(p_alias_key);
  v_id uuid;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = '42501';
  END IF;

  IF v_alias_key IS NULL OR v_alias_key = '' THEN
    RAISE EXCEPTION 'Alias key is required' USING ERRCODE = '22023';
  END IF;

  IF p_canonical_scientific_name IS NULL OR btrim(p_canonical_scientific_name) = '' THEN
    RAISE EXCEPTION 'Canonical scientific name is required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.species_taxonomy_aliases
     SET canonical_scientific_name = btrim(p_canonical_scientific_name),
         canonical_common_name_fr = p_canonical_common_name_fr,
         reason = COALESCE(NULLIF(btrim(p_reason), ''), 'manual'),
         notes = p_notes,
         created_by = auth.uid(),
         updated_at = now()
   WHERE alias_key = v_alias_key
     AND (
       (p_marche_id IS NULL AND marche_id IS NULL)
       OR marche_id = p_marche_id
     )
   RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.species_taxonomy_aliases (
    marche_id,
    alias_key,
    canonical_scientific_name,
    canonical_common_name_fr,
    reason,
    notes,
    created_by
  ) VALUES (
    p_marche_id,
    v_alias_key,
    btrim(p_canonical_scientific_name),
    p_canonical_common_name_fr,
    COALESCE(NULLIF(btrim(p_reason), ''), 'manual'),
    p_notes,
    auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_species_alias_key(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_species_taxonomy_alias(uuid, text, text, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.resolve_species_alias(p_name text, p_marche_id uuid DEFAULT NULL::uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH k AS (
    SELECT public.normalize_species_alias_key(p_name) AS key
  )
  SELECT COALESCE(
    (SELECT canonical_scientific_name
       FROM public.species_taxonomy_aliases, k
      WHERE alias_key = k.key
        AND marche_id = p_marche_id
      LIMIT 1),
    (SELECT canonical_scientific_name
       FROM public.species_taxonomy_aliases, k
      WHERE alias_key = k.key
        AND marche_id IS NULL
      LIMIT 1),
    p_name
  );
$$;

CREATE OR REPLACE FUNCTION public.resolve_species_alias_common_fr(p_name text, p_marche_id uuid DEFAULT NULL::uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH k AS (
    SELECT public.normalize_species_alias_key(p_name) AS key
  )
  SELECT COALESCE(
    (SELECT canonical_common_name_fr
       FROM public.species_taxonomy_aliases, k
      WHERE alias_key = k.key
        AND marche_id = p_marche_id
        AND canonical_common_name_fr IS NOT NULL
      LIMIT 1),
    (SELECT canonical_common_name_fr
       FROM public.species_taxonomy_aliases, k
      WHERE alias_key = k.key
        AND marche_id IS NULL
        AND canonical_common_name_fr IS NOT NULL
      LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.propagate_taxonomy_alias_to_curations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pattern text := NEW.alias_key;
BEGIN
  -- 1) Réécriture des curations existantes
  UPDATE public.exploration_curations ec
     SET entity_id = NEW.canonical_scientific_name
   WHERE public.normalize_species_alias_key(ec.entity_id) = v_pattern
     AND (NEW.marche_id IS NULL OR EXISTS (
       SELECT 1 FROM public.exploration_marches em
        WHERE em.exploration_id = ec.exploration_id
          AND em.marche_id = NEW.marche_id
     ));

  -- 2) Réécriture des observations marcheurs existantes
  UPDATE public.marcheur_observations mo
     SET species_scientific_name = NEW.canonical_scientific_name,
         taxon_common_name_fr    = COALESCE(NEW.canonical_common_name_fr, mo.taxon_common_name_fr),
         notes = COALESCE(mo.notes,'') ||
                 CASE WHEN COALESCE(mo.notes,'') = '' THEN '' ELSE E'\n' END ||
                 '[alias-propagated] original=' || COALESCE(mo.species_scientific_name, mo.taxon_common_name_fr, '')
   WHERE (NEW.marche_id IS NULL OR mo.marche_id = NEW.marche_id)
     AND (
       public.normalize_species_alias_key(mo.species_scientific_name) = v_pattern
       OR public.normalize_species_alias_key(mo.taxon_common_name_fr) = v_pattern
     )
     AND coalesce(mo.species_scientific_name,'') <> NEW.canonical_scientific_name;

  -- 3) Réécriture des snapshots biodiversité existants
  UPDATE public.biodiversity_snapshots bs
     SET species_data = rewritten.species_data,
         updated_at = now()
    FROM (
      SELECT bs_inner.id,
             jsonb_agg(
               CASE
                 WHEN public.normalize_species_alias_key(sp.elem->>'scientificName') = v_pattern THEN
                   jsonb_set(
                     CASE
                       WHEN NEW.canonical_common_name_fr IS NOT NULL
                         THEN jsonb_set(sp.elem, '{commonName}', to_jsonb(NEW.canonical_common_name_fr), true)
                       ELSE sp.elem
                     END,
                     '{scientificName}', to_jsonb(NEW.canonical_scientific_name), true
                   )
                 WHEN public.normalize_species_alias_key(sp.elem->>'scientific_name') = v_pattern THEN
                   jsonb_set(
                     CASE
                       WHEN NEW.canonical_common_name_fr IS NOT NULL
                         THEN jsonb_set(sp.elem, '{common_name}', to_jsonb(NEW.canonical_common_name_fr), true)
                       ELSE sp.elem
                     END,
                     '{scientific_name}', to_jsonb(NEW.canonical_scientific_name), true
                   )
                 WHEN public.normalize_species_alias_key(sp.elem->>'commonName') = v_pattern THEN
                   jsonb_set(
                     jsonb_set(sp.elem, '{scientificName}', to_jsonb(NEW.canonical_scientific_name), true),
                     '{commonName}', to_jsonb(COALESCE(NEW.canonical_common_name_fr, sp.elem->>'commonName')), true
                   )
                 WHEN public.normalize_species_alias_key(sp.elem->>'common_name') = v_pattern THEN
                   jsonb_set(
                     jsonb_set(sp.elem, '{scientific_name}', to_jsonb(NEW.canonical_scientific_name), true),
                     '{common_name}', to_jsonb(COALESCE(NEW.canonical_common_name_fr, sp.elem->>'common_name')), true
                   )
                 ELSE sp.elem
               END
               ORDER BY sp.ord
             ) AS species_data
        FROM public.biodiversity_snapshots bs_inner
        CROSS JOIN LATERAL jsonb_array_elements(bs_inner.species_data) WITH ORDINALITY AS sp(elem, ord)
       WHERE jsonb_typeof(bs_inner.species_data) = 'array'
         AND (NEW.marche_id IS NULL OR bs_inner.marche_id = NEW.marche_id)
       GROUP BY bs_inner.id
      HAVING bool_or(
        public.normalize_species_alias_key(sp.elem->>'scientificName') = v_pattern
        OR public.normalize_species_alias_key(sp.elem->>'scientific_name') = v_pattern
        OR public.normalize_species_alias_key(sp.elem->>'commonName') = v_pattern
        OR public.normalize_species_alias_key(sp.elem->>'common_name') = v_pattern
      )
    ) rewritten
   WHERE bs.id = rewritten.id;

  RETURN NEW;
END;
$$;