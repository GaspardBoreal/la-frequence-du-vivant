REVOKE EXECUTE ON FUNCTION public.iot_partner_fournisseur_ids(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_iot_partner_of_fournisseur(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_iot_partner_capteur(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.iot_partner_fournisseur_ids(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_iot_partner_of_fournisseur(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_iot_partner_capteur(uuid, uuid) TO authenticated, service_role;