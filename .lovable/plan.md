
# Page « API & MCP » — L'écosystème vivant de l'app

## 1. Vision

Une page qui rend visible et compréhensible **toute la mécanique invisible** qui fait vivre l'application : chaque API externe, chaque edge function, chaque MCP devient une **carte-constellation** racontée comme un personnage de l'écosystème.

Deux modes :
- **Vitrine publique** `/api-mcp` — narration, transparence, SEO « voici notre stack vivante »
- **Tableau de bord admin** `/admin/outils/api-mcp` — mêmes cartes + métriques live + santé + alertes

## 2. Points d'entrée

### Côté marcheur (OutilsTab)
Nouveau bloc carte « **API & MCP — L'écosystème de l'app** » ajouté dans `TOOLS[]` de `src/components/community/tabs/OutilsTab.tsx`, icône `Network` (Lucide), accessible à tous les rôles. Clic → navigation vers `/api-mcp`.

### Côté admin
- Carte « API & MCP » ajoutée dans `src/pages/AdminOutilsHub.tsx` (active, route `/admin/outils/api-mcp`)
- **Bandeau santé** réutilisable `<ApiHealthBanner />` injecté en haut du dashboard admin (`AdminAccess`) : visible uniquement si ≥ 1 API critique en alerte > 24h (rouge) ou warning (orange). Cliquable → page admin API & MCP.

### Côté public
- Lien discret dans le footer global / page « À propos » vers `/api-mcp`

## 3. Périmètre — les 14 cartes

Regroupées en 4 familles, fond emerald constellation.

**Biodiversité**
1. iNaturalist — observations citoyennes naturalistes
2. GBIF — taxonomie scientifique de référence
3. Xeno-Canto — chants d'oiseaux

**Territoire & climat**
4. Open-Meteo — météo & projections climatiques
5. Sentinel Hub — imagerie satellite
6. Cadastre / IGN — parcellaire et fonds carto
7. Lexicon stations — réseau de stations météo locales

**IA & génération**
8. Lovable AI Gateway (Gemini) — classification éco-tags, chatbot, insights
9. Transcription audio — descriptions vocales des marcheurs
10. Génération d'images — visuels d'espèces et de marches

**Infra & automation**
11. Supabase Edge Functions — 35+ fonctions backend
12. n8n — orchestration Dordonia & workflows
13. Resend — emails CRM & invitations
14. MCP connectors — concept + ceux en place + roadmap

## 4. Structure d'une carte (vitrine)

```text
┌──────────────────────────────────────┐
│ [icône constellation] iNaturalist    │
│ « La mémoire vivante des observateurs»│
│                                       │
│ Une phrase simple, accessible aux 3   │
│ audiences (1 ligne).                  │
│                                       │
│ ✨ 12 847 observations  · maj 2h     │
│ 🌿 1 247 espèces enrichies dans l'app│
│                                       │
│ → Découvrir l'histoire                │
└──────────────────────────────────────┘
```

Au clic → ouverture d'une **popup scrollytelling immersive plein écran** (Sheet / Dialog).

## 5. Popup « Une journée dans la vie d'une donnée »

Format storytelling 4 chapitres avec scroll progressif (Framer Motion `useScroll` + parallax) :

1. **Naissance** — D'où vient la donnée ? (illustration IA hero : un naturaliste, un satellite, une oreille au bois…)
2. **Voyage** — Constellation animée source → edge function → table Supabase → écran (SVG animé, lignes lumineuses)
3. **Atterrissage** — Capture annotée live d'un écran de l'app où cette donnée se manifeste (« vous la verrez ici » + bouton « voir en vrai »)
4. **Impact** — 1 exemple concret tiré de la base (« L'observation #12345 du Martin-pêcheur par Marie sur la Marche du 12 mai »)

Niveaux de lecture progressifs : par défaut tout est simple ; un bouton « **🔬 Aller plus loin** » déplie un volet technique (endpoint, fréquence sync, quotas, schéma table).

## 6. Visuels

**Hybride** :
- **12 illustrations hero IA générées une fois** via le tool `imagegen` (style constellation vivante : emerald deep #0D6B58 → mint #2DD4A8, points lumineux reliés, esthétique « cartographie nocturne du vivant »), stockées dans `src/assets/api-mcp/`
- **Flux animés live** en SVG + Framer Motion (lignes qui pulsent, données qui voyagent) — composant réutilisable `<DataFlowConstellation />`

## 7. Données live (Supabase)

Nouvelle edge function **`get-api-mcp-health`** (publique, mode vitrine) et **`get-api-mcp-health-admin`** (JWT + rôle admin/sentinelle, mode dashboard enrichi).

Métriques par API, agrégées en temps réel :
- **Volume** : `COUNT` sur tables concernées (snapshots iNat, marcheur_observations, audio_transcriptions, ai_chat_logs…)
- **Fraîcheur** : `MAX(updated_at)` ou dernier appel logué
- **Impact concret** : phrase générée (« 1 247 espèces enrichies », « 89 chants écoutés »)
- **Santé** : ratio succès/erreur edge function logs sur 24h → vert / orange / rouge

Hook `useApiMcpHealth()` avec React Query (staleTime 5min, refetch on focus).

## 8. Nouvelle table — `api_mcp_registry`

Catalogue déclaratif des 14 APIs, source unique de vérité, éditable par admin via interface dédiée si besoin futur.

Colonnes : `id`, `slug`, `family` (biodiv/territory/ai/infra), `name`, `tagline`, `simple_description`, `tech_description`, `hero_image_path`, `flow_steps` (jsonb), `metric_queries` (jsonb : { volume_query, freshness_query, impact_template }), `live_screen_path` (route app où on la voit), `external_doc_url`, `is_critical` (bool — déclenche bandeau admin si KO), `display_order`, `created_at`, `updated_at`.

RLS : SELECT public, ALL admin.

## 9. Routing & fichiers

**Nouveaux fichiers**
- `src/pages/ApiMcpPublic.tsx` — vitrine publique
- `src/pages/AdminApiMcp.tsx` — version admin enrichie
- `src/components/api-mcp/ApiCard.tsx` — carte constellation
- `src/components/api-mcp/ApiStoryDrawer.tsx` — popup scrollytelling
- `src/components/api-mcp/DataFlowConstellation.tsx` — SVG flux animé
- `src/components/api-mcp/ApiHealthBanner.tsx` — bandeau admin
- `src/components/api-mcp/ApiMetricChip.tsx` — chip métrique live
- `src/hooks/useApiMcpRegistry.ts` — fetch catalogue
- `src/hooks/useApiMcpHealth.ts` — fetch métriques live
- `src/lib/apiMcpFamilies.ts` — config familles (couleurs, icônes)
- `src/assets/api-mcp/*.jpg` — 14 hero IA
- `supabase/functions/get-api-mcp-health/index.ts`
- `supabase/functions/get-api-mcp-health-admin/index.ts`

**Modifiés**
- `src/components/community/tabs/OutilsTab.tsx` — ajout entrée
- `src/pages/AdminOutilsHub.tsx` — activation carte
- `src/App.tsx` — routes `/api-mcp` (public) et `/admin/outils/api-mcp`
- `src/pages/AdminAccess.tsx` — injection `<ApiHealthBanner />`
- `index.html` — meta SEO pour `/api-mcp`

## 10. Migration DB (à approuver)

- Table `api_mcp_registry` + RLS
- Seed initial des 14 entrées
- Index sur `display_order`, `slug`

## 11. Hors-scope (proposé séparément si besoin)

- Interface admin d'édition CRUD du registry (v1 : seed via migration)
- Historique de santé long terme / graphiques timeseries
- Génération des 14 hero IA premium (v1 : `fast` tier suffit, upgrade au cas par cas)
- Notifications push/email aux admins (v1 : bandeau visuel uniquement)
