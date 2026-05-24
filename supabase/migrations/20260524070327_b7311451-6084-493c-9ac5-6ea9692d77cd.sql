UPDATE public.marcheur_medias
SET is_public = true, shared_to_web = true, updated_at = now()
WHERE user_id = '4bd02b8a-ef51-48ca-9e9c-f4661e5af6be'
  AND (is_public = false OR shared_to_web = false);

UPDATE public.marcheur_audio
SET is_public = true, updated_at = now()
WHERE user_id = '4bd02b8a-ef51-48ca-9e9c-f4661e5af6be'
  AND is_public = false;