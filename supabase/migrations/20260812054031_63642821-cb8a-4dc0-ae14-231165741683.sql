-- 1. WEEKS
CREATE TABLE public.roadmap_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  iso_year INTEGER NOT NULL,
  iso_week INTEGER NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  narrative TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT roadmap_weeks_unique UNIQUE (iso_year, iso_week)
);

GRANT SELECT ON public.roadmap_weeks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_weeks TO authenticated;
GRANT ALL ON public.roadmap_weeks TO service_role;
ALTER TABLE public.roadmap_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmap_weeks_public_read" ON public.roadmap_weeks
  FOR SELECT USING (status = 'published' OR public.check_is_admin_user(auth.uid()));
CREATE POLICY "roadmap_weeks_admin_write" ON public.roadmap_weeks
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- helper
CREATE OR REPLACE FUNCTION public.roadmap_week_is_public(_week_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roadmap_weeks w
    WHERE w.id = _week_id AND w.status = 'published'
  );
$$;

-- 2. MEDIA
CREATE TABLE public.roadmap_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  caption TEXT,
  kind TEXT NOT NULL DEFAULT 'capture',
  source_route TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.roadmap_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_media TO authenticated;
GRANT ALL ON public.roadmap_media TO service_role;
ALTER TABLE public.roadmap_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmap_media_public_read" ON public.roadmap_media FOR SELECT USING (true);
CREATE POLICY "roadmap_media_admin_write" ON public.roadmap_media
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 3. ENTRIES
CREATE TABLE public.roadmap_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES public.roadmap_weeks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  promise TEXT,
  body TEXT,
  domain TEXT,
  audiences TEXT[] NOT NULL DEFAULT '{}',
  pitch_marcheur TEXT,
  pitch_proprietaire TEXT,
  pitch_partenaire TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_roadmap_entries_week ON public.roadmap_entries(week_id, position);

GRANT SELECT ON public.roadmap_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_entries TO authenticated;
GRANT ALL ON public.roadmap_entries TO service_role;
ALTER TABLE public.roadmap_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmap_entries_public_read" ON public.roadmap_entries
  FOR SELECT USING (public.roadmap_week_is_public(week_id) OR public.check_is_admin_user(auth.uid()));
CREATE POLICY "roadmap_entries_admin_write" ON public.roadmap_entries
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 4. ENTRY MEDIA
CREATE TABLE public.roadmap_entry_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.roadmap_entries(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.roadmap_media(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT roadmap_entry_media_unique UNIQUE (entry_id, media_id)
);

GRANT SELECT ON public.roadmap_entry_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_entry_media TO authenticated;
GRANT ALL ON public.roadmap_entry_media TO service_role;
ALTER TABLE public.roadmap_entry_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmap_entry_media_public_read" ON public.roadmap_entry_media FOR SELECT USING (true);
CREATE POLICY "roadmap_entry_media_admin_write" ON public.roadmap_entry_media
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 5. SOCIAL POSTS (admin only)
CREATE TABLE public.roadmap_social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES public.roadmap_weeks(id) ON DELETE CASCADE,
  audience TEXT NOT NULL,
  network TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  visual_media_id UUID REFERENCES public.roadmap_media(id) ON DELETE SET NULL,
  scheduled_for DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_roadmap_social_week ON public.roadmap_social_posts(week_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_social_posts TO authenticated;
GRANT ALL ON public.roadmap_social_posts TO service_role;
ALTER TABLE public.roadmap_social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmap_social_admin_all" ON public.roadmap_social_posts
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_roadmap_weeks_updated BEFORE UPDATE ON public.roadmap_weeks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_roadmap_media_updated BEFORE UPDATE ON public.roadmap_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_roadmap_entries_updated BEFORE UPDATE ON public.roadmap_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_roadmap_social_updated BEFORE UPDATE ON public.roadmap_social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- storage policies for bucket roadmap-media
CREATE POLICY "roadmap_media_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'roadmap-media');
CREATE POLICY "roadmap_media_storage_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'roadmap-media' AND public.check_is_admin_user(auth.uid()));
CREATE POLICY "roadmap_media_storage_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'roadmap-media' AND public.check_is_admin_user(auth.uid()));
CREATE POLICY "roadmap_media_storage_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'roadmap-media' AND public.check_is_admin_user(auth.uid()));