-- Fix policy creation checks using pg_policies.policyname
-- Ensure tables exist (idempotent)
CREATE TABLE IF NOT EXISTS public.exploration_narrative_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id UUID NOT NULL,
  welcome_tones TEXT[] NOT NULL DEFAULT '{}',
  welcome_forms TEXT[] NOT NULL DEFAULT '{}',
  welcome_povs TEXT[] NOT NULL DEFAULT '{}',
  welcome_senses TEXT[] NOT NULL DEFAULT '{}',
  welcome_timeframes TEXT[] NOT NULL DEFAULT '{}',
  welcome_template TEXT,
  marche_view_model TEXT NOT NULL DEFAULT 'elabore',
  marche_view_config JSONB,
  interaction_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_exploration_settings UNIQUE (exploration_id),
  CONSTRAINT fk_settings_exploration
    FOREIGN KEY (exploration_id)
    REFERENCES public.explorations (id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.narrative_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id UUID NOT NULL,
  session_key TEXT UNIQUE,
  language TEXT NOT NULL DEFAULT 'fr',
  user_agent TEXT,
  referrer TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_sessions_exploration
    FOREIGN KEY (exploration_id)
    REFERENCES public.explorations (id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_exploration ON public.narrative_sessions (exploration_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.narrative_sessions (status);

CREATE TABLE IF NOT EXISTS public.narrative_fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  exploration_id UUID NOT NULL,
  marche_id UUID,
  kind TEXT NOT NULL,
  ordre INTEGER,
  content TEXT NOT NULL,
  tts_voice TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_fragments_session
    FOREIGN KEY (session_id)
    REFERENCES public.narrative_sessions (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_fragments_exploration
    FOREIGN KEY (exploration_id)
    REFERENCES public.explorations (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_fragments_marche
    FOREIGN KEY (marche_id)
    REFERENCES public.marches (id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fragments_session ON public.narrative_fragments (session_id);
CREATE INDEX IF NOT EXISTS idx_fragments_exploration ON public.narrative_fragments (exploration_id);
CREATE INDEX IF NOT EXISTS idx_fragments_marche ON public.narrative_fragments (marche_id);

CREATE TABLE IF NOT EXISTS public.narrative_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  exploration_id UUID NOT NULL,
  marche_id UUID,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_interactions_session
    FOREIGN KEY (session_id)
    REFERENCES public.narrative_sessions (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_interactions_exploration
    FOREIGN KEY (exploration_id)
    REFERENCES public.explorations (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_interactions_marche
    FOREIGN KEY (marche_id)
    REFERENCES public.marches (id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_interactions_session ON public.narrative_interactions (session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_exploration ON public.narrative_interactions (exploration_id);
CREATE INDEX IF NOT EXISTS idx_interactions_marche ON public.narrative_interactions (marche_id);

ALTER TABLE public.exploration_narrative_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for exploration_narrative_settings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view exploration_narrative_settings' AND tablename = 'exploration_narrative_settings'
  ) THEN
    CREATE POLICY "Public can view exploration_narrative_settings" ON public.exploration_narrative_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can insert exploration_narrative_settings' AND tablename = 'exploration_narrative_settings'
  ) THEN
    CREATE POLICY "Public can insert exploration_narrative_settings" ON public.exploration_narrative_settings FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can update exploration_narrative_settings' AND tablename = 'exploration_narrative_settings'
  ) THEN
    CREATE POLICY "Public can update exploration_narrative_settings" ON public.exploration_narrative_settings FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can delete exploration_narrative_settings' AND tablename = 'exploration_narrative_settings'
  ) THEN
    CREATE POLICY "Public can delete exploration_narrative_settings" ON public.exploration_narrative_settings FOR DELETE USING (true);
  END IF;
END $$;

-- Policies for narrative_sessions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view narrative_sessions' AND tablename = 'narrative_sessions'
  ) THEN
    CREATE POLICY "Public can view narrative_sessions" ON public.narrative_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can insert narrative_sessions' AND tablename = 'narrative_sessions'
  ) THEN
    CREATE POLICY "Public can insert narrative_sessions" ON public.narrative_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can update narrative_sessions' AND tablename = 'narrative_sessions'
  ) THEN
    CREATE POLICY "Public can update narrative_sessions" ON public.narrative_sessions FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can delete narrative_sessions' AND tablename = 'narrative_sessions'
  ) THEN
    CREATE POLICY "Public can delete narrative_sessions" ON public.narrative_sessions FOR DELETE USING (true);
  END IF;
END $$;

-- Policies for narrative_fragments (read/insert)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view narrative_fragments' AND tablename = 'narrative_fragments'
  ) THEN
    CREATE POLICY "Public can view narrative_fragments" ON public.narrative_fragments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can insert narrative_fragments' AND tablename = 'narrative_fragments'
  ) THEN
    CREATE POLICY "Public can insert narrative_fragments" ON public.narrative_fragments FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Policies for narrative_interactions (read/insert)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view narrative_interactions' AND tablename = 'narrative_interactions'
  ) THEN
    CREATE POLICY "Public can view narrative_interactions" ON public.narrative_interactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can insert narrative_interactions' AND tablename = 'narrative_interactions'
  ) THEN
    CREATE POLICY "Public can insert narrative_interactions" ON public.narrative_interactions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- updated_at triggers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_exploration_narrative_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_exploration_narrative_settings_updated_at
    BEFORE UPDATE ON public.exploration_narrative_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_narrative_sessions_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_narrative_sessions_updated_at
    BEFORE UPDATE ON public.narrative_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;