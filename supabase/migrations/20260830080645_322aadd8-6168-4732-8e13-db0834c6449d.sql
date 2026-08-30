CREATE TABLE IF NOT EXISTS public.iot_propriete_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  fournisseur_id uuid NOT NULL REFERENCES public.iot_fournisseurs(id) ON DELETE CASCADE,
  api_key text NOT NULL,
  label text,
  external_farm_id text,
  external_plot_id text,
  actif boolean NOT NULL DEFAULT true,
  last_pull_at timestamptz,
  last_pull_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (propriete_id, fournisseur_id)
);

GRANT ALL ON public.iot_propriete_integrations TO service_role;

ALTER TABLE public.iot_propriete_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aucun acces direct client" ON public.iot_propriete_integrations
  FOR SELECT TO authenticated USING (false);

CREATE TRIGGER iot_propriete_integrations_touch
  BEFORE UPDATE ON public.iot_propriete_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.iot_capteurs
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_kind text;

CREATE UNIQUE INDEX IF NOT EXISTS iot_capteurs_external_uniq
  ON public.iot_capteurs (external_kind, external_id)
  WHERE external_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_list_iot_integrations(p_propriete_id uuid)
RETURNS TABLE (
  id uuid,
  propriete_id uuid,
  fournisseur_id uuid,
  fournisseur_nom text,
  fournisseur_slug text,
  key_hint text,
  label text,
  external_farm_id text,
  external_plot_id text,
  actif boolean,
  last_pull_at timestamptz,
  last_pull_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.propriete_id, i.fournisseur_id, f.nom, f.slug,
         '••••' || right(i.api_key, 4),
         i.label, i.external_farm_id, i.external_plot_id, i.actif,
         i.last_pull_at, i.last_pull_status
  FROM public.iot_propriete_integrations i
  JOIN public.iot_fournisseurs f ON f.id = i.fournisseur_id
  WHERE i.propriete_id = p_propriete_id
    AND public.check_is_admin_user(auth.uid())
  ORDER BY f.nom;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_iot_integration(
  p_propriete_id uuid,
  p_fournisseur_id uuid,
  p_api_key text DEFAULT NULL,
  p_label text DEFAULT NULL,
  p_external_farm_id text DEFAULT NULL,
  p_external_plot_id text DEFAULT NULL,
  p_actif boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Reserve aux administrateurs';
  END IF;

  SELECT id INTO v_id
  FROM public.iot_propriete_integrations
  WHERE propriete_id = p_propriete_id AND fournisseur_id = p_fournisseur_id;

  IF v_id IS NULL THEN
    IF p_api_key IS NULL OR btrim(p_api_key) = '' THEN
      RAISE EXCEPTION 'Cle API requise';
    END IF;
    INSERT INTO public.iot_propriete_integrations
      (propriete_id, fournisseur_id, api_key, label, external_farm_id, external_plot_id, actif)
    VALUES (p_propriete_id, p_fournisseur_id, btrim(p_api_key), p_label,
            p_external_farm_id, p_external_plot_id, coalesce(p_actif, true))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.iot_propriete_integrations
    SET api_key = CASE WHEN p_api_key IS NULL OR btrim(p_api_key) = '' THEN api_key ELSE btrim(p_api_key) END,
        label = coalesce(p_label, label),
        external_farm_id = coalesce(p_external_farm_id, external_farm_id),
        external_plot_id = coalesce(p_external_plot_id, external_plot_id),
        actif = coalesce(p_actif, actif)
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_iot_integration(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Reserve aux administrateurs';
  END IF;
  DELETE FROM public.iot_propriete_integrations WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_iot_integrations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_iot_integration(uuid, uuid, text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_iot_integration(uuid) TO authenticated;