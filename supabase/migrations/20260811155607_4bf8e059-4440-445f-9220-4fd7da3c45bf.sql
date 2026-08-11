ALTER TABLE public.iot_mesures REPLICA IDENTITY FULL;
ALTER TABLE public.iot_webhook_deliveries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_mesures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_webhook_deliveries;