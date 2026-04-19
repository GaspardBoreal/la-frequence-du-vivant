-- RPC pour le ChatBot Admin : retourne un contexte agrégé selon le scope
-- Sécurisée : accessible uniquement aux admins (vérifié via check_is_admin_user)

CREATE OR REPLACE FUNCTION public.get_admin_chatbot_context(_scope text DEFAULT 'dashboard')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _result jsonb := '{}'::jsonb;
BEGIN
  -- Vérifier que l'appelant est admin
  SELECT public.check_is_admin_user(auth.uid()) INTO _is_admin;
  IF NOT _is_admin THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  IF _scope = 'events' OR _scope = 'dashboard' THEN
    _result := _result || jsonb_build_object(
      'events', jsonb_build_object(
        'total', (SELECT count(*) FROM public.marche_events),
        'upcoming', (SELECT count(*) FROM public.marche_events WHERE date_marche >= now()),
        'past', (SELECT count(*) FROM public.marche_events WHERE date_marche < now()),
        'by_type', (
          SELECT jsonb_object_agg(event_type, n)
          FROM (SELECT event_type, count(*) AS n FROM public.marche_events GROUP BY event_type) t
        ),
        'next_5', (
          SELECT jsonb_agg(jsonb_build_object(
            'id', id, 'title', title, 'date', date_marche,
            'lieu', lieu, 'type', event_type,
            'max_participants', max_participants
          ) ORDER BY date_marche ASC)
          FROM (SELECT * FROM public.marche_events WHERE date_marche >= now() ORDER BY date_marche ASC LIMIT 5) e
        )
      )
    );
  END IF;

  IF _scope = 'community' OR _scope = 'dashboard' THEN
    _result := _result || jsonb_build_object(
      'community', jsonb_build_object(
        'total_profiles', (SELECT count(*) FROM public.community_profiles),
        'by_role', (
          SELECT jsonb_object_agg(role, n)
          FROM (SELECT role::text AS role, count(*) AS n FROM public.community_profiles GROUP BY role) t
        ),
        'top_marcheurs', (
          SELECT jsonb_agg(jsonb_build_object(
            'prenom', prenom, 'nom', nom, 'ville', ville,
            'role', role, 'marches_count', marches_count,
            'telephone', telephone
          ) ORDER BY marches_count DESC)
          FROM (SELECT * FROM public.community_profiles ORDER BY marches_count DESC LIMIT 20) c
        )
      )
    );
  END IF;

  IF _scope = 'marches' OR _scope = 'dashboard' THEN
    _result := _result || jsonb_build_object(
      'marches', jsonb_build_object(
        'total', (SELECT count(*) FROM public.marches),
        'with_coords', (SELECT count(*) FROM public.marches WHERE latitude IS NOT NULL AND longitude IS NOT NULL),
        'without_coords', (SELECT count(*) FROM public.marches WHERE latitude IS NULL OR longitude IS NULL)
      )
    );
  END IF;

  IF _scope = 'exportations' OR _scope = 'dashboard' THEN
    _result := _result || jsonb_build_object(
      'exportations', jsonb_build_object(
        'explorations_total', (SELECT count(*) FROM public.explorations),
        'explorations_published', (SELECT count(*) FROM public.explorations WHERE published = true)
      )
    );
  END IF;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_chatbot_context(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_chatbot_context(text) TO authenticated;