
ALTER TABLE public.iot_mesures
  ADD COLUMN IF NOT EXISTS interpretation text,
  ADD COLUMN IF NOT EXISTS rejected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reject_reason text;

CREATE INDEX IF NOT EXISTS iot_mesures_not_rejected_idx
  ON public.iot_mesures (capteur_id, mesure_at DESC) WHERE rejected = false;

-- Type « station météo » Brad
INSERT INTO public.iot_types_capteurs (fournisseur_id, modele, famille, description, profondeurs_m, grandeurs)
SELECT '7b9f1b42-ebb5-4a6b-ba77-07bccfc724af', 'Station météo', 'meteo',
       'Station météo Brad Technology : air, ciel, pluie, pression, vent.',
       ARRAY[]::numeric[],
       ARRAY['air_temperature','air_humidity','dew_point','pressure','luminosity','uv_index','rainfall','wind_speed']
WHERE NOT EXISTS (
  SELECT 1 FROM public.iot_types_capteurs
  WHERE fournisseur_id = '7b9f1b42-ebb5-4a6b-ba77-07bccfc724af' AND modele = 'Station météo'
);

-- Capteur station météo b26w002
INSERT INTO public.iot_capteurs (propriete_id, type_id, serial_number, nom, emplacement, lat, lng, actif, silence_alert_hours, battery_alert_pct)
SELECT '664670f9-f16d-44f0-bdef-032cb0691194',
       (SELECT id FROM public.iot_types_capteurs WHERE fournisseur_id = '7b9f1b42-ebb5-4a6b-ba77-07bccfc724af' AND modele = 'Station météo' LIMIT 1),
       'b26w002', 'Station météo', 'Potager d''Hiver',
       45.4137539959447, 0.00905392877918066, true, 6, 25
WHERE NOT EXISTS (SELECT 1 FROM public.iot_capteurs WHERE serial_number = 'b26w002');

-- Nettoyage : humidités de sol physiquement impossibles
UPDATE public.iot_mesures
SET rejected = true, reject_reason = 'valeur aberrante (humidité > 100 %)'
WHERE grandeur = 'soil_moisture' AND valeur > 100 AND rejected = false;

UPDATE public.iot_mesures
SET rejected = true, reject_reason = 'valeur aberrante (hors bornes physiques)'
WHERE rejected = false AND (
  (grandeur = 'air_humidity' AND (valeur < 0 OR valeur > 100))
  OR (grandeur IN ('air_temperature','soil_temperature','dew_point') AND (valeur < -40 OR valeur > 80))
  OR (grandeur = 'uv_index' AND (valeur < 0 OR valeur > 20))
);
