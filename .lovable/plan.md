## Objectifs

1. **Plein écran** pour la carte des prélèvements (J'analyse · Étape 2), à l'identique de Portrait › Cadastre.
2. **Corriger le bug D/E** : les pastilles ajoutées via le bouton latéral « + Ajouter un prélèvement » n'ont pas de coordonnées, donc n'apparaissent jamais sur la carte.

## Diagnostic du bug D/E (vérifié dans le code)

- `usePropertySoil.addSample` crée un nouveau `SoilSample` sans `lat`/`lng`.
- Le seeding de coordonnées dans `SamplesMapBlock` (`seedSampleCoords`) :
  - a une garde `hasAnyCoord` qui retourne tel quel dès qu'**au moins un** échantillon a des coordonnées ;
  - n'est déclenché que quand le centroïde change, pas quand `samples.length` change.
- Conséquence : dès que A/B/C sont posés, D et E créés par le bouton restent sans coordonnées et ne sont donc pas rendus sur la carte (rendu conditionnel `s.lat != null && s.lng != null`).
- L'ajout par clic carte fonctionne car `handleAdd` patch les coordonnées immédiatement.

## Corrections

### Bug D/E (`SamplesMapBlock.tsx`)
- Remplacer `hasAnyCoord` par un seeding **par échantillon** : pour chaque sample sans `lat`/`lng`, poser un point autour du centroïde de la propriété (ou du centre carte) selon un motif en pentagone (5 positions déjà définies, indexées par la position du sample).
- Redéclencher le seeding sur `samples.length` (nouvel ajout) en plus du changement de centre.
- Petit offset (~5 m) si la position calculée est identique à une pastille existante, pour éviter la superposition D/E sur A/B/C.

### Plein écran
- Ajouter un état local `fullscreen` dans `SamplesMapBlock`.
- Bouton `Maximize2` en haut-**gauche** de la carte (comme Portrait › Cadastre, au-dessus des contrôles Géo/Sat/Relief/Cadastre qui sont en haut-droite).
- En mode plein écran : `createPortal(document.body)` + overlay `fixed inset-0 z-[2000]` avec `framer-motion` (fade), fond crème du design system.
- Layout plein écran :
  - En-tête compacte : titre « Étape 2 · Prélèvements », compteur `n/5`, bouton fermer.
  - Zone principale : la carte pleine hauteur.
  - Colonne latérale droite (largeur ~360 px, scrollable) : liste des pastilles A→E avec inputs d'emplacement et bouton « + Ajouter un prélèvement », identique à la vue normale.
  - Sur mobile (`< md`), la colonne devient un tiroir bas rétractable pour ne pas masquer la carte.
- `Esc` ferme le plein écran ; lock du scroll du body pendant l'ouverture.
- Aucune modification des hooks ni de la sauvegarde : la même instance d'état `samples` alimente les deux vues (normale et plein écran).

## Détails techniques

- Fichier unique modifié : `src/components/propriete/analyze/blocks/SamplesMapBlock.tsx`.
- Extraction interne d'un sous-composant `SamplesMapView` (carte + panneau) monté soit en inline soit en portail plein écran, pour ne pas dupliquer JSX.
- Réutilise `RichMap` avec les mêmes props (`controls`, `initialStyle="cadastre"`, `maxZoom={22}`).
- Aucune migration DB, aucune logique métier modifiée.