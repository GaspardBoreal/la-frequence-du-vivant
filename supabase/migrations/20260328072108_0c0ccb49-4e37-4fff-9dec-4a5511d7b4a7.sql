
-- Table des contributions visuelles (photos + vidéos) des marcheurs
CREATE TABLE public.marcheur_medias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marche_event_id UUID NOT NULL REFERENCES marche_events(id) ON DELETE CASCADE,
  type_media TEXT NOT NULL CHECK (type_media IN ('photo', 'video')),
  url_fichier TEXT,
  external_url TEXT,
  titre TEXT,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  ordre INTEGER,
  taille_octets BIGINT,
  duree_secondes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des contributions audio des marcheurs
CREATE TABLE public.marcheur_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marche_event_id UUID NOT NULL REFERENCES marche_events(id) ON DELETE CASCADE,
  url_fichier TEXT NOT NULL,
  titre TEXT,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  ordre INTEGER,
  taille_octets BIGINT,
  duree_secondes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des textes des marcheurs
CREATE TABLE public.marcheur_textes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marche_event_id UUID NOT NULL REFERENCES marche_events(id) ON DELETE CASCADE,
  type_texte TEXT NOT NULL DEFAULT 'texte-libre',
  titre TEXT,
  contenu TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT false,
  ordre INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marcheur_medias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcheur_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcheur_textes ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own + public contributions from same event
CREATE POLICY "Users see own medias" ON public.marcheur_medias
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users insert own medias" ON public.marcheur_medias
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own medias" ON public.marcheur_medias
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own medias" ON public.marcheur_medias
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users see own audio" ON public.marcheur_audio
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users insert own audio" ON public.marcheur_audio
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own audio" ON public.marcheur_audio
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own audio" ON public.marcheur_audio
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users see own textes" ON public.marcheur_textes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users insert own textes" ON public.marcheur_textes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own textes" ON public.marcheur_textes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own textes" ON public.marcheur_textes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admin access
CREATE POLICY "Admins full access medias" ON public.marcheur_medias
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins full access audio" ON public.marcheur_audio
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

CREATE POLICY "Admins full access textes" ON public.marcheur_textes
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('marcheur-uploads', 'marcheur-uploads', true);

-- Storage RLS
CREATE POLICY "Authenticated users upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marcheur-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read marcheur uploads" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'marcheur-uploads');

CREATE POLICY "Users delete own uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'marcheur-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Indexes
CREATE INDEX idx_marcheur_medias_user_event ON public.marcheur_medias(user_id, marche_event_id);
CREATE INDEX idx_marcheur_audio_user_event ON public.marcheur_audio(user_id, marche_event_id);
CREATE INDEX idx_marcheur_textes_user_event ON public.marcheur_textes(user_id, marche_event_id);
