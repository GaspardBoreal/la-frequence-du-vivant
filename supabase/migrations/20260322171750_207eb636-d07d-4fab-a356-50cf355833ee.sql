-- RLS write policies for marche_events (admin only)
CREATE POLICY "Admins can insert marche_events"
ON public.marche_events
FOR INSERT
TO authenticated
WITH CHECK (check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can update marche_events"
ON public.marche_events
FOR UPDATE
TO authenticated
USING (check_is_admin_user(auth.uid()))
WITH CHECK (check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete marche_events"
ON public.marche_events
FOR DELETE
TO authenticated
USING (check_is_admin_user(auth.uid()));

-- Allow admins to insert participations (manual validation)
CREATE POLICY "Admins can insert marche_participations"
ON public.marche_participations
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) OR check_is_admin_user(auth.uid())
);

-- Allow admins to update community_profiles (formation/certification)
CREATE POLICY "Admins can update community_profiles"
ON public.community_profiles
FOR UPDATE
TO authenticated
USING (check_is_admin_user(auth.uid()))
WITH CHECK (check_is_admin_user(auth.uid()))