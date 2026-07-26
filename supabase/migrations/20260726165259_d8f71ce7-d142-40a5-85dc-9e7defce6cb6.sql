CREATE OR REPLACE FUNCTION public.can_access_propriete(_propriete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.check_is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.proprietes p
      JOIN public.community_profiles cp ON cp.id = p.main_walker_id
      WHERE p.id = _propriete_id AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.propriete_marcheurs pm
      JOIN public.community_profiles cp ON cp.id = pm.community_profile_id
      WHERE pm.propriete_id = _propriete_id AND cp.user_id = auth.uid()
    );
$$;

CREATE TABLE public.propriete_test_medias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  sample_id text NOT NULL,
  sample_label text,
  sample_location text,
  block text NOT NULL,
  test_id text NOT NULL,
  media_type text NOT NULL DEFAULT 'photo',
  storage_path text NOT NULL,
  mime text,
  size_bytes bigint,
  width integer,
  height integer,
  duration_s numeric,
  caption text,
  taken_at timestamptz,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_propriete_test_medias_lookup
  ON public.propriete_test_medias (propriete_id, block, test_id, sample_id, order_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_test_medias TO authenticated;
GRANT ALL ON public.propriete_test_medias TO service_role;

ALTER TABLE public.propriete_test_medias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriete members can view test medias"
  ON public.propriete_test_medias FOR SELECT TO authenticated
  USING (public.can_access_propriete(propriete_id));

CREATE POLICY "Propriete members can add test medias"
  ON public.propriete_test_medias FOR INSERT TO authenticated
  WITH CHECK (public.can_access_propriete(propriete_id) AND uploaded_by = auth.uid());

CREATE POLICY "Author or curator can update test medias"
  ON public.propriete_test_medias FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid() OR public.can_curate_propriete_gallery(propriete_id))
  WITH CHECK (uploaded_by = auth.uid() OR public.can_curate_propriete_gallery(propriete_id));

CREATE POLICY "Author or curator can delete test medias"
  ON public.propriete_test_medias FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.can_curate_propriete_gallery(propriete_id));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_propriete_test_medias_updated_at
  BEFORE UPDATE ON public.propriete_test_medias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies : les fichiers sont rangés sous "<propriete_id>/..."
CREATE POLICY "Propriete members can read test files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'propriete-tests'
    AND public.can_access_propriete(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Propriete members can upload test files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'propriete-tests'
    AND public.can_access_propriete(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Author or curator can update test files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'propriete-tests'
    AND (owner = auth.uid() OR public.can_curate_propriete_gallery(((storage.foldername(name))[1])::uuid))
  );

CREATE POLICY "Author or curator can delete test files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'propriete-tests'
    AND (owner = auth.uid() OR public.can_curate_propriete_gallery(((storage.foldername(name))[1])::uuid))
  );