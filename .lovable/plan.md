
Objectif: corriger le vrai bug visible sur `/marches-du-vivant/mon-espace/exploration/607a0ae3-f843-42e8-a29b-1ec422957e9f`, de façon robuste dans toutes les vues qui utilisent ce moteur de filtres.

Constat rigoureux
- Le problème affiché à l’écran n’est pas l’onglet `Marcheurs`.
- Le `Tous (0)` visible est le filtre contributeurs de `SpeciesExplorer`, rendu dans `Empreinte > Taxons observés`.
- La fonction SQL `get_exploration_participants` et le hook `useExplorationParticipants` concernent l’onglet `Marcheurs`, pas ce sélecteur.
- Dans la base, les snapshots de cette exploration contiennent bien des attributions:
  - contributeurs distincts détectés: `2`
  - noms trouvés: `Chantal Brillet`, `Gaspard Boréal`
- Donc le bug est côté transformation frontend, pas côté données source.

Cause racine
- `SpeciesExplorer.tsx` calcule `totalContributors` uniquement depuis `species[].attributions`.
- Dans `src/components/community/EventBiodiversityTab.tsx`, la liste `allSpeciesAsBiodiversity` est reconstruite depuis `snapshot.species_data`.
- Mais chaque espèce est créée avec `attributions: []`.
- Résultat:
  - `SpeciesExplorer` reçoit bien 21 espèces
  - mais 0 attribution sur chacune
  - donc le filtre affiche `Tous (0)` et aucune option contributrice
- Ce bug est structurel: toute vue qui reconstruit des `BiodiversitySpecies` sans recopier `attributions` cassera ce filtre.

Correction proposée
1. Corriger `EventBiodiversityTab.tsx`
- Lors de l’agrégation de `species_data`, recopier et fusionner les `attributions` de chaque espèce.
- Dédupliquer proprement les attributions par combinaison stable, par exemple:
  - `observerName`
  - `source`
  - `originalUrl`
  - `date`
- Conserver aussi les autres champs utiles déjà fournis (`observerInstitution`, `locationName`, `exactLatitude`, etc.).

2. Rendre l’agrégation robuste
- Quand une même espèce apparaît sur plusieurs marches, agréger:
  - `observations`
  - `photos`
  - `attributions`
- Ne pas écraser les anciennes attributions lors d’un merge.
- Garder la clé espèce cohérente avec le reste du projet:
  - priorité `scientificName`
  - fallback `commonName` / `id` seulement si nécessaire

3. Durcir `SpeciesExplorer.tsx`
- Ignorer les attributions vides ou invalides.
- Calculer les contributeurs uniques sur base normalisée:
  - trim
  - fallback `Anonyme` seulement si aucun nom
- Éviter les doublons inter-sources si même nom répété plusieurs fois pour une espèce.
- Ainsi, même si une vue fournit des attributions partielles, le compteur reste fiable.

4. Vérifier toutes les vues qui utilisent `SpeciesExplorer`
- `src/components/community/EventBiodiversityTab.tsx`
- `src/components/community/MarcheDetailModal.tsx`
- `src/components/open-data/BioDivSubSection.tsx`
- Les deux dernières consomment déjà `biodiversityData.species` issu de l’edge function, donc elles devraient rester correctes.
- Le correctif principal est donc sur la vue Empreinte, plus un durcissement générique dans `SpeciesExplorer`.

Résultat attendu
- Sur cette exploration, le filtre contributeurs affichera au minimum `Tous (2)`.
- Les options incluront les contributeurs réellement présents dans les snapshots.
- Le comportement restera cohérent entre:
  - Empreinte > Taxons observés
  - détail d’une marche
  - vues open-data utilisant `SpeciesExplorer`

Détail technique
```text
biodiversity_snapshots.species_data
  -> EventBiodiversityTab(allSpeciesAsBiodiversity)
      AVANT: attributions = []
      APRÈS: fusion + déduplication des attributions
  -> SpeciesExplorer
      totalContributors = unique(species.attributions.observerName)
```

Fichiers à modifier
- `src/components/community/EventBiodiversityTab.tsx`
- `src/components/biodiversity/SpeciesExplorer.tsx`

Points de vigilance
- Ne pas réutiliser le fix RPC participants pour ce bug: ce serait corriger la mauvaise couche.
- Ne pas compter plusieurs fois le même contributeur juste parce qu’il a plusieurs observations sur une même espèce.
- Ne pas casser les vues où `SpeciesExplorer` reçoit déjà des attributions valides.
