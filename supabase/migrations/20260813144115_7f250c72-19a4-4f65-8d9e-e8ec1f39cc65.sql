GRANT SELECT, INSERT, UPDATE, DELETE ON public.iot_partner_users TO authenticated;
GRANT ALL ON public.iot_partner_users TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS iot_partner_users_user_fournisseur_uidx
  ON public.iot_partner_users (user_id, fournisseur_id);

CREATE INDEX IF NOT EXISTS iot_partner_users_fournisseur_actif_idx
  ON public.iot_partner_users (fournisseur_id, actif);