-- 1. Consultations
CREATE TABLE public.propriete_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  created_by uuid,
  subject_label text NOT NULL,
  subject_scientific_name text,
  subject_source text NOT NULL DEFAULT 'manuel',
  organ text,
  aspect text,
  onset text,
  lat double precision,
  lng double precision,
  severity smallint NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'observation',
  retained_hypothesis_id uuid,
  notes text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_consultations_propriete ON public.propriete_consultations(propriete_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_consultations TO authenticated;
GRANT ALL ON public.propriete_consultations TO service_role;
ALTER TABLE public.propriete_consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultations accessibles aux ayants droit"
  ON public.propriete_consultations FOR ALL TO authenticated
  USING (public.can_access_propriete(propriete_id))
  WITH CHECK (public.can_access_propriete(propriete_id));

-- 2. Hypothèses
CREATE TABLE public.propriete_consultation_hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.propriete_consultations(id) ON DELETE CASCADE,
  rank smallint NOT NULL DEFAULT 1,
  common_name text NOT NULL,
  scientific_name text,
  kind text,
  confidence numeric NOT NULL DEFAULT 0.5,
  what_you_see text,
  confusions text,
  gravity text,
  terrain_reading text,
  terrain_verdict text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hypotheses_consultation ON public.propriete_consultation_hypotheses(consultation_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_consultation_hypotheses TO authenticated;
GRANT ALL ON public.propriete_consultation_hypotheses TO service_role;
ALTER TABLE public.propriete_consultation_hypotheses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hypotheses accessibles aux ayants droit"
  ON public.propriete_consultation_hypotheses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.propriete_consultations c WHERE c.id = consultation_id AND public.can_access_propriete(c.propriete_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.propriete_consultations c WHERE c.id = consultation_id AND public.can_access_propriete(c.propriete_id)));

-- 3. Gestes de soin
CREATE TABLE public.propriete_consultation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.propriete_consultations(id) ON DELETE CASCADE,
  volet text NOT NULL DEFAULT 'curatif',
  intensity smallint NOT NULL DEFAULT 1,
  label text NOT NULL,
  detail text,
  window_start date,
  window_end date,
  frequency text,
  weather_caution text,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_actions_consultation ON public.propriete_consultation_actions(consultation_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_consultation_actions TO authenticated;
GRANT ALL ON public.propriete_consultation_actions TO service_role;
ALTER TABLE public.propriete_consultation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestes accessibles aux ayants droit"
  ON public.propriete_consultation_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.propriete_consultations c WHERE c.id = consultation_id AND public.can_access_propriete(c.propriete_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.propriete_consultations c WHERE c.id = consultation_id AND public.can_access_propriete(c.propriete_id)));

-- 4. Médias horodatés
CREATE TABLE public.propriete_consultation_medias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.propriete_consultations(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'photo',
  url text NOT NULL,
  storage_path text,
  caption text,
  severity_at_capture smallint,
  taken_at timestamptz,
  lat double precision,
  lng double precision,
  metadata jsonb,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_consultation_medias_consultation ON public.propriete_consultation_medias(consultation_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_consultation_medias TO authenticated;
GRANT ALL ON public.propriete_consultation_medias TO service_role;
ALTER TABLE public.propriete_consultation_medias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Medias de consultation accessibles aux ayants droit"
  ON public.propriete_consultation_medias FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.propriete_consultations c WHERE c.id = consultation_id AND public.can_access_propriete(c.propriete_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.propriete_consultations c WHERE c.id = consultation_id AND public.can_access_propriete(c.propriete_id)));

-- 5. Relevés de sonde
CREATE TABLE public.propriete_sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  sensor_label text,
  metric text NOT NULL,
  value numeric NOT NULL,
  unit text,
  measured_at timestamptz NOT NULL DEFAULT now(),
  lat double precision,
  lng double precision,
  source text NOT NULL DEFAULT 'manuelle',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sensor_readings_propriete ON public.propriete_sensor_readings(propriete_id, measured_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_sensor_readings TO authenticated;
GRANT ALL ON public.propriete_sensor_readings TO service_role;
ALTER TABLE public.propriete_sensor_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Releves de sonde accessibles aux ayants droit"
  ON public.propriete_sensor_readings FOR ALL TO authenticated
  USING (public.can_access_propriete(propriete_id))
  WITH CHECK (public.can_access_propriete(propriete_id));

-- 6. Base de connaissance des pathogènes
CREATE TABLE public.garden_pathogens_kb (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name text NOT NULL,
  scientific_name text,
  kind text NOT NULL DEFAULT 'champignon',
  hosts text[] NOT NULL DEFAULT '{}',
  organs text[] NOT NULL DEFAULT '{}',
  signs text,
  confusions text,
  gravity text,
  favouring_conditions text,
  eco_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  prevention jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_months smallint[] NOT NULL DEFAULT '{}',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_pathogens_common_name ON public.garden_pathogens_kb(lower(common_name));
GRANT SELECT ON public.garden_pathogens_kb TO anon;
GRANT SELECT ON public.garden_pathogens_kb TO authenticated;
GRANT ALL ON public.garden_pathogens_kb TO service_role;
ALTER TABLE public.garden_pathogens_kb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "KB maladies lisible par tous"
  ON public.garden_pathogens_kb FOR SELECT USING (true);
CREATE POLICY "KB maladies modifiable par les admins"
  ON public.garden_pathogens_kb FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

-- Horodatage
CREATE OR REPLACE FUNCTION public.touch_clinique_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_consultations_touch BEFORE UPDATE ON public.propriete_consultations
  FOR EACH ROW EXECUTE FUNCTION public.touch_clinique_updated_at();
CREATE TRIGGER trg_pathogens_touch BEFORE UPDATE ON public.garden_pathogens_kb
  FOR EACH ROW EXECUTE FUNCTION public.touch_clinique_updated_at();