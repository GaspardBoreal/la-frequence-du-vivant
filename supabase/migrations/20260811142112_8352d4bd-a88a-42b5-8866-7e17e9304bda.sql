
DROP INDEX IF EXISTS public.iot_mesures_unique_idx;
ALTER TABLE public.iot_mesures
  ADD CONSTRAINT iot_mesures_unique UNIQUE NULLS NOT DISTINCT (capteur_id, grandeur, profondeur_m, mesure_at);

DROP INDEX IF EXISTS public.iot_webhook_delivery_uid;
ALTER TABLE public.iot_webhook_deliveries
  ALTER COLUMN delivery_id SET DEFAULT gen_random_uuid()::text;
UPDATE public.iot_webhook_deliveries SET delivery_id = gen_random_uuid()::text WHERE delivery_id IS NULL;
ALTER TABLE public.iot_webhook_deliveries
  ALTER COLUMN delivery_id SET NOT NULL,
  ADD CONSTRAINT iot_webhook_delivery_uid UNIQUE (fournisseur, delivery_id);
