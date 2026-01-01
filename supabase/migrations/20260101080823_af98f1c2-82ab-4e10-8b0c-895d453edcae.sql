-- =====================================================
-- PHASE A: Tables pour le système d'engagement Gaspard Boréal
-- =====================================================

-- A1. Table des paramètres d'engagement par exploration
CREATE TABLE public.exploration_engagement_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exploration_id UUID NOT NULL UNIQUE,
  temps_parametrable_seconds INTEGER NOT NULL DEFAULT 180, -- 3 minutes par défaut
  video_youtube_url TEXT,
  popup_planning_enabled BOOLEAN NOT NULL DEFAULT true,
  popup_video_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_engagement_exploration FOREIGN KEY (exploration_id)
    REFERENCES public.explorations(id) ON DELETE CASCADE
);

-- A2. Table cache des événements Google Calendar
CREATE TABLE public.gaspard_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_event_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_bookable BOOLEAN NOT NULL DEFAULT true,
  max_attendees INTEGER,
  current_attendees INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- A3. Table des messages envoyés à Gaspard
CREATE TABLE public.gaspard_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exploration_id UUID,
  event_id UUID,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  relance_j48_sent BOOLEAN NOT NULL DEFAULT false,
  relance_j48_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_message_exploration FOREIGN KEY (exploration_id)
    REFERENCES public.explorations(id) ON DELETE SET NULL,
  CONSTRAINT fk_message_event FOREIGN KEY (event_id)
    REFERENCES public.gaspard_events(id) ON DELETE SET NULL
);

-- A4. Table des réservations de rencontre
CREATE TABLE public.gaspard_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  exploration_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  rappel_j48_sent BOOLEAN NOT NULL DEFAULT false,
  rappel_j48_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_reservation_event FOREIGN KEY (event_id)
    REFERENCES public.gaspard_events(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservation_exploration FOREIGN KEY (exploration_id)
    REFERENCES public.explorations(id) ON DELETE SET NULL
);

-- A5. Table analytics d'engagement
CREATE TABLE public.engagement_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exploration_id UUID NOT NULL,
  session_key TEXT NOT NULL,
  nb_popup_planning_shown INTEGER NOT NULL DEFAULT 0,
  nb_popup_video_shown INTEGER NOT NULL DEFAULT 0,
  nb_messages_sent INTEGER NOT NULL DEFAULT 0,
  nb_reservations INTEGER NOT NULL DEFAULT 0,
  last_message_content TEXT,
  last_reservation_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_analytics_exploration FOREIGN KEY (exploration_id)
    REFERENCES public.explorations(id) ON DELETE CASCADE,
  CONSTRAINT unique_session_exploration UNIQUE (exploration_id, session_key)
);

-- =====================================================
-- Triggers pour updated_at
-- =====================================================

CREATE TRIGGER update_exploration_engagement_settings_updated_at
  BEFORE UPDATE ON public.exploration_engagement_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gaspard_events_updated_at
  BEFORE UPDATE ON public.gaspard_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gaspard_reservations_updated_at
  BEFORE UPDATE ON public.gaspard_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_engagement_analytics_updated_at
  BEFORE UPDATE ON public.engagement_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS Policies
-- =====================================================

-- exploration_engagement_settings
ALTER TABLE public.exploration_engagement_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view engagement settings"
  ON public.exploration_engagement_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage engagement settings"
  ON public.exploration_engagement_settings FOR ALL
  USING (true);

-- gaspard_events
ALTER TABLE public.gaspard_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view gaspard events"
  ON public.gaspard_events FOR SELECT
  USING (true);

CREATE POLICY "Allow insert gaspard events"
  ON public.gaspard_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update gaspard events"
  ON public.gaspard_events FOR UPDATE
  USING (true);

-- gaspard_messages
ALTER TABLE public.gaspard_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert gaspard messages"
  ON public.gaspard_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view gaspard messages"
  ON public.gaspard_messages FOR SELECT
  USING (check_is_admin_user(auth.uid()));

-- gaspard_reservations
ALTER TABLE public.gaspard_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert gaspard reservations"
  ON public.gaspard_reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view own reservations by email"
  ON public.gaspard_reservations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gaspard reservations"
  ON public.gaspard_reservations FOR ALL
  USING (check_is_admin_user(auth.uid()));

-- engagement_analytics
ALTER TABLE public.engagement_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert engagement analytics"
  ON public.engagement_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update own engagement analytics"
  ON public.engagement_analytics FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view engagement analytics"
  ON public.engagement_analytics FOR SELECT
  USING (check_is_admin_user(auth.uid()));

-- =====================================================
-- Indexes pour performance
-- =====================================================

CREATE INDEX idx_gaspard_events_dates ON public.gaspard_events(start_date, end_date);
CREATE INDEX idx_gaspard_messages_created ON public.gaspard_messages(created_at);
CREATE INDEX idx_gaspard_reservations_event ON public.gaspard_reservations(event_id);
CREATE INDEX idx_gaspard_reservations_status ON public.gaspard_reservations(status);
CREATE INDEX idx_engagement_analytics_session ON public.engagement_analytics(session_key);