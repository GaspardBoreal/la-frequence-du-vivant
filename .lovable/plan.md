## Diagnostic

Dans `useExplorationCitizenContributors.ts`, `obsCount` est incrémenté à chaque attribution iNat trouvée dans les `species_data` des `biodiversity_snapshots` rattachés aux marches de l'exploration. Or ces snapshots contiennent **toutes les observations iNat dans le rayon de recherche autour du point de la marche**, pas uniquement les obs faites pendant/sur la marche. D'où le 123 trompeur.

À l'inverse, le **nombre d'espèces** reste pertinent : c'est bien la diversité de taxons que ces contributeurs ont rapportée sur la zone — une métrique éditoriale juste, alignée avec le reste de l'app (Sobriété Informationnelle).

## Correction

### 1. `useExplorationCitizenContributors.ts`
- Conserver les `species: Set<string>` par contributeur (déjà là).
- Ajouter en sortie de la query un champ agrégé :
  ```ts
  return {
    contributors: CitizenContributor[],
    totalUniqueSpecies: number, // union des scientificNames de tous les contributeurs
  }
  ```
- `totalUniqueSpecies` = taille de l'union des `species` Sets (dédup stricte par `scientificName`).
- Garder `speciesCount` et `obsCount` par contributeur (utiles dans le panneau déplié pour qualifier chaque personne), mais on ne les sommera plus dans la phrase de tête.

### 2. `CitizenContributorsAggregateRow.tsx`
- Remplacer la signature : `{ contributors, totalUniqueSpecies }`.
- Ligne principale (titre) inchangée : `+N contributeur·s citoyen·s iNaturalist`.
- Sous-ligne corrigée :
  ```
  {totalUniqueSpecies} espèce{s} observée{s} par d'autres contributeurs citoyens
  ```
- Supprimer la somme `totalObs`.
- Dans le panneau déplié (par contributeur), garder `X espèces` mais retirer `· Y obs` (même raison : Y est gonflé par le rayon iNat). On garde ainsi une seule métrique cohérente partout : les espèces.

### 3. `MarcheursTab.tsx`
- Adapter au nouveau shape de retour du hook (`data.contributors`, `data.totalUniqueSpecies`) et passer les deux en props au composant.

## Hors scope
- Pas de changement DB, pas de refonte des snapshots, pas de recalcul côté edge function.
- Pas de modification de la logique de score Fréquence ni des cartes marcheurs LMDV.

## Fichiers touchés
- `src/hooks/useExplorationCitizenContributors.ts` (modif)
- `src/components/community/exploration/CitizenContributorsAggregateRow.tsx` (modif)
- `src/components/community/exploration/MarcheursTab.tsx` (modif minime, signature props)
