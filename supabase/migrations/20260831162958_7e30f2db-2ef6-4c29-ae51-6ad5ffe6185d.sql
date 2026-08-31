CREATE TABLE public.propriete_entretiens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  titre text NOT NULL DEFAULT 'Entretien fondateur',
  tenu_le date,
  source text NOT NULL DEFAULT 'texte',
  duree_minutes integer,
  transcript text,
  statut text NOT NULL DEFAULT 'brouillon',
  consentement boolean NOT NULL DEFAULT false,
  harvested_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_propriete_entretiens_propriete ON public.propriete_entretiens(propriete_id, tenu_le DESC);

CREATE TABLE public.propriete_entretien_extraits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entretien_id uuid NOT NULL REFERENCES public.propriete_entretiens(id) ON DELETE CASCADE,
  registre text NOT NULL,
  titre text NOT NULL,
  detail text,
  verbatim text,
  minutage text,
  cible text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  statut text NOT NULL DEFAULT 'propose',
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_entretien_extraits_entretien ON public.propriete_entretien_extraits(entretien_id, registre, ordre);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_entretiens TO authenticated;
GRANT ALL ON public.propriete_entretiens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_entretien_extraits TO authenticated;
GRANT ALL ON public.propriete_entretien_extraits TO service_role;

ALTER TABLE public.propriete_entretiens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propriete_entretien_extraits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entretiens_read" ON public.propriete_entretiens
  FOR SELECT TO authenticated
  USING (public.can_access_propriete(propriete_id));

CREATE POLICY "entretiens_insert" ON public.propriete_entretiens
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_propriete_onboarding(propriete_id));

CREATE POLICY "entretiens_update" ON public.propriete_entretiens
  FOR UPDATE TO authenticated
  USING (public.can_edit_propriete_onboarding(propriete_id))
  WITH CHECK (public.can_edit_propriete_onboarding(propriete_id));

CREATE POLICY "entretiens_delete" ON public.propriete_entretiens
  FOR DELETE TO authenticated
  USING (public.can_edit_propriete_onboarding(propriete_id));

CREATE POLICY "entretien_extraits_read" ON public.propriete_entretien_extraits
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.propriete_entretiens e
    WHERE e.id = entretien_id AND public.can_access_propriete(e.propriete_id)
  ));

CREATE POLICY "entretien_extraits_write" ON public.propriete_entretien_extraits
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.propriete_entretiens e
    WHERE e.id = entretien_id AND public.can_edit_propriete_onboarding(e.propriete_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.propriete_entretiens e
    WHERE e.id = entretien_id AND public.can_edit_propriete_onboarding(e.propriete_id)
  ));

CREATE TRIGGER trg_entretiens_updated_at BEFORE UPDATE ON public.propriete_entretiens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_entretien_extraits_updated_at BEFORE UPDATE ON public.propriete_entretien_extraits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();