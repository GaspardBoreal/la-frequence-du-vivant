REVOKE ALL ON FUNCTION public.admin_list_iot_integrations(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_upsert_iot_integration(uuid, uuid, text, text, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_iot_integration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_iot_integrations(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_iot_integration(uuid, uuid, text, text, text, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_iot_integration(uuid) TO authenticated, service_role;