-- 1) Table de rattachement partenaire ↔ fournisseur de sondes
CREATE TABLE public.iot_partner_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fournisseur_id uuid NOT NULL REFERENCES public.iot_fournisseurs(id) ON DELETE CASCADE,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, fournisseur_id)
);

GRANT SELECT ON public.iot_partner_users TO authenticated;
GRANT ALL ON public.iot_partner_users TO service_role;

ALTER TABLE public.iot_partner_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iot_partner_users_self_read"
  ON public.iot_partner_users FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.check_is_admin_user(auth.uid()));

CREATE POLICY "iot_partner_users_admin_write"
  ON public.iot_partner_users FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE TRIGGER iot_partner_users_touch
  BEFORE UPDATE ON public.iot_partner_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Fonctions de résolution du périmètre partenaire
CREATE OR REPLACE FUNCTION public.iot_partner_fournisseur_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(fournisseur_id), '{}'::uuid[])
  FROM public.iot_partner_users
  WHERE user_id = _user_id AND actif = true;
$$;

CREATE OR REPLACE FUNCTION public.is_iot_partner_of_fournisseur(_user_id uuid, _fournisseur_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.iot_partner_users
    WHERE user_id = _user_id AND fournisseur_id = _fournisseur_id AND actif = true
  );
$$;

/** Vrai si le capteur appartient à un fournisseur dont l'utilisateur est partenaire. */
CREATE OR REPLACE FUNCTION public.is_iot_partner_capteur(_user_id uuid, _capteur_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.iot_capteurs c
    JOIN public.iot_types_capteurs t ON t.id = c.type_id
    JOIN public.iot_partner_users pu
      ON pu.fournisseur_id = t.fournisseur_id
     AND pu.user_id = _user_id
     AND pu.actif = true
    WHERE c.id = _capteur_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.iot_partner_fournisseur_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_iot_partner_of_fournisseur(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_iot_partner_capteur(uuid, uuid) TO authenticated;

-- 3) Policies additives de lecture pour les partenaires
CREATE POLICY "iot_capteurs_partner_read"
  ON public.iot_capteurs FOR SELECT TO authenticated
  USING (public.is_iot_partner_capteur(auth.uid(), id));

CREATE POLICY "iot_mesures_partner_read"
  ON public.iot_mesures FOR SELECT TO authenticated
  USING (public.is_iot_partner_capteur(auth.uid(), capteur_id));

CREATE POLICY "iot_capteur_photos_partner_read"
  ON public.iot_capteur_photos FOR SELECT TO authenticated
  USING (public.is_iot_partner_capteur(auth.uid(), capteur_id));

CREATE POLICY "iot_deliveries_partner_read"
  ON public.iot_webhook_deliveries FOR SELECT TO authenticated
  USING (
    (capteur_id IS NOT NULL AND public.is_iot_partner_capteur(auth.uid(), capteur_id))
    OR EXISTS (
      SELECT 1
      FROM public.iot_fournisseurs f
      JOIN public.iot_partner_users pu
        ON pu.fournisseur_id = f.id AND pu.user_id = auth.uid() AND pu.actif = true
      WHERE lower(f.nom) = lower(iot_webhook_deliveries.fournisseur)
    )
  );