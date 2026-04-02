
Objectif: corriger proprement le problème encore visible sur la mini-carte du détail espèce, sans toucher au reste du design ni aux autres vues.

Constat rigoureux
- Le calcul de base des observations dans la mini-carte est maintenant bon dans `SpeciesMiniMap.tsx`:
  - les ids observés viennent bien de `marches`
  - le compteur affiché vient de `observedMarcheMap`
- Le problème restant visible sur la copie 1 est surtout un problème d’affichage/overlay, pas seulement de donnée.
- Le replay montre aussi un comportement anormal possible sur des points très proches:
  - même position GPS pour certaines marches de l’événement
  - coexistence ou superposition de tooltips
  - zoom controls pouvant recouvrir les infobulles car ils partagent un niveau de pile visuelle proche

Cause probable
1. La carte mini utilise `fitBounds(..., { padding: [30, 30] })` alors que la vue Carte principale utilise une logique plus généreuse (`[40, 40]`) et des contrôles custom hors de la zone active.
2. Les contrôles `+ / -` de Leaflet sont dans le flux standard de la map et peuvent encore concurrencer les tooltips visuellement.
3. Le conteneur de la mini-carte est en `overflow-hidden`, donc même avec `direction="auto"`, une infobulle proche d’un bord ou d’un contrôle reste fragile.
4. Certaines marches ont les mêmes coordonnées, donc deux marqueurs peuvent se superposer; cela peut produire une lecture confuse si on n’ajuste pas légèrement le rendu.

Correction proposée
1. Reprendre le comportement de cadrage de la vue Carte
- Fichier: `src/components/biodiversity/species-modal/SpeciesMiniMap.tsx`
- Remplacer le `FitBounds` actuel par une version plus robuste:
  - padding plus généreux
  - padding asymétrique pour réserver de l’espace du côté des contrôles
  - `maxZoom` aligné avec la vue carte
- Exemple d’intention:
  - si plusieurs points: `fitBounds(bounds, { paddingTopLeft: [24, 24], paddingBottomRight: [72, 24], maxZoom: 13 })`
  - si un seul point: `setView(..., 12 ou 13)` pour garder un zoom lisible

2. Sortir les contrôles zoom du stacking Leaflet standard
- Dans `SpeciesMiniMap.tsx`
- Désactiver `zoomControl={true}`
- Ajouter un petit composant `ZoomControls` similaire à celui de `ExplorationCarteTab.tsx`
- Le positionner en overlay maîtrisé dans un coin qui gêne le moins
- Avantage:
  - contrôle exact du `z-index`
  - possibilité de garantir que les tooltips passent toujours au-dessus
  - rendu plus élégant et cohérent avec la vue Carte

3. Garantir la priorité visuelle des infobulles
- Toujours dans `SpeciesMiniMap.tsx`
- Renforcer le layering CSS:
  - `.leaflet-tooltip-pane` au-dessus des contrôles custom
  - contrôles à un `z-index` volontairement inférieur
- Éviter l’égalité de z-index entre tooltip et zoom controls
- Conserver `direction="auto"` et `overflow: visible`

4. Gérer élégamment les points superposés
- Même fichier
- Ajouter un léger décalage visuel seulement quand plusieurs marches partagent exactement les mêmes coordonnées
- Approche simple et robuste:
  - calculer les groupes de coordonnées identiques
  - appliquer un micro-offset circulaire par index dans le groupe
- Effet:
  - les 2 marches à la même position restent visibles
  - les tooltips ne semblent plus “fusionner”
  - aucun impact sur les données

5. Vérifier la cohérence des comptages sur toutes les vues concernées
- Ne pas changer la logique globale si elle est déjà cohérente
- Vérifier seulement les points d’entrée liés à ce modal:
  - `SpeciesExplorer.tsx` transmet bien `selectedSpecies.observations`
  - `SpeciesGalleryDetailModal.tsx` affiche `species.count`
  - `useSpeciesMarches.ts` somme bien `sp.observations`
  - `SpeciesMiniMap.tsx` lit bien `observedMarcheMap`
- Donc correction ciblée: affichage/cadrage/superposition, sans retoucher les autres agrégations

Fichiers à modifier
- `src/components/biodiversity/species-modal/SpeciesMiniMap.tsx`

Ce que je ne modifierai pas
- pas de changement sur le design global du modal
- pas de changement sur les compteurs Synthèse / Taxons si aucune incohérence supplémentaire n’est trouvée
- pas de refonte du composant parent
- pas de modification des autres vues hors mini-carte

Résultat attendu
- les infobulles restent toujours lisibles et au-dessus des boutons zoom
- le cadrage de la mini-carte montre correctement l’ensemble des points, comme dans l’onglet Carte
- les marches aux coordonnées identiques deviennent lisibles individuellement
- les nombres d’observations restent cohérents entre Empreinte, fiche détail, liste des marches et carte

Détail technique
```text
SpeciesGalleryDetailModal
  -> SpeciesMiniMap(marches, allEventMarches)
      -> observedMarcheMap from marches
      -> fitBounds with reserved space
      -> custom zoom controls
      -> tooltip pane above controls
      -> optional micro-offset for identical coordinates
```
