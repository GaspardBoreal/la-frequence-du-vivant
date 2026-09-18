-- 1. Conversations avec l'Assistant
CREATE TABLE public.assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  surface text NOT NULL,
  propriete_id uuid REFERENCES public.proprietes(id) ON DELETE SET NULL,
  exploration_id uuid REFERENCES public.explorations(id) ON DELETE SET NULL,
  marche_event_id uuid REFERENCES public.marche_events(id) ON DELETE SET NULL,
  title text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.assistant_conversations TO authenticated;
GRANT ALL ON public.assistant_conversations TO service_role;

ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_conversations_owner_read"
  ON public.assistant_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.check_is_admin_user(auth.uid()));

CREATE POLICY "assistant_conversations_service_all"
  ON public.assistant_conversations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 2. Messages
CREATE TABLE public.assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.assistant_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  contexts jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  latency_ms integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.assistant_messages TO authenticated;
GRANT ALL ON public.assistant_messages TO service_role;

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_messages_owner_read"
  ON public.assistant_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.check_is_admin_user(auth.uid()));

CREATE POLICY "assistant_messages_service_all"
  ON public.assistant_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_assistant_conv_user_time ON public.assistant_conversations (user_id, last_message_at DESC);
CREATE INDEX idx_assistant_msg_conv_time ON public.assistant_messages (conversation_id, created_at);
CREATE INDEX idx_assistant_msg_user_time ON public.assistant_messages (user_id, created_at DESC);

CREATE TRIGGER trg_assistant_conversations_updated_at
  BEFORE UPDATE ON public.assistant_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Index de lecture du journal d'activité
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time
  ON public.marcheur_activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type_time
  ON public.marcheur_activity_logs (event_type, created_at DESC);

-- 4. Parcours complet d'un marcheur
CREATE OR REPLACE FUNCTION public.get_marcheur_parcours(
  _user_id uuid,
  _from timestamptz,
  _to timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_events jsonb;
  v_profile jsonb;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  SELECT to_jsonb(p) INTO v_profile
  FROM (
    SELECT cp.id, cp.user_id, cp.prenom, cp.nom, cp.ville, cp.slug, cp.role::text AS role,
           cp.avatar_url, cp.persona, cp.created_at, cp.is_adherent
    FROM public.community_profiles cp
    WHERE cp.user_id = _user_id
    LIMIT 1
  ) p;

  WITH activites AS (
    SELECT
      l.created_at AS at,
      CASE
        WHEN l.event_type = 'session_start' THEN 'session'
        WHEN l.metadata->>'module' IS NOT NULL OR l.metadata->>'propriete_id' IS NOT NULL THEN 'jardin'
        ELSE 'marches'
      END AS univers,
      l.event_type AS kind,
      l.event_target AS target,
      l.exploration_id,
      l.marche_event_id,
      NULLIF(l.metadata->>'propriete_id','')::uuid AS propriete_id,
      l.metadata AS metadata
    FROM public.marcheur_activity_logs l
    WHERE l.user_id = _user_id AND l.created_at >= _from AND l.created_at <= _to
  ),
  contributions AS (
    SELECT m.created_at AS at, 'contribution'::text AS univers, 'media'::text AS kind,
           COALESCE(m.titre, m.type::text, 'média') AS target,
           NULL::uuid AS exploration_id, m.marche_event_id, NULL::uuid AS propriete_id,
           '{}'::jsonb AS metadata
    FROM public.marcheur_medias m
    WHERE m.user_id = _user_id AND m.created_at >= _from AND m.created_at <= _to
    UNION ALL
    SELECT o.created_at, 'contribution', 'observation',
           COALESCE(o.scientific_name, o.common_name, 'observation'),
           NULL::uuid, o.marche_event_id, NULL::uuid, '{}'::jsonb
    FROM public.marcheur_observations o
    WHERE o.user_id = _user_id AND o.created_at >= _from AND o.created_at <= _to
    UNION ALL
    SELECT t.created_at, 'contribution', 'texte', COALESCE(t.titre, 'texte'),
           NULL::uuid, t.marche_event_id, NULL::uuid, '{}'::jsonb
    FROM public.marcheur_textes t
    WHERE t.user_id = _user_id AND t.created_at >= _from AND t.created_at <= _to
    UNION ALL
    SELECT a.created_at, 'contribution', 'audio', COALESCE(a.titre, 'audio'),
           NULL::uuid, a.marche_event_id, NULL::uuid, '{}'::jsonb
    FROM public.marcheur_audio a
    WHERE a.user_id = _user_id AND a.created_at >= _from AND a.created_at <= _to
    UNION ALL
    SELECT pa.created_at, 'marches', 'participation', 'participation',
           NULL::uuid, pa.marche_event_id, NULL::uuid, '{}'::jsonb
    FROM public.marche_participations pa
    WHERE pa.user_id = _user_id AND pa.created_at >= _from AND pa.created_at <= _to
  ),
  recherches AS (
    SELECT s.created_at AS at, 'marches'::text, 'recherche'::text, COALESCE(s.query, ''),
           NULL::uuid, NULL::uuid, NULL::uuid, '{}'::jsonb
    FROM public.search_logs s
    WHERE s.user_id = _user_id AND s.created_at >= _from AND s.created_at <= _to
  ),
  assistant AS (
    SELECT am.created_at AS at, 'assistant'::text, am.role::text,
           left(am.content, 4000),
           c.exploration_id, c.marche_event_id, c.propriete_id,
           jsonb_build_object(
             'conversation_id', am.conversation_id,
             'surface', c.surface,
             'contexts', am.contexts,
             'model', am.model,
             'latency_ms', am.latency_ms,
             'error', am.error
           )
    FROM public.assistant_messages am
    JOIN public.assistant_conversations c ON c.id = am.conversation_id
    WHERE am.user_id = _user_id AND am.created_at >= _from AND am.created_at <= _to
  ),
  tout AS (
    SELECT * FROM activites
    UNION ALL SELECT * FROM contributions
    UNION ALL SELECT * FROM recherches
    UNION ALL SELECT * FROM assistant
  )
  SELECT COALESCE(jsonb_agg(x ORDER BY x.at), '[]'::jsonb) INTO v_events
  FROM (
    SELECT t.at, t.univers, t.kind, t.target, t.metadata,
           t.exploration_id, e.name AS exploration_nom,
           t.marche_event_id, ev.title AS event_nom,
           t.propriete_id, pr.nom AS propriete_nom
    FROM tout t
    LEFT JOIN public.explorations e ON e.id = t.exploration_id
    LEFT JOIN public.marche_events ev ON ev.id = t.marche_event_id
    LEFT JOIN public.proprietes pr ON pr.id = t.propriete_id
  ) x;

  RETURN jsonb_build_object(
    'profile', COALESCE(v_profile, 'null'::jsonb),
    'events', v_events,
    'range', jsonb_build_object('from', _from, 'to', _to),
    'generated_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_marcheur_parcours(uuid, timestamptz, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_marcheur_parcours(uuid, timestamptz, timestamptz) TO authenticated;