# Fiabilisation scientifique des « Pays d'origine »

## Diagnostic du bug

Sur le drawer « France → 4 espèces originaires », les 4 espèces affichées sont en réalité exotiques en France :

| Espèce | Origine réelle | Statut en France |
|---|---|---|
| *Lonicera japonica* | Asie de l'Est (Japon, Chine, Corée) | Naturalisée / envahissante |
| *Cercis siliquastrum* | Méditerranée orientale (Turquie, Levant) | Cultivée |
| *Oenothera lindheimeri* | Texas, Louisiane (USA) | Horticole |
| *Hypericum calycinum* | Turquie, Bulgarie, Caucase | Horticole |

**Cause racine** dans `enrich-species-biogeography/index.ts` :
1. `gbifDistributions` accepte comme « natif » les entrées dont `establishmentMeans` est **vide** (`status === ''`). GBIF agrège des checklists nationales (FCBN, Tela Botanica…) qui listent la France pour toute plante observée sur le territoire, sans préciser le statut. → la France entre dans `native_countries` à tort.
2. La cascade côté hook (`deriveOriginIso`) prend alors « le premier `native_country` » → souvent FR si la liste vient d'une checklist française.
3. **Aucune source primaire de type locality** (POWO/Kew pour les plantes, IUCN pour les animaux, GBIF `originalDescription` pour le type) n'est consultée.
4. **Aucune source n'est exposée** dans l'UI : le marcheur ne peut pas vérifier.

## Solution : pipeline d'origine scientifiquement validée

### 1. Sources primaires consultées (par ordre de priorité)

Pour chaque espèce, l'edge function interroge en cascade :

1. **POWO (Plants of the World Online, RBG Kew)** — `https://powo.science.kew.org/api/2/taxon/urn:lsid:ipni.org:names:{ipni}` → champ `distribution.natives[]` (TDWG WGSRPD niveau 3). Référence mondiale pour la flore. Donne aussi `accepted_authority.publication` et le **lieu de publication originale** (proxy fiable du type locality).
2. **GBIF Species API** — `/v1/species/{key}` puis `/profiles` et `/descriptions` : champs `typeLocality` (Darwin Core officiel) quand renseigné.
3. **GBIF Distributions filtrées strict** : ne garder que `establishmentMeans` ∈ {`NATIVE`, `ENDEMIC`} (rejeter `''`, `NATURALISED`, `INTRODUCED`, `INVASIVE`, `CRYPTOGENIC`, `UNCERTAIN`).
4. **iNaturalist /v1/taxa/{id}** — champ `establishment_means` croisé avec les places (utile pour les animaux).
5. **IUCN Red List API** (animaux) — `native_range` officiel quand dispo.
6. **Fallback `describer_country`** — uniquement si rien d'autre, marqué `confidence: 'low'`.

### 2. Modèle de confiance et traçabilité

Nouvelles colonnes sur `species_biogeography_kb` :

- `type_locality_source` text — `'powo' | 'gbif_type' | 'iucn' | 'gbif_distribution_strict' | 'inferred_describer'`
- `type_locality_confidence` text — `'verified' | 'high' | 'medium' | 'low'`
- `sources` jsonb — tableau `[{name, url, accessed_at, field}]` listant chaque source consultée et la valeur retenue
- `native_countries_verified` text[] — sous-ensemble strict (NATIVE/ENDEMIC seulement) de `native_countries`

`native_countries` legacy reste pour compat, mais le hook et l'UI passent désormais sur `native_countries_verified`.

### 3. Règle d'agrégation côté hook

`deriveOriginIso` réécrit :

1. `type_locality_country` avec `confidence ≥ 'high'` → retenu
2. Sinon, premier élément de `native_countries_verified` → retenu, `inferred: true`
3. Sinon **l'espèce n'est pas placée sur la carte** (on ne devine plus). Elle apparaît dans une section « Origine à vérifier » du panneau, transparente sur l'incertitude.

→ *Lonicera japonica* ira sur JP (POWO), pas FR.

### 4. UI : sources visibles et consultables

Dans `CountryOriginDrawer.tsx` et la liste des espèces :

- Chaque ligne espèce affiche un petit badge confiance : `✓ POWO`, `✓ GBIF`, `~ inféré`.
- Icône « ⓘ » qui ouvre un mini-pop : 
  - « Origine : Japon, Chine (POWO, Kew Royal Botanic Gardens) »
  - Liens cliquables : `POWO ↗`, `GBIF ↗`, `iNaturalist ↗`
  - Date de dernière vérification (`fetched_at`).
- Header du drawer : mention « Sources : POWO (Kew), GBIF, IUCN. Dernière mise à jour : … »
- Bouton « Signaler une erreur » qui ouvre un formulaire (insertion dans `species_origin_reports`) → ces signalements remontent en admin pour curation manuelle (table existe déjà ? sinon création simple).

### 5. Re-traitement complet de cette marche

- Migration nettoie : `UPDATE species_biogeography_kb SET fetched_at = '1970-01-01'` pour forcer le re-fetch.
- L'utilisateur clique « Rafraîchir » dans le panneau (ou auto au prochain mount avec coverage < 100%), l'edge function re-classifie toutes les espèces avec le nouveau pipeline.

### 6. Hors scope (Étape B)

- Backfill global toutes marches via cron `pg_cron` (200 espèces / run, frugal).
- Webhook iNat/eBird pour enrichir au fil de l'eau les nouvelles espèces.
- Curation manuelle admin (override d'origine par un naturaliste).

À traiter après validation que cette marche est désormais juste.

## Fichiers touchés

- `supabase/migrations/<new>.sql` — colonnes `type_locality_source`, `type_locality_confidence`, `sources`, `native_countries_verified` + reset `fetched_at`.
- `supabase/functions/enrich-species-biogeography/index.ts` — réécriture du pipeline (POWO → GBIF type → GBIF strict → iNat → IUCN → inferred), construction de `sources[]`.
- `src/hooks/useExplorationBiogeography.ts` — `deriveOriginIso` strict, expose `confidence` et `sources`.
- `src/components/community/analyse/origins/CountryOriginDrawer.tsx` — badges confiance, popover sources, lien « Signaler ».
- `src/components/community/analyse/OriginsFluxPanel.tsx` — bandeau « Sources : POWO, GBIF, IUCN », bouton « Rafraîchir » manuel.
- (Optionnel) `species_origin_reports` table + RPC `report_species_origin`.

## Validation visuelle attendue

Après re-enrichissement, le drawer « France » ne doit plus contenir que des espèces réellement indigènes de France métropolitaine (chêne pubescent, aubépine, mésange charbonnière, lézard des murailles…). Les 4 espèces du screenshot doivent migrer vers Japon, Turquie/Méditerranée orientale et États-Unis avec sources POWO/GBIF cliquables.
