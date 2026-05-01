-- Enum pour les 5 sens
CREATE TYPE public.curation_sense AS ENUM ('oeil', 'main', 'coeur', 'oreille', 'palais');

-- Table polymorphe de curation
CREATE TABLE public.exploration_curations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id UUID NOT NULL REFERENCES public.explorations(id) ON DELETE CASCADE,
  sense public.curation_sense NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('species', 'media', 'text', 'audio', 'palais_entry')),
  entity_id TEXT,
  category TEXT,
  title TEXT,
  description TEXT,
  media_ids UUID[] DEFAULT ARRAY[]::UUID[],
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exploration_curations_lookup
  ON public.exploration_curations(exploration_id, sense, display_order);

CREATE INDEX idx_exploration_curations_entity
  ON public.exploration_curations(entity_type, entity_id);

-- Trigger updated_at
CREATE TRIGGER update_exploration_curations_updated_at
  BEFORE UPDATE ON public.exploration_curations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction security definer : vérifier si l'utilisateur peut curater l'évènement
CREATE OR REPLACE FUNCTION public.is_event_curator(_user_id UUID, _exploration_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Admin global
    public.check_is_admin_user(_user_id)
    OR EXISTS (
      -- Ambassadeur ou sentinelle inscrit·e à un évènement de l'exploration
      SELECT 1
      FROM public.community_profiles cp
      JOIN public.marche_participations mp ON mp.user_id = cp.user_id
      JOIN public.marche_events me ON me.id = mp.marche_event_id
      WHERE cp.user_id = _user_id
        AND me.exploration_id = _exploration_id
        AND cp.role::text IN ('ambassadeur', 'sentinelle')
    );
$$;

-- Activer RLS
ALTER TABLE public.exploration_curations ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Curations are publicly readable"
  ON public.exploration_curations
  FOR SELECT
  USING (true);

-- Insertion : seuls les curateurs de l'évènement
CREATE POLICY "Curators can insert curations"
  ON public.exploration_curations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.is_event_curator(auth.uid(), exploration_id)
    AND created_by = auth.uid()
  );

-- Mise à jour : seuls les curateurs de l'évènement
CREATE POLICY "Curators can update curations"
  ON public.exploration_curations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND public.is_event_curator(auth.uid(), exploration_id)
  );

-- Suppression : seuls les curateurs de l'évènement
CREATE POLICY "Curators can delete curations"
  ON public.exploration_curations
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND public.is_event_curator(auth.uid(), exploration_id)
  );

-- RPC pour réordonner (drag-and-drop)
CREATE OR REPLACE FUNCTION public.reorder_exploration_curations(
  _exploration_id UUID,
  _sense public.curation_sense,
  _curation_ids UUID[],
  _new_orders INTEGER[]
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_event_curator(auth.uid(), _exploration_id) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  IF array_length(_curation_ids, 1) IS DISTINCT FROM array_length(_new_orders, 1) THEN
    RAISE EXCEPTION 'IDs and orders arrays must have same length';
  END IF;

  FOR i IN 1..array_length(_curation_ids, 1) LOOP
    UPDATE public.exploration_curations
    SET display_order = _new_orders[i],
        updated_at = now()
    WHERE id = _curation_ids[i]
      AND exploration_id = _exploration_id
      AND sense = _sense;
  END LOOP;
END;
$$;