INSERT INTO public.iot_partner_users (user_id, fournisseur_id, actif)
SELECT u.id, f.id, true
FROM auth.users u
CROSS JOIN public.iot_fournisseurs f
WHERE lower(u.email) = 'olivier@brad.ag'
  AND lower(f.nom) LIKE 'brad%'
ON CONFLICT DO NOTHING;