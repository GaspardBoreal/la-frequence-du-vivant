-- Security definer function: check if two users share a marche_event
CREATE OR REPLACE FUNCTION public.shares_marche_event(_viewer_id uuid, _profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.marche_participations a
    JOIN public.marche_participations b ON a.marche_event_id = b.marche_event_id
    WHERE a.user_id = _viewer_id
      AND b.user_id = _profile_user_id
  );
$$;

-- New SELECT policy: co-participants can see each other's profile
CREATE POLICY "Co-participants can read profiles"
ON public.community_profiles FOR SELECT
TO authenticated
USING (
  public.shares_marche_event(auth.uid(), user_id)
);