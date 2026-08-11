
-- 1. FOURNISSEURS
CREATE TABLE public.iot_fournisseurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  website text,
  pays text,
  logo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.iot_fournisseurs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.iot_fournisseurs TO authenticated;
GRANT ALL ON public.iot_fournisseurs TO service_role;
ALTER TABLE public.iot_fournisseurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iot_fournisseurs_read" ON public.iot_fournisseurs FOR SELECT TO authenticated USING (true);
CREATE POLICY "iot_fournisseurs_admin_write" ON public.iot_fournisseurs FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid())) WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 2. TYPES DE CAPTEURS
CREATE TABLE public.iot_types_capteurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fournisseur_id uuid NOT NULL REFERENCES public.iot_fournisseurs(id) ON DELETE CASCADE,
  modele text NOT NULL,
  famille text NOT NULL DEFAULT 'sol',
  description text,
  /* profondeurs de mesure en mètres, ex [0.05, 0.15] */
  profondeurs_m numeric[] NOT NULL DEFAULT '{}',
  /* grandeurs normalisées attendues, ex {soil_moisture,air_temperature} */
  grandeurs text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iot_types_capteurs TO authenticated;
GRANT ALL ON public.iot_types_capteurs TO service_role;
ALTER TABLE public.iot_types_capteurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iot_types_read" ON public.iot_types_capteurs FOR SELECT TO authenticated USING (true);
CREATE POLICY "iot_types_admin_write" ON public.iot_types_capteurs FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid())) WITH CHECK (public.check_is_admin_user(auth.uid()));

-- 3. CAPTEURS
CREATE TABLE public.iot_capteurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  type_id uuid NOT NULL REFERENCES public.iot_types_capteurs(id) ON DELETE RESTRICT,
  serial_number text NOT NULL UNIQUE,
  nom text NOT NULL,
  emplacement text,
  lat double precision,
  lng double precision,
  actif boolean NOT NULL DEFAULT true,
  open_data boolean NOT NULL DEFAULT false,
  battery_pct numeric,
  rssi numeric,
  snr numeric,
  last_seen_at timestamptz,
  /* seuils d'alerte */
  silence_alert_hours integer NOT NULL DEFAULT 6,
  battery_alert_pct integer NOT NULL DEFAULT 25,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX iot_capteurs_propriete_idx ON public.iot_capteurs(propriete_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iot_capteurs TO authenticated;
GRANT ALL ON public.iot_capteurs TO service_role;
ALTER TABLE public.iot_capteurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iot_capteurs_read" ON public.iot_capteurs FOR SELECT TO authenticated
  USING (public.can_access_propriete(propriete_id));
CREATE POLICY "iot_capteurs_write" ON public.iot_capteurs FOR ALL TO authenticated
  USING (public.can_access_propriete(propriete_id)) WITH CHECK (public.can_access_propriete(propriete_id));

-- 4. MESURES (unités SI)
CREATE TABLE public.iot_mesures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capteur_id uuid NOT NULL REFERENCES public.iot_capteurs(id) ON DELETE CASCADE,
  grandeur text NOT NULL,
  valeur double precision NOT NULL,
  unite text NOT NULL,
  profondeur_m numeric,
  mesure_at timestamptz NOT NULL,
  source text NOT NULL DEFAULT 'webhook',
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX iot_mesures_unique_idx
  ON public.iot_mesures (capteur_id, grandeur, COALESCE(profondeur_m, -1), mesure_at);
CREATE INDEX iot_mesures_capteur_time_idx ON public.iot_mesures (capteur_id, mesure_at DESC);
CREATE INDEX iot_mesures_grandeur_idx ON public.iot_mesures (grandeur, profondeur_m);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iot_mesures TO authenticated;
GRANT ALL ON public.iot_mesures TO service_role;
ALTER TABLE public.iot_mesures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iot_mesures_read" ON public.iot_mesures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.iot_capteurs c WHERE c.id = capteur_id AND public.can_access_propriete(c.propriete_id)));
CREATE POLICY "iot_mesures_write" ON public.iot_mesures FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.iot_capteurs c WHERE c.id = capteur_id AND public.can_access_propriete(c.propriete_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.iot_capteurs c WHERE c.id = capteur_id AND public.can_access_propriete(c.propriete_id)));

-- 5. JOURNAL WEBHOOK
CREATE TABLE public.iot_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fournisseur text NOT NULL DEFAULT 'brad',
  delivery_id text,
  event text,
  serial_number text,
  capteur_id uuid REFERENCES public.iot_capteurs(id) ON DELETE SET NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  mesures_count integer NOT NULL DEFAULT 0,
  error text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX iot_webhook_delivery_uid ON public.iot_webhook_deliveries(fournisseur, delivery_id) WHERE delivery_id IS NOT NULL;
GRANT SELECT ON public.iot_webhook_deliveries TO authenticated;
GRANT ALL ON public.iot_webhook_deliveries TO service_role;
ALTER TABLE public.iot_webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iot_deliveries_admin_read" ON public.iot_webhook_deliveries FOR SELECT TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

-- updated_at triggers
CREATE TRIGGER iot_fournisseurs_updated BEFORE UPDATE ON public.iot_fournisseurs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER iot_types_updated BEFORE UPDATE ON public.iot_types_capteurs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER iot_capteurs_updated BEFORE UPDATE ON public.iot_capteurs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
