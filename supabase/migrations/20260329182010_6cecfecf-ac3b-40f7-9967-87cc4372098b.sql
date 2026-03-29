CREATE POLICY "Admins can delete marche_participations"
ON public.marche_participations FOR DELETE
TO authenticated
USING (public.check_is_admin_user(auth.uid()));