-- Security definer function to check if a user has at least Ambassadeur level
CREATE OR REPLACE FUNCTION public.can_create_marche(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.check_is_admin_user(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.community_profiles cp
      WHERE cp.user_id = _user_id
        AND cp.role IN ('ambassadeur', 'sentinelle')
    );
$$;

-- Tighten INSERT on marches: only Ambassadeur/Sentinelle/Admin
DROP POLICY IF EXISTS "Only authenticated users can insert marches" ON public.marches;

CREATE POLICY "Ambassadeurs Sentinelles Admins can insert marches"
ON public.marches
FOR INSERT
TO authenticated
WITH CHECK (public.can_create_marche(auth.uid()));

-- Tighten INSERT on exploration_marches: only Ambassadeur/Sentinelle/Admin
DROP POLICY IF EXISTS "Only authenticated users can insert exploration_marches" ON public.exploration_marches;

CREATE POLICY "Ambassadeurs Sentinelles Admins can insert exploration_marches"
ON public.exploration_marches
FOR INSERT
TO authenticated
WITH CHECK (public.can_create_marche(auth.uid()));