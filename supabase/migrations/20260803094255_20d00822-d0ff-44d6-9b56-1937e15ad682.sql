CREATE TABLE public.propriete_chantiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  propriete_id uuid NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  nom text NOT NULL,
  objet_ids uuid[] NOT NULL DEFAULT '{}',
  date_travaux date,
  statut text NOT NULL DEFAULT 'projet',
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_propriete_chantiers_propriete ON public.propriete_chantiers(propriete_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_chantiers TO authenticated;
GRANT ALL ON public.propriete_chantiers TO service_role;

ALTER TABLE public.propriete_chantiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chantiers_select" ON public.propriete_chantiers
  FOR SELECT TO authenticated USING (public.can_access_propriete(propriete_id));
CREATE POLICY "chantiers_insert" ON public.propriete_chantiers
  FOR INSERT TO authenticated WITH CHECK (public.can_access_propriete(propriete_id));
CREATE POLICY "chantiers_update" ON public.propriete_chantiers
  FOR UPDATE TO authenticated USING (public.can_access_propriete(propriete_id))
  WITH CHECK (public.can_access_propriete(propriete_id));
CREATE POLICY "chantiers_delete" ON public.propriete_chantiers
  FOR DELETE TO authenticated USING (public.can_access_propriete(propriete_id));

CREATE TABLE public.propriete_chantier_media_phases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chantier_id uuid NOT NULL REFERENCES public.propriete_chantiers(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.propriete_objet_photos(id) ON DELETE CASCADE,
  phase text NOT NULL DEFAULT 'avant',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (chantier_id, photo_id)
);

CREATE INDEX idx_chantier_media_phases_chantier ON public.propriete_chantier_media_phases(chantier_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_chantier_media_phases TO authenticated;
GRANT ALL ON public.propriete_chantier_media_phases TO service_role;

ALTER TABLE public.propriete_chantier_media_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chantier_phases_all" ON public.propriete_chantier_media_phases
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.propriete_chantiers c WHERE c.id = chantier_id AND public.can_access_propriete(c.propriete_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.propriete_chantiers c WHERE c.id = chantier_id AND public.can_access_propriete(c.propriete_id)));

CREATE TRIGGER trg_propriete_chantiers_updated_at
  BEFORE UPDATE ON public.propriete_chantiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();