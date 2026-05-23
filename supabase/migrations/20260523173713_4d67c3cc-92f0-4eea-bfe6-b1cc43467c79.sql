
CREATE TABLE public.api_mcp_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  family text NOT NULL CHECK (family IN ('biodiversity','territory','ai','infra')),
  name text NOT NULL,
  tagline text NOT NULL,
  simple_description text NOT NULL,
  tech_description text,
  hero_image_path text,
  icon_name text,
  flow_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  metric_queries jsonb NOT NULL DEFAULT '{}'::jsonb,
  live_screen_path text,
  external_doc_url text,
  is_critical boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_mcp_registry_order ON public.api_mcp_registry(display_order);
CREATE INDEX idx_api_mcp_registry_family ON public.api_mcp_registry(family);

ALTER TABLE public.api_mcp_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read api_mcp_registry"
  ON public.api_mcp_registry FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage api_mcp_registry"
  ON public.api_mcp_registry FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE TRIGGER trg_api_mcp_registry_updated_at
  BEFORE UPDATE ON public.api_mcp_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.api_mcp_registry (slug, family, name, tagline, simple_description, tech_description, hero_image_path, icon_name, flow_steps, metric_queries, live_screen_path, external_doc_url, is_critical, display_order) VALUES
('inaturalist','biodiversity','iNaturalist','La mémoire vivante des observateurs du monde entier','Chaque jour, des milliers d''observateurs photographient le vivant autour d''eux. iNaturalist rassemble ces regards et les rend visibles dans nos marches.','API REST iNat (observations + taxa). Synchronisée par edge function sync-biodiversity-snapshot, stockée dans biodiversity_snapshots avec historisation delta.','biodiversity','Bird',
 '[{"label":"Observation citoyenne","desc":"Un photographe partage sa rencontre"},{"label":"API iNaturalist","desc":"Filtrage géographique autour des marches"},{"label":"Edge sync-biodiversity-snapshot","desc":"Déduplication, normalisation NFD"},{"label":"Table biodiversity_snapshots","desc":"Historisation delta + garde-fou régression"},{"label":"Carnet du marcheur","desc":"L''espèce apparaît dans la fiche marche"}]'::jsonb,
 '{"volume":{"table":"biodiversity_snapshots","label":"observations synchronisées"},"freshness":{"table":"biodiversity_snapshots","column":"updated_at"},"impact":{"template":"{volume} observations enrichissent vos marches"}}'::jsonb,
 '/marches-du-vivant/mon-espace?tab=carnet','https://api.inaturalist.org/v1/docs/',true,10),
('gbif','biodiversity','GBIF','L''encyclopédie scientifique des espèces','Le Global Biodiversity Information Facility nous donne le vrai nom de chaque être vivant, son rang dans l''arbre du vivant et ses traits écologiques.','Edge function gbif-taxon-search. Cache familles taxonomiques utilisé par classify-species-eco-tags et backfill-snapshots-taxonomy.','biodiversity','TreePine',
 '[{"label":"Nom scientifique inconnu","desc":"Une espèce arrive sans famille"},{"label":"API GBIF /species/match","desc":"Recherche taxonomique"},{"label":"Cache local","desc":"Évite les appels répétés"},{"label":"Pipeline éco-tags","desc":"Classification automatique"}]'::jsonb,
 '{"volume":{"table":"biodiversity_snapshots","label":"espèces classifiées"},"freshness":{"table":"biodiversity_snapshots","column":"updated_at"},"impact":{"template":"{volume} espèces enrichies de leur taxonomie complète"}}'::jsonb,
 '/marches-du-vivant/mon-espace?tab=carnet','https://www.gbif.org/developer/summary',false,20),
('xeno-canto','biodiversity','Xeno-Canto','La bibliothèque sonore des oiseaux du monde','Quand vous découvrez un oiseau, vous pouvez aussi l''écouter chanter. Xeno-Canto archive des centaines de milliers d''enregistrements de terrain.','Edge function xeno-canto, requête par nom scientifique, retourne des extraits audio licenciés CC.','biodiversity','Volume2',
 '[{"label":"Oiseau identifié","desc":"Une espèce apparaît dans la fiche"},{"label":"API Xeno-Canto","desc":"Recherche par nom scientifique"},{"label":"Lecteur audio in-app","desc":"L''utilisateur écoute le chant"}]'::jsonb,
 '{"impact":{"template":"Des chants d''oiseaux pour chaque espèce identifiée"}}'::jsonb,
 '/marches-du-vivant/mon-espace?tab=carnet','https://xeno-canto.org/explore/api',false,30),
('open-meteo','territory','Open-Meteo','Le souffle météorologique du territoire','Pluie, vent, température, projections climatiques : Open-Meteo donne à chaque marche son climat passé, présent et futur.','Edge function open-meteo-data. Atlas climatique + projections + données historiques.','territory','CloudSun',
 '[{"label":"Coordonnées d''une marche","desc":"Latitude / longitude"},{"label":"API Open-Meteo","desc":"Forecast + climate + archive"},{"label":"Hooks météo","desc":"Visualisations temporelles"},{"label":"Atlas climatique","desc":"Récits + projections 2050"}]'::jsonb,
 '{"impact":{"template":"Météo en direct sur toutes les marches"}}'::jsonb,
 '/atlas-climatique','https://open-meteo.com/en/docs',false,40),
('sentinel-hub','territory','Sentinel Hub','Le regard satellite sur les paysages vivants','Depuis l''espace, les satellites Sentinel observent la végétation, l''humidité et les saisons. Nous traduisons leurs images en couches lisibles.','Edge function sentinel-hub. Indices NDVI, humidité, classifications utilisés par la cartographie immersive.','territory','Satellite',
 '[{"label":"Zone d''intérêt","desc":"Polygone d''une marche"},{"label":"Sentinel Hub Process API","desc":"NDVI / humidité / saisons"},{"label":"Couche carte","desc":"Visualisation immersive"}]'::jsonb,
 '{"impact":{"template":"Des paysages observés depuis l''espace"}}'::jsonb,
 '/marches-du-vivant/mon-espace?tab=carnet','https://docs.sentinel-hub.com/api/latest/',false,50),
('cadastre-ign','territory','Cadastre & IGN','Le parcellaire et les fonds cartographiques officiels','Pour ancrer chaque marche dans son territoire réel : limites communales, parcelles, voies, reliefs.','Edge function cadastre-proxy. Fonds IGN servis aux composants RichMap.','territory','Map',
 '[{"label":"Coordonnées","desc":"Point ou polygone"},{"label":"API Cadastre + IGN tiles","desc":"Parcelles + fonds"},{"label":"RichMap","desc":"Carte interactive"}]'::jsonb,
 '{"impact":{"template":"Chaque marche ancrée dans son territoire réel"}}'::jsonb,
 '/marches-du-vivant/mon-espace?tab=carnet','https://geoservices.ign.fr',false,60),
('lexicon-stations','territory','Stations Lexicon','Le réseau des stations météo locales','Plus de précision que la météo globale : les stations Lexicon donnent les conditions exactes du lieu de la marche.','Edge function lexicon-proxy. Résolution station la plus proche par useNearestLexiconStations.','territory','Radio',
 '[{"label":"Coordonnées marche","desc":"Lat/lng"},{"label":"Résolveur station","desc":"Calcul Haversine"},{"label":"API Lexicon","desc":"Données station"},{"label":"Calendrier météo","desc":"Affichage local"}]'::jsonb,
 '{"impact":{"template":"Données météo précises par station locale"}}'::jsonb,
 '/calendrier-meteo','#',false,70),
('lovable-ai','ai','Lovable AI Gateway','L''intelligence vivante qui dialogue avec vos marches','Gemini, à travers le Lovable AI Gateway, anime le chatbot, classifie les fonctions écologiques et tisse les récits du territoire.','Modèle google/gemini-3-flash-preview. Edge functions: classify-species-eco-tags, guide-marche-chat, quiz-companion-chat, generate-contextual-insights, marche-editorial-summary, analyze-exploration-species.','ai','Sparkles',
 '[{"label":"Question / liste d''espèces","desc":"Contexte écran filtré"},{"label":"Edge function dédiée","desc":"Validation JWT + injection contexte"},{"label":"Lovable AI Gateway","desc":"Streaming Gemini avec tool calling"},{"label":"Réponse contextuelle","desc":"Affichée en temps réel"}]'::jsonb,
 '{"volume":{"table":"species_eco_tags_kb","label":"espèces classifiées par IA"},"freshness":{"table":"species_eco_tags_kb","column":"last_validated_at"},"impact":{"template":"{volume} espèces enrichies par l''IA"}}'::jsonb,
 '/marches-du-vivant/mon-espace?tab=carnet','https://docs.lovable.dev/features/cloud',true,80),
('audio-transcription','ai','Transcription audio','La voix des marcheurs devient texte vivant','Les descriptions vocales enregistrées sur le terrain sont transcrites automatiquement pour devenir des récits partageables.','Edge functions audio-transcription + realtime-transcription. Whisper via gateway.','ai','Mic',
 '[{"label":"Enregistrement vocal","desc":"Marcheur décrit sa rencontre"},{"label":"Upload Supabase Storage","desc":"Fichier audio sécurisé"},{"label":"Edge audio-transcription","desc":"Whisper streaming"},{"label":"Description rich-text","desc":"Affichée + curable"}]'::jsonb,
 '{"impact":{"template":"Des voix de terrain transformées en récits"}}'::jsonb,
 '/marches-du-vivant/mon-espace','#',false,90),
('image-generation','ai','Génération d''images','Des visuels naturalistes co-créés avec l''IA','Pour donner corps aux pages éditoriales, des illustrations sont générées via Nano Banana et raffinées par l''équipe.','Modèle google/gemini-2.5-flash-image via Lovable AI Gateway.','ai','Image',
 '[{"label":"Brief visuel","desc":"Style, sujet, ambiance"},{"label":"AI Gateway image","desc":"Gemini 2.5 flash image"},{"label":"Stockage assets","desc":"src/assets ou Supabase Storage"},{"label":"Composition éditoriale","desc":"Affichée dans le livre vivant"}]'::jsonb,
 '{"impact":{"template":"Des illustrations sur mesure pour chaque récit"}}'::jsonb,
 '/lecteurs','#',false,100),
('supabase-edge','infra','Supabase Edge Functions','Le cœur battant du backend','Plus de 35 fonctions Edge orchestrent les synchronisations, les calculs, les exports, l''authentification renforcée.','Deno runtime. JWT validation + RLS + SECURITY DEFINER RPC. Toutes les intégrations externes passent par ici.','infra','Server',
 '[{"label":"Action utilisateur","desc":"Clic, navigation, sync"},{"label":"supabase.functions.invoke","desc":"Appel sécurisé"},{"label":"Edge function Deno","desc":"Logique + appel API externe"},{"label":"Table Supabase","desc":"Persistance + RLS"},{"label":"UI temps réel","desc":"React Query refetch"}]'::jsonb,
 '{"impact":{"template":"35+ fonctions Edge en production"}}'::jsonb,
 '/admin/outils','https://supabase.com/docs/guides/functions',true,110),
('n8n','infra','n8n','Le chef d''orchestre des workflows','Pour Dordonia et les automations complexes, n8n enchaîne les étapes : agents, calendriers, diagnostics, alertes.','Workflows hybrides n8n + Supabase Edge. Orchestration des 5 scénarios Dordonia, sync Google Calendar Gaspard.','infra','Workflow',
 '[{"label":"Trigger","desc":"Webhook ou cron"},{"label":"n8n workflow","desc":"Chaîne de nœuds"},{"label":"Appel Edge function","desc":"Persistance Supabase"},{"label":"Notification ou UI","desc":"Email, dashboard, agent"}]'::jsonb,
 '{"impact":{"template":"Workflows automatisés pour Dordonia et au-delà"}}'::jsonb,
 '/dordonia','https://docs.n8n.io',false,120),
('resend','infra','Resend','Les emails CRM et invitations','Pour communiquer avec les partenaires, les invitations CRM, les confirmations d''inscription.','Resend API via edge functions. Templates HTML embarqués.','infra','Mail',
 '[{"label":"Évènement","desc":"Inscription, opportunité CRM"},{"label":"Edge function","desc":"Composition template"},{"label":"Resend API","desc":"Envoi + tracking"},{"label":"Boîte de réception","desc":"Destinataire reçoit"}]'::jsonb,
 '{"impact":{"template":"Emails transactionnels fiables"}}'::jsonb,
 '/crm','https://resend.com/docs',false,130),
('mcp','infra','MCP Connectors','Le futur des intégrations contextuelles','Le Model Context Protocol permet à l''IA de se brancher directement sur des outils externes (Notion, Linear, Figma, n8n…). Une fondation pour étendre l''application demain.','Standard ouvert créé par Anthropic. Lovable expose un catalogue de connecteurs MCP utilisables au sein de l''agent IA. Roadmap : exposer la base biodiversité comme serveur MCP public.','infra','Network',
 '[{"label":"Outil externe","desc":"Notion, Linear, Figma, n8n…"},{"label":"Serveur MCP","desc":"Expose des tools standardisés"},{"label":"Client MCP","desc":"Lovable Agent ou app tierce"},{"label":"Contexte enrichi","desc":"L''IA agit avec plus de précision"}]'::jsonb,
 '{"impact":{"template":"Une porte ouverte vers des intégrations vivantes"}}'::jsonb,
 '/api-mcp','https://modelcontextprotocol.io',false,140);
