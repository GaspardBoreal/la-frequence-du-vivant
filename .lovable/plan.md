## Objectif

Dans la visionneuse plein écran d'une observation (`RevealPhotoLightbox`), l'image est aujourd'hui statique : `max-h-[72vh]` + `object-contain`, aucun gestionnaire de molette, de glisser ou de double-clic. Impossible donc d'agrandir un détail (ici le papillon sur le buddleia).

## Ce que je propose

Transformer la visionneuse en **table de loupe naturaliste** : l'image reste posée au centre, et le geste de zoom se fait comme sous une loupe de terrain.

### 1. Zoom molette centré sur le curseur
- Molette (ou pincement trackpad) = zoom continu de **1× à 8×**, ancré sur le point sous la souris — on grossit exactement le détail visé, pas le centre de l'image.
- Amortissement doux (pas de saut), curseur `zoom-in` / `grab` selon l'état.

### 2. Déplacement (pan) au glisser
- Dès que le zoom dépasse 1×, glisser à la souris (ou au doigt) déplace l'image, avec bornage pour ne jamais sortir du cadre.
- Le glisser n'active plus la navigation photo précédente/suivante tant qu'on est zoomé.

### 3. Gestes rapides
- **Double-clic / double-tap** : bascule 1× ↔ 2,5× sur le point cliqué, et retour à l'ajusté.
- **Échap** : si zoomé, remet à 1× ; sinon ferme la visionneuse (comportement actuel préservé).
- **+ / −** au clavier et **0** pour réinitialiser.

### 4. Barre loupe discrète
Petit bandeau flottant en bas à droite de l'image, dans le même registre visuel que la barre GPS (fond `ds-forest-deep` opaque, filet doré) :
`−  [ ●———— ]  +   1,0×   ⟲ Ajuster   ⤢ Plein écran`
- Le curseur reflète et pilote le zoom.
- « Ajuster » remet l'image à sa taille d'origine.
- « Plein écran » agrandit la zone image (masque temporairement la légende) pour donner toute la hauteur au cliché.

### 5. Qualité de l'image source
Le zoom ne sert à rien si la source est une vignette. À l'ouverture de la visionneuse, la meilleure résolution disponible est demandée :
- photos iNaturalist : substitution du suffixe `square`/`small`/`medium` par `large` puis `original`, avec repli automatique si le fichier haute résolution n'existe pas ;
- photos marcheurs : l'original du storage plutôt que la variante affichée sur la carte.
Un discret indicateur « chargement haute définition… » pendant la bascule, puis l'affichage passe sur la version nette.

### 6. Réinitialisation au changement de photo
Passer à l'observation suivante (← →) remet le zoom à 1× et recentre, pour ne pas hériter d'un cadrage étranger.

## Détails techniques

- Nouveau hook `src/hooks/useImageZoomPan.ts` : état `{ scale, tx, ty }`, handlers `onWheel` (avec `passive:false`), `onPointerDown/Move/Up`, `zoomAt(point, factor)`, `reset()`, bornage des translations sur les dimensions réelles rendues.
- `RevealPhotoLightbox.tsx` : conteneur `overflow-hidden` avec `transform: translate(tx,ty) scale(s)` et `transform-origin: center`, `touch-action: none`, `will-change: transform`. Le clic sur le fond ferme toujours, le clic sur l'image ne ferme plus.
- Nouveau composant `ZoomBar.tsx` (barre loupe) à côté de `InlineGpsBar` pour l'homogénéité visuelle.
- Petit utilitaire `hiResPhotoUrl(url)` dans `src/utils/photoUtils.ts` pour la montée en résolution iNaturalist, avec `onError` de repli.
- Aucun changement de données : purement présentation/interaction, la même visionneuse est utilisée par l'Atelier, la Carte des révélations et les espèces écartées, donc le bénéfice est immédiat partout.
