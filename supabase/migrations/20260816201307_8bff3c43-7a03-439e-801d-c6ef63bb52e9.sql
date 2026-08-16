UPDATE public.iot_mesures
SET profondeur_m = 0.05
WHERE profondeur_m = 0
  AND grandeur LIKE 'soil_%';