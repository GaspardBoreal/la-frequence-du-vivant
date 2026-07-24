## Objectif

Refondre le bandeau « Ce que la Fréquence du Vivant sait déjà » en tête de l'étape 3 (J'identifie) pour :
1. Le **rendre repliable** (fermé par défaut), en n'affichant que les 4 KPI clés.
2. Remplacer la liste statique « Espèces les plus présentes » par le **`<SpeciesExplorer />` unifié** (le même que l'app marcheurs → Biodiversité → Taxons observés), avec noms FR, photos marcheurs, modes Galerie/Liste et bouton **Découvrir** (Enfant / Immersif / Prospectif).

Décision validée : les espèces sont **fusionnées à travers toutes les Marches liées à la propriété**.

## Modifications

### 1. Nouveau hook d'agrégation multi-marches
`src/hooks/propriete/usePropertySpeciesPool.ts`
- Récupère la liste des `explorationId` liés à la propriété (déjà exposés par `usePropertyBiodiversity` → `bio.events`).
- Pour chaque exploration, appelle `useExplorationSpeciesPool` (source de vérité déjà utilisée par l'app marcheurs).
- Fusionne les pools par clé (`scientificName` normalisé), somme les counts, garde la première image, l'union des `contributors`, dernière `observationDate`.
- Retourne `BiodiversitySpecies[]` prêt pour `<SpeciesExplorer />` (via l'adapter existant `useExplorationDiscoverSpecies` réutilisé/étendu).

### 2. Refonte `BiodiversityEvidenceBlock.tsx`
- Wrapper en `<details>` ou state `expanded` (fermé par défaut).
- **Header replié** = 4 tuiles KPI existantes + bouton chevron « Voir les détails ».
- **Header déplié** = KPI + « Répartition par règne » (badges existants) + section **Taxons observés** montée sur `<SpeciesExplorer />`.
- Suppression de l'ancienne liste `topSpecies` statique.
- Photos marcheurs + noms FR + Galerie/Liste + Découvrir héritent automatiquement du composant unifié (aucun code dupliqué).

### 3. Câblage dans `TabIdentify.tsx` / `ProprieteEspace.tsx`
- Passer les `explorationIds` (dérivés de `bio.events`) au nouveau hook et injecter `species` + `explorationId` (le plus récent, pour photos terrain prioritaires) au `BiodiversityEvidenceBlock`.
- Fournir un `filtersLabel` type « Propriété <nom> · N marches ».

### 4. Cohérence évolutions
Les 2 univers (app marcheurs & app propriétaire) partagent désormais **le même composant** `<SpeciesExplorer />` + les mêmes hooks (`useExplorationSpeciesPool`, `useFrenchSpeciesNames`, `useSpeciesThumbs`, `DiscoverFullscreenProvider`) : toute évolution future (nouveau mode Découvrir, nouveau filtre, nouvelle vue) s'appliquera automatiquement des deux côtés.

## Détails techniques

- Aucune migration SQL nécessaire — on réutilise `useExplorationSpeciesPool` (déjà unifié via RPC `get_exploration_species_count` + fusion snapshots ∪ marcheur_observations).
- `DiscoverFullscreenProvider` est déjà monté au niveau App (utilisé par l'app marcheurs), donc le bouton Découvrir fonctionnera sans setup supplémentaire dans `ProprieteEspace`.
- L'agrégation multi-marches se fait côté client (fan-out React Query par explorationId puis reduce), ce qui évite toute nouvelle RPC ; le nombre de marches par propriété reste petit (typiquement <10).
- Le bloc « Répartition par règne » reste calculé à partir du pool fusionné (plus juste que l'ancien `kingdoms` RPC).
