REVOKE EXECUTE ON FUNCTION public.upsert_species_taxonomy_alias(uuid, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_species_taxonomy_alias(uuid, text, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_species_taxonomy_alias(uuid, text, text, text, text, text) TO authenticated, service_role;