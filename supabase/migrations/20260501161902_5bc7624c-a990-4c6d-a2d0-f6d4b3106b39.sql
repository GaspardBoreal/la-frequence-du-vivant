-- 1. Ajout de la colonne position
ALTER TABLE public.exploration_convivialite_photos
ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill : assigner les positions selon l'ordre chronologique
WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (PARTITION BY exploration_id ORDER BY created_at ASC) - 1) AS rn
  FROM public.exploration_convivialite_photos
)
UPDATE public.exploration_convivialite_photos p
SET position = r.rn
FROM ranked r
WHERE p.id = r.id;

-- 3. Index pour le tri
CREATE INDEX IF NOT EXISTS idx_convivialite_photos_exploration_position
ON public.exploration_convivialite_photos (exploration_id, position);

-- 4. Fonction RPC sécurisée pour réordonner les photos
CREATE OR REPLACE FUNCTION public.reorder_convivialite_photos(
  _exploration_id uuid,
  _ordered_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  i INTEGER;
  current_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _exploration_id IS NULL OR _ordered_ids IS NULL THEN
    RAISE EXCEPTION 'Missing arguments';
  END IF;

  -- Vérifier les droits : admin OU habilité à uploader sur cette exploration
  IF NOT (
    public.check_is_admin_user(auth.uid())
    OR public.can_upload_convivialite(auth.uid(), _exploration_id)
  ) THEN
    RAISE EXCEPTION 'Forbidden: not allowed to reorder photos for this exploration';
  END IF;

  -- Mise à jour des positions
  FOR i IN 1..array_length(_ordered_ids, 1) LOOP
    current_id := _ordered_ids[i];
    UPDATE public.exploration_convivialite_photos
    SET position = i - 1,
        updated_at = now()
    WHERE id = current_id
      AND exploration_id = _exploration_id;
  END LOOP;
END;
$$;

-- 5. Permettre aux utilisateurs authentifiés d'appeler la fonction
GRANT EXECUTE ON FUNCTION public.reorder_convivialite_photos(uuid, uuid[]) TO authenticated;