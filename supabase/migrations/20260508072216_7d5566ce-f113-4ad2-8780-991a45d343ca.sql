
CREATE TABLE public.event_testimonies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  quote text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_testimonies_event ON public.event_testimonies(event_id);
CREATE INDEX idx_event_testimonies_user ON public.event_testimonies(user_id);

ALTER TABLE public.event_testimonies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published testimonies are public"
ON public.event_testimonies FOR SELECT USING (is_published = true);

CREATE POLICY "Owners select own"
ON public.event_testimonies FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners insert own"
ON public.event_testimonies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own"
ON public.event_testimonies FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete own"
ON public.event_testimonies FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all testimonies"
ON public.event_testimonies FOR ALL
USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE TRIGGER update_event_testimonies_updated_at
BEFORE UPDATE ON public.event_testimonies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.match_marcheur_for_event(_name text, _event_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT em.user_id
  FROM public.exploration_marcheurs em
  JOIN public.marche_events me ON me.exploration_id = em.exploration_id
  WHERE me.id = _event_id
    AND em.user_id IS NOT NULL
    AND lower(extensions.unaccent(coalesce(em.prenom,'') || ' ' || coalesce(em.nom,'')))
        = lower(extensions.unaccent(_name))
  LIMIT 1;
$$;
