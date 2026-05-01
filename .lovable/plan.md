
## Diagnostic

### Ce que montrent les écrans
- **Apprendre → L'œil** (copie 1) : les vignettes de Sélection finale affichent « Cherry laurel », « wild cherry », « Cuckooflower »… (anglais).
- **Empreinte → Taxons observés** : même symptôme.
- **Bioacoustique** (copie 2 — `BioacousticSheet` / `SpeciesExplorer`) : les mêmes espèces sortent en français (« Pêcher », « Fleur de coucou », « Prunellier épineux »…).

### Vérification base
La table `species_translations` contient bien les noms FR pour toutes les espèces problématiques :

| scientific_name        | common_name_fr        |
|------------------------|-----------------------|
| Prunus laurocerasus    | Laurier-cerise        |
| Prunus avium           | Cerisier sauvage      |
| Cardamine pratensis    | Fleur de coucou       |
| Iris pseudacorus       | Iris faux-acore       |
| Pyrrhocoris apterus    | Punaise rouge du feu  |
| Aesculus hippocastanum | Marronnier d'Inde     |
| Cistus                 | Ciste                 |
| Medicago arabica       | Médecin tacheté       |
| Prunus persica         | Pêcher                |
| Prunus spinosa         | Prunellier épineux    |
| Rubus                  | Ronce                 |

La policy RLS `Anyone can view species translations` (PUBLIC, `qual: true`) autorise la lecture pour tous. La donnée est donc disponible.

### Cause racine
Les vues bioacoustique et L'œil/Empreinte utilisent toutes le hook `useSpeciesTranslationBatch`, mais :

1. **Bioacoustique** consomme `useBiodiversityData` (edge function `biodiversity-data`) qui livre déjà des `commonName` souvent en français via `taxon.preferred_common_name` d'iNaturalist, et la traduction n'a qu'un rôle d'appoint.
2. **Exploration (L'œil + Empreinte)** consomme `useExplorationSpeciesPool` qui agrège les `species_data` des **snapshots** stockés. Ces snapshots conservent le `commonName` tel qu'il a été collecté à l'origine (anglais pour beaucoup d'observations iNaturalist sans locale FR).
3. La résolution FR repose alors entièrement sur `useSpeciesTranslationBatch` côté composant. Or :
   - Le binding fonctionne dans `CuratedSpeciesCard` (`displayName = translation?.commonName || species.commonName`),
   - Mais le `translationMap` propagé depuis `OeilCuration` n'est pas hydraté au premier rendu, et la batch est invalidée à chaque variation du pool (sort de tableau dans la queryKey),
   - Et surtout, **pour les vues qui n'utilisent pas le batch (ex. la modale Détail, ou l'export PDF)**, on retombe sur le `commonName` brut anglais.

Bref, la résolution FR est faite « tard », au niveau de l'affichage, de manière non systématique.

### Stratégie retenue
Aligner la stratégie sur la bioacoustique : **résoudre le nom FR au plus près de la source**, dans le pool lui-même, pour que TOUS les composants en aval (cartes, modale, badges, exports) reçoivent un `commonName` déjà français.

## Plan

### 1. Nouveau hook partagé `useFrenchSpeciesNames`
`src/hooks/useFrenchSpeciesNames.ts` — utilitaire centralisé qui prend une liste `{scientificName, commonName?}` et renvoie une `Map<scientificName, frName>` :

- Requête unique `species_translations.in('scientific_name', names)` (RLS public, OK pour tout user).
- Pour les espèces sans `common_name_fr`, fallback vers `commonName` original puis `scientificName`.
- Cache React Query stable : queryKey basée sur la liste **dédupliquée + triée** sérialisée (string), `staleTime` 24h, `gcTime` 7j.
- Si `language === 'en'`, court-circuite et renvoie les noms originaux.

Cela remplace l'utilisation directe de `useSpeciesTranslationBatch` dans les vues exploration.

### 2. Enrichir `useExplorationSpeciesPool` pour livrer des noms FR
`src/hooks/useExplorationSpeciesPool.ts` :

- Conserver l'agrégation actuelle.
- Dans un `select` React Query (ou un hook composé `useExplorationSpeciesPoolFr`), enrichir chaque espèce avec son nom FR via `useFrenchSpeciesNames`.
- Ajouter deux champs : `displayName` (FR si dispo, sinon original) et `commonNameFr` (string|null) — sans casser le shape existant `ExplorationSpecies`.

Résultat : tous les consommateurs (L'œil, Empreinte → Taxons observés, modales, exports) reçoivent directement le bon nom.

### 3. Brancher `OeilCuration` sur les noms enrichis
`src/components/community/insights/curation/OeilCuration.tsx` :

- Supprimer le `useSpeciesTranslationBatch` local et le `translationMap` propagé.
- `CuratedSpeciesCard` reçoit déjà le bon `species.displayName` via le pool enrichi.
- `handleSpeciesClick` utilise `species.displayName` au lieu de calculer un `displayName` séparé.

### 4. Mettre à jour `CuratedSpeciesCard`
`src/components/community/insights/curation/CuratedSpeciesCard.tsx` :

- Retirer la prop `translation?` (ou la garder optionnelle pour compat).
- Calcul du `displayName` : `species.displayName || species.commonName || species.scientificName`.

### 5. Mettre à jour `Empreinte → Taxons observés`
`src/components/community/EventBiodiversityTab.tsx` (ligne 206 — transformation `species_data → BiodiversitySpecies[]`) :

- Au moment de la transformation, injecter le `commonName` FR via `useFrenchSpeciesNames` (alimenté par les `scientificName` extraits) avant de passer le tableau à `<SpeciesExplorer>`.
- `SpeciesExplorer` continue de fonctionner sans changement (la batch existante reste comme filet de sécurité, mais devient redondante — on peut la conserver pour éviter régression sur les autres écrans qui consomment `SpeciesExplorer`).

### 6. (Optionnel mais recommandé) Auto-enrichissement à la collecte
Pour éviter ce genre de cas à l'avenir, ajouter dans `supabase/functions/collect-event-biodiversity/index.ts` un appel à iNaturalist avec **`locale=fr`** sur le paramètre `?locale=fr` afin que `taxon.preferred_common_name` soit livré directement en français lorsque possible. Hors-scope si non souhaité — non bloquant pour la correction visible.

## Fichiers impactés

```text
NEW   src/hooks/useFrenchSpeciesNames.ts
EDIT  src/hooks/useExplorationSpeciesPool.ts          (ajout displayName/commonNameFr)
EDIT  src/components/community/insights/curation/OeilCuration.tsx
EDIT  src/components/community/insights/curation/CuratedSpeciesCard.tsx
EDIT  src/components/community/EventBiodiversityTab.tsx (ligne 206 — enrichissement avant SpeciesExplorer)
```

## Critères d'acceptation

- Dans **Apprendre → L'œil → Sélection finale / Suggestions IA / Pool observé**, les vignettes affichent les noms FR (« Laurier-cerise », « Cerisier sauvage », « Fleur de coucou »…).
- Dans **Empreinte → Taxons observés**, idem.
- Le nom latin reste affiché en italique sous le titre FR.
- La modale détail (clic sur vignette) hérite du même `displayName` FR.
- Aucune régression sur la vue bioacoustique (qui continue d'utiliser son propre flux).
