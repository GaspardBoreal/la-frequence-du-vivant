## Objectif

Remplacer l'actuel badge emoji `📸3` par une **pastille « Carnet photo » dessinée**, présente sur tout ouvrage possédant des photos (points **et** polygones/lignes), et ouvrir au clic une **visionneuse galerie** : grande photo en haut, rail de vignettes en bas, navigation précédent / suivant.

## 1. L'icône (le « wahou »)

Nouvelle pastille SVG (composant + générateur de `divIcon` Leaflet) dans `src/components/propriete/palette/studio/photos/PhotoPastille.tsx` :

- Forme de **polaroïd incliné** (~-8°) crème sur liseré or (`--ds-gold`), fond `--ds-forest-deep`, ombre douce.
- Petit **compteur** en pastille or en angle (1, 2, … 9+).
- **Micro-vignette** de la 1re photo en fond du polaroïd quand la miniature est déjà chargée (sinon glyphe appareil photo tracé au trait).
- Animations : apparition `scale`+fondu, pulsation lente très discrète, `hover` = redressement à 0° + léger agrandissement, `focus-visible` = anneau or (accessibilité clavier).
- `aria-label` : « Carnet photo · {nom de l'ouvrage} · {n} photos ».

Placement :
- **Points** : ancrée en haut-droite du glyphe existant (remplace le badge emoji).
- **Polygones / lignes** : nouveau `Marker` au centroïde (ou point médian pour une ligne), affiché uniquement si l'ouvrage a des photos, dans le pane studio existant.

La même pastille est réutilisée en petit format dans `OuvragesRegister` (registre Emplacements & ouvrages) pour ouvrir la même galerie.

## 2. Le clic → visionneuse galerie

Le clic sur la pastille **n'ouvre plus l'inspecteur** : il ouvre directement la galerie de cet ouvrage (`stopPropagation` sur le clic Leaflet).

Évolution de `OuvragePhotoViewer.tsx` (composant déjà en place, on l'enrichit plutôt que d'en créer un second) :

- **Grande photo** : inchangée, avec la loupe de terrain existante (molette, glisser, double-clic, `+ / - / 0`).
- **Rail de vignettes** ajouté en bas : miniatures carrées, la courante entourée d'or et mise à l'échelle, défilement horizontal auto-centré sur la photo active, clic = saut direct.
- **Précédent / suivant** : flèches latérales existantes + flèches clavier + **swipe tactile** (mobile).
- Bandeau conservé : titre de l'ouvrage, saison, date, `n/total`, légende sous l'image.
- Le rail et le bandeau se masquent en mode « Plein cadre » (comportement `expanded` déjà présent).

## 3. Câblage

- `PaletteStudio.tsx` : nouvel état `galleryObjetId`; passe `onOpenPhotos(objetId)` à `ObjectsLayer` et au registre; rend `OuvragePhotoViewer` avec les photos de `objetPhotos.byObjet`.
- `ObjectsLayer.tsx` : props `photoThumbs?: Record<string, string>` et `onOpenPhotos?`; rendu des pastilles points + centroïdes.
- Aucune modification base de données : on réutilise `propriete_objet_photos` et le hook `useObjetPhotos`.

## Détails techniques

- Centroïde polygone : moyenne pondérée des sommets déjà disponible via les helpers de `src/lib/geomTransform.ts`.
- Pastille rendue en `L.divIcon` (HTML + CSS animé) pour rester légère; styles ajoutés dans `src/index.css` sous `.ds-photo-pastille` (tokens sémantiques uniquement, pas de couleurs en dur).
- Rail de vignettes : URLs signées déjà fournies par `useObjetPhotos`, `scrollIntoView({ inline: 'center' })` sur changement d'index.
- Correctif au passage : erreur runtime `_leaflet_pos` (marqueur retiré pendant une animation) — garde sur le démontage des marqueurs pastille.
