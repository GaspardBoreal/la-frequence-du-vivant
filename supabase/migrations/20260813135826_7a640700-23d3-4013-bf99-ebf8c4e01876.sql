DROP POLICY IF EXISTS "iot_deliveries_partner_read" ON public.iot_webhook_deliveries;

CREATE POLICY "iot_deliveries_partner_read"
  ON public.iot_webhook_deliveries FOR SELECT TO authenticated
  USING (
    (capteur_id IS NOT NULL AND public.is_iot_partner_capteur(auth.uid(), capteur_id))
    OR EXISTS (
      SELECT 1
      FROM public.iot_fournisseurs f
      JOIN public.iot_partner_users pu
        ON pu.fournisseur_id = f.id AND pu.user_id = auth.uid() AND pu.actif = true
      WHERE iot_webhook_deliveries.fournisseur IS NOT NULL
        AND lower(f.nom) LIKE lower(iot_webhook_deliveries.fournisseur) || '%'
    )
  );