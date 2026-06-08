# Cohérence des chiffres clés — /agent-ia, /marches-du-vivant, fiche PDF

## Diagnostic (audit live)

| Métrique affichée | /agent-ia | /marches-du-vivant | Vraie valeur BDD (aujourd'hui) | Source |
|---|---|---|---|---|
| Espèces tracées | **2 002** (hardcodé) | **1 709** (fallback hardcodé) | **2 002** | Union `lower(scientificName)` sur **tous** les `biodiversity_snapshots` |
| Domaines / Marches documentées | **80** (hardcodé) | **82** (req live `marches`) | **82** | `count(*) from marches` |
| Observations citoyennes | **592** (hardcodé) | — | **592** | `count(*) from marcheur_observations` |
| Marches organisées | **13** (hardcodé) | — | **13** | `count(*) from marche_events` |
| Marcheurs | **45** (hardcodé) | — | **45** | `count(*) from community_profiles` |
| Photos collectées | — | **241** (hardcodé) | 241 (marche_photos) + 338 (marcheur_medias) = **579** | à clarifier |
| Participations validées | « 91 » (hardcodé) | — | **70** | `count where validated_at not null` |

**Constats :**
1. `/agent-ia` : 100 % des chiffres sont en dur dans le JSX (`src/pages/AgentIA.tsx` lignes 25-30) → décrochage assuré.
2. `/marches-du-vivant` (`ScienceCounters.tsx`) : seul *espèces* lit la base, mais via `useBiodiversityStats` qui repose sur `getFilteredBiodiversitySnapshots` (≠ source de vérité utilisée par /agent-ia) → écart 1 709 vs 2 002. Le label "Photos collectées : 241" est aussi en dur.
3. PDF `/public/fiche-agent-marches-du-vivant.pdf` : fichier statique — aucune mise à jour possible sans régénération manuelle.
4. Trois terminologies différentes pour la même chose ("espèces observées" / "espèces recensées" / "espèces tracées", "marches documentées" vs "domaines documentés") → confusion utilisateur.

## Proposition

### A. Source de vérité unique en base : RPC `get_public_global_stats`

Une seule fonction PostgreSQL `SECURITY DEFINER`, exposée à `anon`, qui renvoie un JSON :

```json
{
  "especes_tracees": 2002,
  "domaines": 82,
  "marches_organisees": 13,
  "marcheurs": 45,
  "observations_citoyennes": 592,
  "participations_validees": 70,
  "photos_collectees": 579,
  "computed_at": "2026-06-08T..."
}
```

Règles de calcul figées (cohérentes avec la mémoire projet « fusion de TOUS les snapshots ») :
- `especes_tracees` : `count(distinct lower(scientificName))` sur **tous** les `biodiversity_snapshots` (pas seulement le dernier).
- `domaines` : `count(*) from marches`.
- `marches_organisees` : `count(*) from marche_events`.
- `marcheurs` : `count(*) from community_profiles`.
- `observations_citoyennes` : `count(*) from marcheur_observations`.
- `participations_validees` : `count(*) from marche_participations where validated_at is not null`.
- `photos_collectees` : `count(marche_photos) + count(marcheur_medias where media_type='photo')`.

### B. Hook React partagé `usePublicGlobalStats`

`src/hooks/usePublicGlobalStats.ts` :
```ts
useQuery({
  queryKey: ['public-global-stats'],
  queryFn: () => supabase.rpc('get_public_global_stats').single(),
  staleTime: 15 * 60 * 1000,   // 15 min
  refetchOnMount: 'always',    // toujours frais à l'ouverture
});
```

### C. Branchement des deux pages

1. **`src/pages/AgentIA.tsx`** : remplacer le tableau `stats` hardcodé par une dérivation du hook. Skeletons pendant le chargement. Sous-titres conservés mais valeurs dynamiques (« attribuées à N marcheurs », « M participations validées »).
2. **`src/components/marches-vivant/ScienceCounters.tsx`** : supprimer `useBiodiversityStats` + la requête `marches-count` + les fallbacks `1709` / `241` / `32`. Brancher `usePublicGlobalStats`. Aligner les libellés sur ceux de /agent-ia : « espèces tracées · domaines documentés · observations citoyennes » (3 KPI), pour cohérence terminologique stricte.
3. **`src/components/marches-vivant/ProofBar.tsx`** : même traitement (supprimer fallback `241`).

### D. Fiche PDF dynamique (la partie clé)

Le PDF statique ne pourra **jamais** rester synchrone. Deux options proposées, l'une est recommandée :

**Option 1 (recommandée) — Génération à la volée via edge function**
- Nouvelle edge function `generate-agent-ia-fiche` : appelle la RPC, injecte les chiffres dans un template `pdf-lib` (ou `@react-pdf/renderer`), renvoie le PDF en streaming.
- Le bouton « Télécharger la fiche » appelle l'edge function (`supabase.functions.invoke('generate-agent-ia-fiche')`) au lieu de pointer vers `/fiche-agent-marches-du-vivant.pdf`.
- Avantages : chiffres toujours frais, date du jour imprimée, traçabilité (`computed_at` visible en pied de page).

**Option 2 (fallback simple) — Page imprimable `/agent-ia/fiche`**
- Route React dédiée, mise en page A4 print-css, bouton « Imprimer / Enregistrer en PDF ».
- Pas d'edge function, mais le rendu PDF dépend du navigateur de l'utilisateur (qualité moins contrôlée).

Je recommande **Option 1** car elle conserve un PDF unique, brandé, identique pour tous, et la mémoire projet sur les exports Pack Vivant montre que la stack `pdf-lib` côté edge function est déjà maîtrisée.

### E. Cohérence terminologique (livrable transverse)

Aligner sur le vocabulaire de /agent-ia (mémoire projet : « Observations » au lieu de « Contributions », « Fréquences » au lieu de « Points ») :
- « espèces tracées » (et non « observées » / « recensées »)
- « domaines documentés » (et non « marches documentées » — un domaine peut accueillir plusieurs marches organisées)
- « observations citoyennes » (et non « photos collectées »)
- « marches organisées » pour les `marche_events`

## Détails techniques

**Migration SQL** (1 fichier) :
1. `CREATE FUNCTION public.get_public_global_stats() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ ... $$;`
2. `GRANT EXECUTE ON FUNCTION public.get_public_global_stats() TO anon, authenticated, service_role;`

**Edge function** `supabase/functions/generate-agent-ia-fiche/index.ts` :
- Récupère les stats via `supabase.rpc('get_public_global_stats')`
- Charge un template PDF de base (logo, capacités, engagements — contenu statique)
- Injecte les 5 KPI + date du jour avec `pdf-lib`
- Retourne `application/pdf` avec `Content-Disposition: attachment`

**Suppression** : `public/fiche-agent-marches-du-vivant.pdf` peut rester (fallback hors-ligne) ou être supprimé une fois l'edge function en place.

## Ordre d'implémentation suggéré

1. Migration SQL + RPC + GRANTs.
2. Hook `usePublicGlobalStats`.
3. Refactor `AgentIA.tsx`, `ScienceCounters.tsx`, `ProofBar.tsx`.
4. Edge function PDF + bouton mis à jour.
5. QA visuel sur les 2 pages + téléchargement du PDF généré.

## Question avant de partir en build

Confirmes-tu :
- **Option 1 (edge function PDF)** plutôt que page imprimable ?
- **`photos_collectees` = marche_photos + marcheur_medias (photo)** ou seulement `marche_photos` ?
- Garde-t-on **5 KPI** sur /marches-du-vivant (au lieu de 3 actuels) pour parfaite parité avec /agent-ia, ou les 3 actuels alignés terminologiquement suffisent ?
