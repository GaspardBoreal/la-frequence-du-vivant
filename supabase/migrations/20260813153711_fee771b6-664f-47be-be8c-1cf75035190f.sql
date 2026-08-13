ALTER TABLE public.iot_fournisseurs ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.iot_fournisseur_slugify(_nom text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.f_unaccent(coalesce(_nom, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

UPDATE public.iot_fournisseurs
SET slug = public.iot_fournisseur_slugify(nom)
WHERE slug IS NULL OR slug = '';

-- Désambiguïsation éventuelle
WITH d AS (
  SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM public.iot_fournisseurs
)
UPDATE public.iot_fournisseurs f
SET slug = f.slug || '-' || d.rn
FROM d
WHERE d.id = f.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS iot_fournisseurs_slug_key ON public.iot_fournisseurs (slug);

CREATE OR REPLACE FUNCTION public.iot_fournisseurs_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.iot_fournisseur_slugify(NEW.nom);
    IF EXISTS (SELECT 1 FROM public.iot_fournisseurs WHERE slug = NEW.slug AND id <> NEW.id) THEN
      NEW.slug := NEW.slug || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_iot_fournisseurs_set_slug ON public.iot_fournisseurs;
CREATE TRIGGER trg_iot_fournisseurs_set_slug
BEFORE INSERT OR UPDATE OF nom, slug ON public.iot_fournisseurs
FOR EACH ROW EXECUTE FUNCTION public.iot_fournisseurs_set_slug();

CREATE OR REPLACE FUNCTION public.get_user_apps_access()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_id UUID;
  v_proprietes JSONB;
  v_main_id UUID;
  v_partners JSONB;
  v_is_admin BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'hasMarcheurAccess', false,
      'proprietesAccessibles', '[]'::jsonb,
      'proprietePrincipaleId', NULL,
      'partenairesIot', '[]'::jsonb
    );
  END IF;

  BEGIN
    v_is_admin := public.check_is_admin_user(auth.uid());
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := false;
  END;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', f.id,
      'nom', f.nom,
      'slug', f.slug,
      'logo_url', f.logo_url,
      'capteurs_count', (
        SELECT count(*)
        FROM public.iot_capteurs c
        JOIN public.iot_types_capteurs t ON t.id = c.type_id
        WHERE t.fournisseur_id = f.id
      )
    ) ORDER BY f.nom
  )
  INTO v_partners
  FROM public.iot_fournisseurs f
  WHERE v_is_admin
     OR EXISTS (
       SELECT 1 FROM public.iot_partner_users pu
       WHERE pu.fournisseur_id = f.id
         AND pu.user_id = auth.uid()
         AND pu.actif = true
     );

  SELECT id INTO v_profile_id
  FROM public.community_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'hasMarcheurAccess', false,
      'proprietesAccessibles', '[]'::jsonb,
      'proprietePrincipaleId', NULL,
      'partenairesIot', COALESCE(v_partners, '[]'::jsonb)
    );
  END IF;

  WITH access_rows AS (
    SELECT
      p.id,
      p.nom,
      p.slug,
      p.ville,
      p.photo_hero_url,
      COALESCE(pm.role, 'proprietaire'::public.role_propriete) AS role,
      (COALESCE(pm.is_main, false) OR p.main_walker_id = v_profile_id) AS is_main
    FROM public.proprietes p
    LEFT JOIN public.propriete_marcheurs pm
      ON pm.propriete_id = p.id
     AND pm.community_profile_id = v_profile_id
    WHERE p.is_active = true
      AND (
        pm.community_profile_id IS NOT NULL
        OR p.main_walker_id = v_profile_id
      )
  ), main_access AS (
    SELECT id
    FROM access_rows
    WHERE is_main = true
    ORDER BY nom
    LIMIT 1
  )
  SELECT
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'nom', nom,
          'slug', slug,
          'ville', ville,
          'photo_hero_url', photo_hero_url,
          'role', role,
          'is_main', is_main
        ) ORDER BY is_main DESC, nom
      )
      FROM access_rows
    ),
    (SELECT id FROM main_access)
  INTO v_proprietes, v_main_id;

  RETURN jsonb_build_object(
    'hasMarcheurAccess', true,
    'proprietesAccessibles', COALESCE(v_proprietes, '[]'::jsonb),
    'proprietePrincipaleId', v_main_id,
    'partenairesIot', COALESCE(v_partners, '[]'::jsonb)
  );
END;
$function$;