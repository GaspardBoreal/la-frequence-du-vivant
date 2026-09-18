-- ============ FICHES ============
CREATE TABLE public.kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_id text UNIQUE,
  title text NOT NULL,
  question_principale text,
  short_answer text NOT NULL DEFAULT '',
  body_md text NOT NULL DEFAULT '',
  audiences text[] NOT NULL DEFAULT '{}',
  univers text NOT NULL DEFAULT 'jardin',
  topic text,
  status text NOT NULL DEFAULT 'brouillon',
  is_public boolean NOT NULL DEFAULT false,
  origin text NOT NULL DEFAULT 'manuel',
  author_id uuid,
  reviewer_id uuid,
  validated_at timestamptz,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kb_articles_status_chk CHECK (status IN ('brouillon','relecture','publiee')),
  CONSTRAINT kb_articles_origin_chk CHECK (origin IN ('code','manuel','externe','entretien'))
);

CREATE TABLE public.kb_article_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text,
  consulted_at date NOT NULL DEFAULT current_date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kb_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  normalized text,
  audience text NOT NULL DEFAULT 'jardinier',
  univers text NOT NULL DEFAULT 'jardin',
  origin text NOT NULL DEFAULT 'fournie',
  occurrences integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'ouverte',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kb_questions_origin_chk CHECK (origin IN ('fournie','assistant','support')),
  CONSTRAINT kb_questions_status_chk CHECK (status IN ('ouverte','couverte','ignoree'))
);

CREATE TABLE public.kb_question_articles (
  question_id uuid NOT NULL REFERENCES public.kb_questions(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, article_id)
);

CREATE TABLE public.kb_article_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  changed_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ GRANTS ============
GRANT SELECT ON public.kb_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_articles TO authenticated;
GRANT ALL ON public.kb_articles TO service_role;

GRANT SELECT ON public.kb_article_sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_article_sources TO authenticated;
GRANT ALL ON public.kb_article_sources TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_questions TO authenticated;
GRANT ALL ON public.kb_questions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_question_articles TO authenticated;
GRANT ALL ON public.kb_question_articles TO service_role;

GRANT SELECT ON public.kb_article_versions TO authenticated;
GRANT ALL ON public.kb_article_versions TO service_role;

-- ============ RLS ============
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_article_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_question_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_article_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_articles_public_read" ON public.kb_articles
  FOR SELECT USING (status = 'publiee' AND is_public = true);
CREATE POLICY "kb_articles_admin_all" ON public.kb_articles
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "kb_sources_public_read" ON public.kb_article_sources
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.kb_articles a
    WHERE a.id = article_id AND a.status = 'publiee' AND a.is_public = true
  ));
CREATE POLICY "kb_sources_admin_all" ON public.kb_article_sources
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "kb_questions_admin_all" ON public.kb_questions
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "kb_qa_admin_all" ON public.kb_question_articles
  FOR ALL TO authenticated
  USING (public.check_is_admin_user(auth.uid()))
  WITH CHECK (public.check_is_admin_user(auth.uid()));

CREATE POLICY "kb_versions_admin_read" ON public.kb_article_versions
  FOR SELECT TO authenticated
  USING (public.check_is_admin_user(auth.uid()));

-- ============ RECHERCHE ============
CREATE OR REPLACE FUNCTION public.kb_articles_search_vector()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', public.f_unaccent(coalesce(NEW.title,''))), 'A') ||
    setweight(to_tsvector('french', public.f_unaccent(coalesce(NEW.question_principale,''))), 'A') ||
    setweight(to_tsvector('french', public.f_unaccent(coalesce(NEW.short_answer,''))), 'B') ||
    setweight(to_tsvector('french', public.f_unaccent(coalesce(NEW.body_md,''))), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_kb_articles_search
BEFORE INSERT OR UPDATE ON public.kb_articles
FOR EACH ROW EXECUTE FUNCTION public.kb_articles_search_vector();

CREATE INDEX kb_articles_search_idx ON public.kb_articles USING gin (search_vector);
CREATE INDEX kb_articles_status_idx ON public.kb_articles (status, univers);
CREATE INDEX kb_sources_article_idx ON public.kb_article_sources (article_id);
CREATE INDEX kb_versions_article_idx ON public.kb_article_versions (article_id, created_at DESC);

-- ============ GARDE-FOU PUBLICATION ============
CREATE OR REPLACE FUNCTION public.kb_articles_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'publiee' THEN
    IF NOT EXISTS (SELECT 1 FROM public.kb_article_sources s WHERE s.article_id = NEW.id) THEN
      RAISE EXCEPTION 'Impossible de publier cette fiche : aucune source citée.';
    END IF;
    IF coalesce(trim(NEW.short_answer), '') = '' THEN
      RAISE EXCEPTION 'Impossible de publier cette fiche : la réponse courte est vide.';
    END IF;
    IF NEW.validated_at IS NULL THEN
      NEW.validated_at := now();
      NEW.reviewer_id := coalesce(NEW.reviewer_id, auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_kb_articles_guard
BEFORE INSERT OR UPDATE ON public.kb_articles
FOR EACH ROW EXECUTE FUNCTION public.kb_articles_guard();

-- ============ HISTORIQUE ============
CREATE OR REPLACE FUNCTION public.kb_articles_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status = 'publiee' AND (
       OLD.title IS DISTINCT FROM NEW.title
    OR OLD.short_answer IS DISTINCT FROM NEW.short_answer
    OR OLD.body_md IS DISTINCT FROM NEW.body_md
    OR OLD.status IS DISTINCT FROM NEW.status
  ) THEN
    INSERT INTO public.kb_article_versions (article_id, snapshot, changed_by)
    VALUES (OLD.id, to_jsonb(OLD) - 'search_vector', auth.uid());
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_kb_articles_version
AFTER UPDATE ON public.kb_articles
FOR EACH ROW EXECUTE FUNCTION public.kb_articles_version();

CREATE OR REPLACE FUNCTION public.kb_questions_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

CREATE TRIGGER trg_kb_questions_touch
BEFORE UPDATE ON public.kb_questions
FOR EACH ROW EXECUTE FUNCTION public.kb_questions_touch();

-- ============ CARTOGRAPHIE ============
CREATE OR REPLACE FUNCTION public.get_kb_coverage()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs.';
  END IF;

  SELECT jsonb_build_object(
    'sources', jsonb_build_array(
      jsonb_build_object('cle','jardins','libelle','Jardins enregistrés','famille','Terrain','volume',(SELECT count(*) FROM proprietes)),
      jsonb_build_object('cle','sol','libelle','Analyses de sol','famille','Terrain','volume',(SELECT count(*) FROM propriete_soil_diagnostics)),
      jsonb_build_object('cle','flore','libelle','Diagnostics de flore','famille','Terrain','volume',(SELECT count(*) FROM propriete_flora_diagnostics)),
      jsonb_build_object('cle','palette','libelle','Palettes végétales','famille','Terrain','volume',(SELECT count(*) FROM propriete_palette)),
      jsonb_build_object('cle','tours','libelle','Actions de tour de jardin','famille','Terrain','volume',(SELECT count(*) FROM propriete_tour_actions)),
      jsonb_build_object('cle','entretiens','libelle','Points d''entretien validés','famille','Terrain','volume',(SELECT count(*) FROM propriete_entretien_extraits)),
      jsonb_build_object('cle','consultations','libelle','Consultations clinique','famille','Terrain','volume',(SELECT count(*) FROM propriete_consultations)),
      jsonb_build_object('cle','capteurs','libelle','Mesures de capteurs','famille','Terrain','volume',(SELECT count(*) FROM iot_mesures)),
      jsonb_build_object('cle','pathogenes','libelle','Maladies et ravageurs','famille','Savoir','volume',(SELECT count(*) FROM garden_pathogens_kb)),
      jsonb_build_object('cle','ouvrages','libelle','Fiches ouvrages','famille','Savoir','volume',(SELECT count(*) FROM propriete_ouvrage_kb)),
      jsonb_build_object('cle','eco_tags','libelle','Espèces étiquetées par fonction','famille','Savoir','volume',(SELECT count(*) FROM species_eco_tags_kb)),
      jsonb_build_object('cle','biogeo','libelle','Fiches de répartition d''espèces','famille','Savoir','volume',(SELECT count(*) FROM species_biogeography_kb)),
      jsonb_build_object('cle','pages','libelle','Pages publiques catalogées','famille','Public','volume',(SELECT count(*) FROM site_pages)),
      jsonb_build_object('cle','echanges','libelle','Messages échangés avec l''Assistant','famille','Usage','volume',(SELECT count(*) FROM assistant_messages))
    ),
    'fiches', jsonb_build_object(
      'total',(SELECT count(*) FROM kb_articles),
      'publiees',(SELECT count(*) FROM kb_articles WHERE status='publiee'),
      'relecture',(SELECT count(*) FROM kb_articles WHERE status='relecture'),
      'brouillons',(SELECT count(*) FROM kb_articles WHERE status='brouillon'),
      'sans_source',(SELECT count(*) FROM kb_articles a WHERE NOT EXISTS (SELECT 1 FROM kb_article_sources s WHERE s.article_id=a.id)),
      'a_relire',(SELECT count(*) FROM kb_articles WHERE status='publiee' AND validated_at < now() - interval '6 months')
    ),
    'questions', jsonb_build_object(
      'total',(SELECT count(*) FROM kb_questions),
      'couvertes',(SELECT count(*) FROM kb_questions q WHERE EXISTS (SELECT 1 FROM kb_question_articles qa WHERE qa.question_id=q.id)),
      'ouvertes',(SELECT count(*) FROM kb_questions q WHERE q.status='ouverte' AND NOT EXISTS (SELECT 1 FROM kb_question_articles qa WHERE qa.question_id=q.id)),
      'par_public',(SELECT coalesce(jsonb_object_agg(audience, n),'{}'::jsonb) FROM (SELECT audience, count(*) n FROM kb_questions GROUP BY audience) x)
    )
  ) INTO result;

  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.get_kb_coverage() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_kb_coverage() TO authenticated;

-- ============ QUESTIONS ISSUES DES ÉCHANGES ============
CREATE OR REPLACE FUNCTION public.suggest_kb_questions_from_assistant(_limit integer DEFAULT 50)
RETURNS TABLE(label text, occurrences bigint, derniere timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.check_is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs.';
  END IF;
  RETURN QUERY
  SELECT left(btrim(m.content), 240) AS label, count(*) AS occurrences, max(m.created_at) AS derniere
  FROM assistant_messages m
  WHERE m.role = 'user' AND coalesce(btrim(m.content),'') <> ''
    AND NOT EXISTS (
      SELECT 1 FROM kb_questions q
      WHERE public.f_unaccent(lower(q.label)) = public.f_unaccent(lower(left(btrim(m.content), 240)))
    )
  GROUP BY 1
  ORDER BY 2 DESC, 3 DESC
  LIMIT greatest(1, least(_limit, 200));
END $$;

REVOKE ALL ON FUNCTION public.suggest_kb_questions_from_assistant(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.suggest_kb_questions_from_assistant(integer) TO authenticated;