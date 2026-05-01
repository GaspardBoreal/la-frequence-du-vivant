-- =========================
-- Tables
-- =========================
CREATE TABLE public.exploration_convivialite_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id uuid NOT NULL REFERENCES public.explorations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  url text NOT NULL,
  width integer,
  height integer,
  taille_octets bigint,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_convivialite_photos_exploration ON public.exploration_convivialite_photos(exploration_id, created_at DESC);
CREATE INDEX idx_convivialite_photos_user ON public.exploration_convivialite_photos(user_id);

CREATE TABLE public.exploration_convivialite_signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.exploration_convivialite_photos(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL,
  raison text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

CREATE INDEX idx_convivialite_signalements_photo ON public.exploration_convivialite_signalements(photo_id);
CREATE INDEX idx_convivialite_signalements_unresolved ON public.exploration_convivialite_signalements(created_at) WHERE resolved_at IS NULL;

-- =========================
-- Trigger updated_at
-- =========================
CREATE OR REPLACE FUNCTION public.set_convivialite_photos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_convivialite_photos_updated_at
BEFORE UPDATE ON public.exploration_convivialite_photos
FOR EACH ROW EXECUTE FUNCTION public.set_convivialite_photos_updated_at();

-- =========================
-- Security definer functions
-- =========================
CREATE OR REPLACE FUNCTION public.can_view_exploration_convivialite(_user_id uuid, _exploration_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.check_is_admin_user(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.marche_participations mp
      JOIN public.marche_events me ON me.id = mp.marche_event_id
      WHERE mp.user_id = _user_id
        AND me.exploration_id = _exploration_id
    );
$$;

CREATE OR REPLACE FUNCTION public.can_upload_convivialite(_user_id uuid, _exploration_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_profiles cp
    WHERE cp.user_id = _user_id
      AND cp.role::text IN ('ambassadeur', 'sentinelle')
  )
  AND EXISTS (
    SELECT 1
    FROM public.marche_participations mp
    JOIN public.marche_events me ON me.id = mp.marche_event_id
    WHERE mp.user_id = _user_id
      AND me.exploration_id = _exploration_id
  );
$$;

-- =========================
-- RLS : photos
-- =========================
ALTER TABLE public.exploration_convivialite_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "convivialite_photos_select"
ON public.exploration_convivialite_photos
FOR SELECT
TO authenticated
USING (
  public.can_view_exploration_convivialite(auth.uid(), exploration_id)
  AND (
    is_hidden = false
    OR public.check_is_admin_user(auth.uid())
    OR user_id = auth.uid()
  )
);

CREATE POLICY "convivialite_photos_insert"
ON public.exploration_convivialite_photos
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.can_upload_convivialite(auth.uid(), exploration_id)
);

CREATE POLICY "convivialite_photos_update_admin"
ON public.exploration_convivialite_photos
FOR UPDATE
TO authenticated
USING (public.check_is_admin_user(auth.uid()))
WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "convivialite_photos_delete_owner_or_admin"
ON public.exploration_convivialite_photos
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.check_is_admin_user(auth.uid())
);

-- =========================
-- RLS : signalements
-- =========================
ALTER TABLE public.exploration_convivialite_signalements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "convivialite_signalements_select_admin"
ON public.exploration_convivialite_signalements
FOR SELECT
TO authenticated
USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "convivialite_signalements_insert"
ON public.exploration_convivialite_signalements
FOR INSERT
TO authenticated
WITH CHECK (
  reporter_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.exploration_convivialite_photos p
    WHERE p.id = photo_id
      AND public.can_view_exploration_convivialite(auth.uid(), p.exploration_id)
  )
);

CREATE POLICY "convivialite_signalements_update_admin"
ON public.exploration_convivialite_signalements
FOR UPDATE
TO authenticated
USING (public.check_is_admin_user(auth.uid()))
WITH CHECK (public.check_is_admin_user(auth.uid()));

-- =========================
-- Storage bucket
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('exploration-convivialite', 'exploration-convivialite', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "convivialite_storage_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'exploration-convivialite');

-- Insert: file path must start with {exploration_id}/{auth.uid()}/...
-- and the user must be allowed to upload to that exploration
CREATE POLICY "convivialite_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exploration-convivialite'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND public.can_upload_convivialite(
    auth.uid(),
    ((storage.foldername(name))[1])::uuid
  )
);

-- Delete: owner (folder uid match) or admin
CREATE POLICY "convivialite_storage_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exploration-convivialite'
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR public.check_is_admin_user(auth.uid())
  )
);