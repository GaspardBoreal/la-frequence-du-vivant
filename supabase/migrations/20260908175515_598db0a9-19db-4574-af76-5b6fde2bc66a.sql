REVOKE EXECUTE ON FUNCTION public.count_species_awaiting_eco_tags() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_species_awaiting_eco_tags(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_species_awaiting_eco_tags() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_species_awaiting_eco_tags(integer) TO authenticated, service_role;