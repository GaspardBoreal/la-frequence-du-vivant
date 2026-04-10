CREATE POLICY "Users can delete own participation"
ON public.marche_participations
FOR DELETE
TO authenticated
USING (user_id = auth.uid());