## Constat

Le carré d'édition (nom / calque / emplacement / intention / couleur) est l'`ObjectInspector` de l'Atelier. Il est positionné en `absolute right-3 top-3` dans `PaletteStudio.tsx`, exactement à la même hauteur que le bandeau **Géo / Sat / Relief / Cadastre** (`MapStyleToggle`, positionné `absolute top-4 right-4`). Les deux se chevauchent donc systématiquement en haut à droite de la carte.

La barre « Transformer » avait déjà été décalée manuellement (`pt-[4.25rem]`) : la valeur est aujourd'hui recopiée à la main, sans règle commune.

## Solution proposée

### 1. Une règle unique pour le « chrome » de carte
Créer un petit module partagé (`src/components/maps/mapChrome.ts`) exportant les offsets standard :
- `MAP_CHROME_TOP` = hauteur du bandeau de fonds + marge (`top-[4.5rem] sm:top-[4.75rem]`)
- `MAP_CHROME_TOP_PADDING` pour les conteneurs centrés (remplace le `pt-[4.25rem]` en dur de `ZoneTransformBar`)

Ainsi tout panneau flottant se cale au même endroit, et un futur changement de hauteur du bandeau se répercute partout.

### 2. Inspecteur redesigné en « carte docker » sous le bandeau
Dans `PaletteStudio.tsx` et `ObjectInspector.tsx` :
- Ancrage : colonne droite, **sous** le bandeau, aligné sur la même marge droite que lui (`right-4`) pour créer une vraie colonne visuelle plutôt qu'un flottement approximatif.
- Hauteur bornée : `max-height` calculée sur la hauteur de la carte, corps scrollable, en-tête (icône outil + mesure + fermer) **sticky** — plus de panneau qui déborde sur le curseur temporel en bas.
- Entrée animée discrète : léger fondu + glissement depuis la droite (respecte `prefers-reduced-motion`).
- Liseré de couleur de l'outil sur le bord gauche du panneau, pour relier visuellement le panneau à l'objet sélectionné sur la carte.
- Tokens du design system uniquement (`--ds-cream`, `--ds-line`, `--ds-forest-deep`), cohérents avec le panneau Calques.

### 3. Anti-collision avec le mode Transformer
Quand la barre « Transformer » est active, l'inspecteur descend d'un cran supplémentaire (offset conditionnel), pour que les deux panneaux ne se croisent jamais sur écran étroit.

### 4. Mobile
En dessous de `sm`, l'inspecteur passe en feuille basse (bandeau ancré en bas, pleine largeur, coins arrondis haut) : sur petit écran, la colonne droite masque la moitié de la carte.

## Fichiers concernés
- `src/components/maps/mapChrome.ts` (nouveau) — constantes d'offset partagées
- `src/components/propriete/palette/studio/PaletteStudio.tsx` — ancrage de l'inspecteur
- `src/components/propriete/palette/studio/ObjectInspector.tsx` — en-tête sticky, corps scrollable, liseré, animation
- `src/components/propriete/palette/ZoneTransformBar.tsx` — utilise la constante partagée au lieu du padding en dur

Aucun changement de logique métier : positionnement et présentation uniquement.
