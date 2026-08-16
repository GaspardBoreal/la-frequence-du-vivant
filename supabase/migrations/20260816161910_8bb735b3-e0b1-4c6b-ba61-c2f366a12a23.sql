-- =====================================================================
-- Socle d'onboarding « Fréquence Jardin »
-- Objectif : permettre la création / le rattachement d'une propriété
-- par un utilisateur non-admin, SANS ouvrir en écriture directe
-- les tables `proprietes` et `propriete_marcheurs`.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1a. Table des invitations de propriété
-- ---------------------------------------------------------------------
CREATE TABLE public.propriete_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id  UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  code          TEXT NOT NULL UNIQUE,
  role          public.role_propriete NOT NULL DEFAULT 'prestataire',
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_by    UUID,
  consumed_by   UUID,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Le rôle « proprietaire » ne peut JAMAIS être accordé par invitation.
  CONSTRAINT propriete_invitations_role_autorise
    CHECK (role IN ('prestataire'::public.role_propriete,
                    'marcheur_historique'::public.role_propriete))
);

CREATE INDEX idx_propriete_invitations_code ON public.propriete_invitations(code);
CREATE INDEX idx_propriete_invitations_propriete ON public.propriete_invitations(propriete_id);

GRANT SELECT, INSERT, UPDATE ON public.propriete_invitations TO authenticated;
GRANT ALL ON public.propriete_invitations TO service_role;

ALTER TABLE public.propriete_invitations ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement les personnes ayant accès à la propriété, ou un admin.
CREATE POLICY "Invitations lisibles par acces propriete"
  ON public.propriete_invitations
  FOR SELECT
  TO authenticated
  USING (
    public.is_current_user_admin()
    OR public.can_access_propriete(propriete_id)
  );

-- Écriture directe : admin uniquement. Le flux normal passe par les RPC.
CREATE POLICY "Invitations gerees par admin"
  ON public.propriete_invitations
  FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());


-- ---------------------------------------------------------------------
-- Helper interne : génération d'un code lisible de 8 caractères
-- (alphabet sans caractères ambigus : ni 0/O, ni 1/I/L)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gen_invitation_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_alphabet CONSTANT TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code TEXT;
  v_i INT;
BEGIN
  LOOP
    v_code := '';
    FOR v_i IN 1..8 LOOP
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.propriete_invitations WHERE code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;


-- ---------------------------------------------------------------------
-- 1b. RPC : créer sa propre propriété
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.onboard_create_propriete(
  _nom          TEXT,
  _ville        TEXT DEFAULT NULL,
  _code_postal  TEXT DEFAULT NULL,
  _latitude     DOUBLE PRECISION DEFAULT NULL,
  _longitude    DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_profile_id UUID;
  v_nom        TEXT := btrim(coalesce(_nom, ''));
  v_base_slug  TEXT;
  v_slug       TEXT;
  v_n          INT := 1;
  v_recent     INT;
  v_new_id     UUID;
  v_is_first   BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;

  IF length(v_nom) < 2 OR length(v_nom) > 120 THEN
    RAISE EXCEPTION 'Le nom du jardin doit contenir entre 2 et 120 caractères'
      USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_profile_id
  FROM public.community_profiles
  WHERE user_id = v_uid
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil marcheur associé à ce compte'
      USING ERRCODE = '42501';
  END IF;

  -- Garde-fou anti-abus : 3 créations maximum par 24 h.
  SELECT count(*) INTO v_recent
  FROM public.proprietes
  WHERE created_by = v_uid
    AND created_at > now() - INTERVAL '24 hours';

  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'Limite atteinte : 3 jardins maximum par 24 heures'
      USING ERRCODE = '54000';
  END IF;

  -- Garde-fou anti-doublon pour ce même profil.
  IF EXISTS (
    SELECT 1 FROM public.proprietes p
    WHERE p.is_active = true
      AND p.main_walker_id = v_profile_id
      AND lower(btrim(p.nom)) = lower(v_nom)
      AND coalesce(p.code_postal, '') = coalesce(btrim(_code_postal), '')
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà un jardin portant ce nom à cette adresse'
      USING ERRCODE = '23505';
  END IF;

  -- Slug stable, sans accent, unique.
  v_base_slug := regexp_replace(
                   regexp_replace(lower(public.f_unaccent(v_nom)), '[^a-z0-9]+', '-', 'g'),
                   '(^-+|-+$)', '', 'g');
  IF v_base_slug = '' THEN
    v_base_slug := 'jardin';
  END IF;
  v_slug := v_base_slug;
  WHILE EXISTS (SELECT 1 FROM public.proprietes WHERE slug = v_slug) LOOP
    v_n := v_n + 1;
    v_slug := v_base_slug || '-' || v_n;
  END LOOP;

  -- Première propriété de ce marcheur ?
  SELECT NOT EXISTS (
    SELECT 1 FROM public.propriete_marcheurs
    WHERE community_profile_id = v_profile_id
  ) INTO v_is_first;

  INSERT INTO public.proprietes (
    nom, slug, ville, code_postal, latitude, longitude,
    main_walker_id, created_by, is_active
  ) VALUES (
    v_nom, v_slug, nullif(btrim(_ville), ''), nullif(btrim(_code_postal), ''),
    _latitude, _longitude,
    v_profile_id, v_uid, true
  )
  RETURNING id INTO v_new_id;

  INSERT INTO public.propriete_marcheurs (propriete_id, community_profile_id, role, is_main)
  VALUES (v_new_id, v_profile_id, 'proprietaire'::public.role_propriete, v_is_first);

  RETURN jsonb_build_object('id', v_new_id, 'nom', v_nom, 'slug', v_slug);
END;
$$;


-- ---------------------------------------------------------------------
-- 1c. RPC : rejoindre une propriété via un code d'invitation
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.onboard_join_propriete(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_profile_id UUID;
  v_inv        RECORD;
  v_prop       RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_profile_id
  FROM public.community_profiles
  WHERE user_id = v_uid
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil marcheur associé à ce compte'
      USING ERRCODE = '42501';
  END IF;

  -- Verrouillage pour éviter la double consommation concurrente.
  SELECT * INTO v_inv
  FROM public.propriete_invitations
  WHERE code = upper(btrim(coalesce(_code, '')))
  FOR UPDATE;

  -- Message STRICTEMENT identique pour : inexistant / expiré / déjà consommé.
  -- Aucune énumération possible.
  IF v_inv.id IS NULL
     OR v_inv.consumed_at IS NOT NULL
     OR v_inv.expires_at <= now() THEN
    RAISE EXCEPTION 'Code invalide' USING ERRCODE = '42501';
  END IF;

  SELECT id, nom, slug INTO v_prop
  FROM public.proprietes
  WHERE id = v_inv.propriete_id AND is_active = true;

  IF v_prop.id IS NULL THEN
    RAISE EXCEPTION 'Code invalide' USING ERRCODE = '42501';
  END IF;

  -- Idempotence : si le lien existe déjà, on consomme et on renvoie la propriété.
  IF NOT EXISTS (
    SELECT 1 FROM public.propriete_marcheurs
    WHERE propriete_id = v_prop.id AND community_profile_id = v_profile_id
  ) THEN
    INSERT INTO public.propriete_marcheurs (propriete_id, community_profile_id, role, is_main)
    VALUES (v_prop.id, v_profile_id, v_inv.role, false);
  END IF;

  UPDATE public.propriete_invitations
  SET consumed_by = v_uid, consumed_at = now()
  WHERE id = v_inv.id;

  RETURN jsonb_build_object('id', v_prop.id, 'nom', v_prop.nom, 'slug', v_prop.slug);
END;
$$;


-- ---------------------------------------------------------------------
-- 1d. RPC : créer une invitation (propriétaire du jardin ou admin)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_propriete_invitation(
  _propriete_id UUID,
  _role         public.role_propriete DEFAULT 'prestataire'
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_profile_id UUID;
  v_is_admin   BOOLEAN := false;
  v_allowed    BOOLEAN := false;
  v_code       TEXT;
  v_expires    TIMESTAMPTZ;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié' USING ERRCODE = '42501';
  END IF;

  IF _role NOT IN ('prestataire'::public.role_propriete,
                   'marcheur_historique'::public.role_propriete) THEN
    RAISE EXCEPTION 'Rôle non autorisé pour une invitation' USING ERRCODE = '42501';
  END IF;

  v_is_admin := public.check_is_admin_user(v_uid);

  SELECT id INTO v_profile_id
  FROM public.community_profiles
  WHERE user_id = v_uid
  LIMIT 1;

  -- Seul un propriétaire du jardin (ou un admin) peut inviter.
  v_allowed := v_is_admin OR (
    v_profile_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.proprietes p
        WHERE p.id = _propriete_id AND p.main_walker_id = v_profile_id
      )
      OR EXISTS (
        SELECT 1 FROM public.propriete_marcheurs pm
        WHERE pm.propriete_id = _propriete_id
          AND pm.community_profile_id = v_profile_id
          AND pm.role = 'proprietaire'::public.role_propriete
      )
    )
  );

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Accès refusé à cette propriété' USING ERRCODE = '42501';
  END IF;

  v_code := public.gen_invitation_code();
  v_expires := now() + INTERVAL '7 days';

  INSERT INTO public.propriete_invitations (propriete_id, code, role, expires_at, created_by)
  VALUES (_propriete_id, v_code, _role, v_expires, v_uid);

  RETURN jsonb_build_object('code', v_code, 'role', _role, 'expires_at', v_expires);
END;
$$;


-- ---------------------------------------------------------------------
-- Droits d'exécution : utilisateurs authentifiés uniquement.
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.gen_invitation_code() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.onboard_create_propriete(TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onboard_create_propriete(TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

REVOKE ALL ON FUNCTION public.onboard_join_propriete(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onboard_join_propriete(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.create_propriete_invitation(UUID, public.role_propriete) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_propriete_invitation(UUID, public.role_propriete) TO authenticated;