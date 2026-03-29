-- Security definer function to get event IDs a user participates in (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.get_user_event_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT marche_event_id
  FROM public.marche_participations
  WHERE user_id = _user_id;
$$;

-- Replace the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can read own participations" ON public.marche_participations;

CREATE POLICY "Users can read co-participants"
ON public.marche_participations FOR SELECT
TO authenticated
USING (
  public.check_is_admin_user(auth.uid())
  OR
  marche_event_id IN (SELECT public.get_user_event_ids(auth.uid()))
);