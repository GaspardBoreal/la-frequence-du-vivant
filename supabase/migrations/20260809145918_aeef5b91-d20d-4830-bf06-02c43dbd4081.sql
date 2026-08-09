CREATE OR REPLACE FUNCTION public.is_marcheur_fiche_curator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL AND (
    public.check_is_admin_user(_user_id)
    OR public.is_exploration_curator(_user_id)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_marcheur_fiche_curator(uuid) FROM anon;

DROP POLICY IF EXISTS "Authenticated users can insert exploration_marcheurs" ON public.exploration_marcheurs;
DROP POLICY IF EXISTS "Authenticated users can update exploration_marcheurs" ON public.exploration_marcheurs;
DROP POLICY IF EXISTS "Authenticated users can delete exploration_marcheurs" ON public.exploration_marcheurs;

CREATE POLICY "Owners and curators insert exploration_marcheurs" ON public.exploration_marcheurs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_marcheur_fiche_curator(auth.uid()));

CREATE POLICY "Owners and curators update exploration_marcheurs" ON public.exploration_marcheurs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_marcheur_fiche_curator(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_marcheur_fiche_curator(auth.uid()));

CREATE POLICY "Owners and curators delete exploration_marcheurs" ON public.exploration_marcheurs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_marcheur_fiche_curator(auth.uid()));