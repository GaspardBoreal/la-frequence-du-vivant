
-- =============================================
-- TABLES DE FONDATION : Marches du Vivant
-- =============================================

-- 1. QUIZ : Questions et réponses
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  niveau TEXT NOT NULL DEFAULT 'marcheur', -- marcheur, eclaireur, ambassadeur, sentinelle
  volet TEXT NOT NULL DEFAULT 'biodiversite', -- biodiversite, bioacoustique, geopoetique
  question TEXT NOT NULL,
  type_question TEXT NOT NULL DEFAULT 'choix_multiple', -- choix_multiple, son, image, association
  options JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{label, image_url?, sound_url?, is_correct}]
  explication TEXT, -- feedback après réponse
  image_url TEXT, -- image illustrant la question
  sound_url TEXT, -- son à écouter (bioacoustique)
  frequences_bonus INTEGER NOT NULL DEFAULT 1,
  ordre INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  frequences_earned INTEGER NOT NULL DEFAULT 0,
  session_key TEXT, -- pour grouper les réponses d'une session de quiz
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. ENREGISTREMENTS SONORES
CREATE TABLE public.sound_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marche_event_id UUID REFERENCES public.marche_events(id) ON DELETE SET NULL,
  titre TEXT,
  description TEXT,
  url_supabase TEXT NOT NULL,
  duree_secondes INTEGER,
  espece_identifiee TEXT,
  spectrogramme_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. KIGO : Mots de saison et haïkus
CREATE TABLE public.kigo_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marche_event_id UUID REFERENCES public.marche_events(id) ON DELETE SET NULL,
  kigo TEXT NOT NULL, -- le mot de saison choisi
  saison TEXT NOT NULL DEFAULT 'printemps', -- printemps, ete, automne, hiver
  haiku TEXT, -- haïku généré ou écrit
  haiku_ia_suggestion TEXT, -- suggestion de l'IA
  especes_associees JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. TERRITOIRES : Regroupement d'explorations
CREATE TABLE public.territories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  responsable_user_id UUID, -- sentinelle responsable
  geometrie JSONB, -- GeoJSON des limites du territoire
  indicateurs JSONB DEFAULT '{}'::jsonb, -- métriques agrégées
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.territory_explorations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  exploration_id UUID NOT NULL REFERENCES public.explorations(id) ON DELETE CASCADE,
  ordre INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(territory_id, exploration_id)
);

-- 5. FRÉQUENCES : Système de points/récompenses
CREATE TABLE public.frequences_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- quiz_reponse, marche_validee, kigo_cree, son_enregistre, zone_blanche, defi_silence, etc.
  frequences INTEGER NOT NULL DEFAULT 1,
  multiplicateur NUMERIC NOT NULL DEFAULT 1.0,
  reference_id UUID, -- ID de l'objet source (quiz_response, kigo_entry, etc.)
  reference_type TEXT, -- type d'objet source
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kigo_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_explorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequences_log ENABLE ROW LEVEL SECURITY;

-- Quiz questions: public read, admin write
CREATE POLICY "Public can view active quiz questions" ON public.quiz_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions FOR ALL TO authenticated USING (check_is_admin_user(auth.uid())) WITH CHECK (check_is_admin_user(auth.uid()));

-- Quiz responses: users own, admins all
CREATE POLICY "Users can insert own quiz responses" ON public.quiz_responses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own quiz responses" ON public.quiz_responses FOR SELECT TO authenticated USING (user_id = auth.uid() OR check_is_admin_user(auth.uid()));

-- Sound recordings: users own, public if is_public
CREATE POLICY "Users can insert own recordings" ON public.sound_recordings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own or public recordings" ON public.sound_recordings FOR SELECT USING (is_public = true OR (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR check_is_admin_user(auth.uid()));
CREATE POLICY "Users can update own recordings" ON public.sound_recordings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Kigo entries: users own, public if is_public
CREATE POLICY "Users can insert own kigos" ON public.kigo_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own or public kigos" ON public.kigo_entries FOR SELECT USING (is_public = true OR (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR check_is_admin_user(auth.uid()));
CREATE POLICY "Users can update own kigos" ON public.kigo_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Territories: public read, sentinelles/admins write
CREATE POLICY "Public can view territories" ON public.territories FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can manage territories" ON public.territories FOR ALL TO authenticated USING (check_is_admin_user(auth.uid()) OR responsable_user_id = auth.uid()) WITH CHECK (check_is_admin_user(auth.uid()) OR responsable_user_id = auth.uid());

-- Territory explorations: public read, admin write
CREATE POLICY "Public can view territory explorations" ON public.territory_explorations FOR SELECT USING (true);
CREATE POLICY "Admins can manage territory explorations" ON public.territory_explorations FOR ALL TO authenticated USING (check_is_admin_user(auth.uid())) WITH CHECK (check_is_admin_user(auth.uid()));

-- Frequences log: users own, admins all
CREATE POLICY "Users can view own frequences" ON public.frequences_log FOR SELECT TO authenticated USING (user_id = auth.uid() OR check_is_admin_user(auth.uid()));
CREATE POLICY "System can insert frequences" ON public.frequences_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
