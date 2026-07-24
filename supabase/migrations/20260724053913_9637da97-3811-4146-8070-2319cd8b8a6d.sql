
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietes TO authenticated;
GRANT ALL ON public.proprietes TO service_role;
GRANT SELECT ON public.proprietes TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_marcheurs TO authenticated;
GRANT ALL ON public.propriete_marcheurs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_companies TO authenticated;
GRANT ALL ON public.propriete_companies TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_marche_events TO authenticated;
GRANT ALL ON public.propriete_marche_events TO service_role;
