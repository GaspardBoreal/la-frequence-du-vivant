-- Normalisation des order_index existants par groupe (prélèvement × test)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY propriete_id, sample_id, test_id ORDER BY created_at ASC
  ) AS rn
  FROM public.propriete_test_medias
)
UPDATE public.propriete_test_medias m
   SET order_index = r.rn
  FROM ranked r
 WHERE m.id = r.id;

CREATE OR REPLACE FUNCTION public.reorder_propriete_test_medias(
  _propriete_id uuid,
  _sample_id text,
  _test_id text,
  _ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_curate_propriete_parcelles(_propriete_id) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  UPDATE public.propriete_test_medias m
     SET order_index = x.idx
    FROM (SELECT unnest(_ids) AS id, generate_subscripts(_ids, 1) AS idx) x
   WHERE m.id = x.id
     AND m.propriete_id = _propriete_id
     AND m.sample_id = _sample_id
     AND m.test_id = _test_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_propriete_test_medias(uuid, text, text, uuid[]) TO authenticated, service_role;