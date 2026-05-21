## Problème

Dans Synthèse → Taxons observés, quand on clique sur une espèce, la vue zoome automatiquement dessus. Or les contrôles `+ / % / − / Agrandir` sont empilés verticalement au centre-droit (`top-1/2 -translate-y-1/2 right-2`) et viennent recouvrir l'espèce zoomée — exactement ce que montre la copie d'écran (le `+ 100%` masque la zone centrale droite).

## Solution

Séparer le bloc unique en **deux groupes**, ancrés en haut, hors de la zone d'intérêt :

- **Haut-gauche** (`top-2 left-2`) : bouton **Agrandir / Vue d'ensemble** (`Maximize2`) + indicateur **%** cliquable (reset). Visible uniquement quand `zoom > 1.05`, sinon discret/absent pour ne pas polluer la vue par défaut.
- **Haut-droite** (`top-2 right-2`) : contrôles **+ / −** (zoom avant / arrière), groupés horizontalement.

Style conservé : `bg-background/80 backdrop-blur rounded-full border border-border shadow-sm z-10`, mêmes icônes, mêmes handlers (`setZoomAt`, `reset`), mêmes états disabled.

## Fichier impacté

Un seul fichier, purement présentation :

- `src/components/community/synthese/trophic/ZoomableSvgStage.tsx` — remplacer le bloc `<div className="absolute top-1/2 -translate-y-1/2 right-2 ...">` par deux blocs `absolute` positionnés en haut-gauche et haut-droite. Aucune logique de zoom/pan/pinch/wheel modifiée.

## Vérification

Sur les trois vues (Réseau, Constellation, Spirale) :
- Au repos : seuls `+` et `−` visibles en haut-droite, rien en haut-gauche (l'indicateur % + Agrandir n'apparaissent qu'une fois zoomé).
- Après clic sur une espèce + zoom : l'espèce reste centrée et **aucun contrôle ne la recouvre**.
- Le bouton `%` reste cliquable pour reset, `Agrandir` ramène à 100%.
