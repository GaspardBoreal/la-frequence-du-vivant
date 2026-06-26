# Suggestion IA du stade phénologique (BBCH)

## Objectif
Quand le marcheur ouvre « Noter le stade phénologique » sur une espèce-culture (ex. Colza), l'app analyse **la photo courante** + le **référentiel BBCH** de la culture et **pré-sélectionne** le stade le plus probable, avec un niveau de confiance et une courte justification visuelle ("fleurs jaunes ouvertes + premières siliques visibles → BBCH 6–7").

## UX dans le drawer `PhenoStageSelector`
1. Bandeau IA en haut du drawer dès l'ouverture :
   - État *analyse* : shimmer + "Lecture de la photo en cours…"
   - État *résultat* : carte ambre/émeraude avec
     - Emoji + libellé du stade suggéré (ex. 🌼 BBCH 6 — Floraison)
     - Barre de confiance (0–100 %) + 1 phrase de justification
     - Boutons : **Accepter la suggestion** (sélectionne la tuile + scroll) / **Choisir un autre stade**
   - État *incertain* (confidence < 0.5) : propose **2 stades plausibles** côte à côte.
2. Tuile suggérée mise en évidence (anneau ambre pulsant ✨) dans la grille existante.
3. Si pas de photo disponible → bandeau masqué, comportement actuel inchangé.
4. Au save : on stocke `ai_suggested_stage`, `ai_confidence`, `ai_rationale` pour audit (et apprentissage futur).

## Architecture technique

### 1. Edge function `suggest-bbch-stage` (nouvelle)
- Auth : JWT marcheur requis.
- Input : `{ crop_key, photo_url, scientific_name }`.
- Construit dynamiquement le prompt à partir de `BBCH_CROPS` (libellés FR + URI ontologie INRAE/AgroPortal PPD-* déjà référencées dans `src/lib/bbchStages.ts`) → liste des 10 stades macro **spécifiques à la culture**.
- Appelle Lovable AI Gateway, modèle **`google/gemini-3-flash-preview`** (multimodal vision), via `/v1/chat/completions` avec :
  - `content` = `[ { type:'text', text: systemPrompt }, { type:'image_url', image_url:{ url: photo_url } } ]`
  - `tools` = function calling strict → `submit_bbch_stage({ macro:0-9, confidence:0-1, rationale:string, alternative_macro?:number })`
- Garde-fous : si confidence < 0.4 → renvoie `unknown=true`. Gestion 429 / 402 comme `classify-species-eco-tags`.
- Cache léger côté DB (clé = `photo_url`+`crop_key`) pour éviter de re-tarifer la même photo (table `pheno_ai_suggestions`).

### 2. Schéma DB
- Table `pheno_ai_suggestions` (cache) : `photo_url text pk, crop_key text, macro int, confidence numeric, rationale text, created_at timestamptz` + GRANTs + RLS lecture authenticated, écriture service_role.
- Colonnes ajoutées à `pheno_observations` : `ai_suggested_macro int`, `ai_confidence numeric`, `ai_rationale text`, `ai_accepted boolean`.

### 3. Frontend
- Nouveau hook `useBbchStageSuggestion({ crop, photoUrl, scientificName, enabled })` → invoque l'edge function, react-query, dédoublonne par `photo_url+crop_key`.
- Modif `PhenoStageSelector.tsx` :
  - Récupère la `photoUrl` (déjà passée en prop) et appelle le hook quand `open && photoUrl`.
  - Insère le bandeau IA + logique « Accepter » qui set `selected` sur l'index du stade suggéré.
  - Passe `ai_*` dans `useCreatePhenoObservation.mutateAsync`.
- Modif `useCreatePhenoObservation` pour persister les 4 colonnes IA.

### 4. Sources BBCH branchées
- On reste sur la **source de vérité locale** `src/lib/bbchStages.ts` (déjà alignée INRAE `phenologicalstages` + AgroPortal PPD-CR/PPDO). Le prompt référence les URIs ontologiques pour ancrer l'IA sur les bons stades.
- Pas d'appel runtime aux endpoints INRAE/AgroPortal (pas d'API publique stable orientée requête par stade) — on garde la latence basse et la robustesse offline.

## Hors scope (v1)
- Détection multi-stades (mosaïque parcelle).
- Apprentissage actif depuis `ai_accepted` (préparé en DB, exploité plus tard).
- Suggestion sur photos iNaturalist tierces (v1 : photos marcheur uniquement, droits clairs).

## Livrables
1. Migration SQL (`pheno_ai_suggestions` + colonnes `pheno_observations` + GRANTs/RLS).
2. Edge function `suggest-bbch-stage` + déclaration `supabase/config.toml`.
3. Hook `useBbchStageSuggestion.ts`.
4. Refonte `PhenoStageSelector.tsx` (bandeau IA + tuile mise en avant).
5. Mise à jour `usePhenoObservations` pour les champs IA.
