CREATE TABLE IF NOT EXISTS public.propriete_carnet_envois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.propriete_tours(id) ON DELETE CASCADE,
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  sent_by uuid,
  sent_by_name text,
  subject text NOT NULL,
  body text,
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  recipient_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_propriete_carnet_envois_tour ON public.propriete_carnet_envois(tour_id, created_at DESC);

GRANT SELECT ON public.propriete_carnet_envois TO authenticated;
GRANT ALL ON public.propriete_carnet_envois TO service_role;

ALTER TABLE public.propriete_carnet_envois ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carnet envois lisibles par les personnes du jardin" ON public.propriete_carnet_envois;
CREATE POLICY "carnet envois lisibles par les personnes du jardin"
  ON public.propriete_carnet_envois FOR SELECT TO authenticated
  USING (public.can_access_propriete(propriete_id));

CREATE OR REPLACE FUNCTION public.get_propriete_carnet_recipients(p_propriete_id uuid)
RETURNS TABLE (
  community_profile_id uuid,
  nom text,
  prenom text,
  role text,
  has_email boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_access_propriete(p_propriete_id) THEN
    RAISE EXCEPTION 'Acces refuse a cette propriete';
  END IF;

  RETURN QUERY
  WITH lies AS (
    SELECT pm.community_profile_id AS cp_id, pm.role::text AS role, 1 AS prio
    FROM public.propriete_marcheurs pm
    WHERE pm.propriete_id = p_propriete_id
    UNION ALL
    SELECT cp.id AS cp_id, 'participant'::text AS role, 2 AS prio
    FROM public.propriete_marche_events pme
    JOIN public.marche_participations mp ON mp.marche_event_id = pme.marche_event_id
    JOIN public.community_profiles cp ON cp.user_id = mp.user_id
    WHERE pme.propriete_id = p_propriete_id
  ), dedup AS (
    SELECT DISTINCT ON (cp_id) cp_id, role
    FROM lies
    WHERE cp_id IS NOT NULL
    ORDER BY cp_id, prio
  )
  SELECT
    cp.id,
    cp.nom,
    cp.prenom,
    d.role,
    (u.email IS NOT NULL) AS has_email
  FROM dedup d
  JOIN public.community_profiles cp ON cp.id = d.cp_id
  LEFT JOIN auth.users u ON u.id = cp.user_id
  ORDER BY cp.nom NULLS LAST, cp.prenom NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_propriete_carnet_recipients(uuid) TO authenticated;