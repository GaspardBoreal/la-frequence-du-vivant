# Photos nettes dans « Chasse aux détails »

## Cause de la pixellisation

Le jeu `ZoomDetailGame` applique `transform: scale(2.4 → 3.6)` sur une `<img>` rendue par `GameCardImage`. La source servie est la vignette utilisée partout ailleurs (iNat `medium.`/`square.` ≈ 250–500 px, ou photo Supabase non transformée). À 3× zoom CSS, on étire une image de 300 px sur ~900 px → flou et pixellisation visibles sur les captures fournies.

Les autres jeux (Memory, Qui suis-je) n'ont pas ce problème car ils n'agrandissent pas la source au-delà de sa taille naturelle.

## Principe de la correction

1) **Charger une source haute résolution dédiée au crop détail** (≈ 1600 px), différente de la vignette de listing.
2) **Remplacer le `transform: scale()` par un crop CSS `background-image` + `background-size`/`background-position`** : on n'étire plus une image décodée, on demande au navigateur d'afficher une portion d'une image plus grande, ce qui reste net même à 4× équivalent.
3) **Fallback gracieux** quand seule une mini-vignette existe : on garde le scale CSS mais avec `image-rendering: auto` + un léger flou artistique + bandeau « photo basse résolution » plutôt que pixels nus.

Cela règle uniquement la qualité d'affichage : aucun changement de logique de jeu, de scoring, de lightbox zoom, ni de sources de données.

## Travaux

### 1. `src/components/biodiversity/discover/modes/games/zoomImageSrc.ts`
Ajouter une fonction sœur `highResDetailSrc(url, target = 1600)` :
- iNat (`static.inaturalist.org` / `inaturalist-open-data`) : remplacer `square.` / `small.` / `medium.` / `thumb.` → `large.` (≈ 1024 px, suffisant pour un crop ~33 % à 600 px d'affichage). Ne pas viser `original.` (déjà bridé ailleurs pour OOM).
- Supabase Storage : injecter `?width=1600&quality=85` si absent (idem `safeZoomSrc` mais qualité un peu plus haute).
- Autres CDN / data-URL : URL inchangée.
- Exporte aussi un helper `isLikelyLowRes(url)` (heuristique sur `square|thumb|small`/dimensions connues) pour activer le mode dégradé.

### 2. Nouveau composant `DetailCropImage.tsx` (dans `games/`)
Composant dédié au crop « détail » :
- Props : `url`, `cx`, `cy`, `zoom`, `alt`, `className`.
- Précharge la HR via `new Image()` ; tant qu'elle n'est pas prête, affiche la vignette `url` floutée (`backdrop-blur` léger + `filter: blur(6px)`) pour un effet « focus en train de se faire » au lieu de pixels.
- Quand la HR est prête : rend une `<div>` en `background-image: url(HR)`, `background-size: ${zoom*100}%`, `background-position: ${cx}% ${cy}%`, `background-repeat: no-repeat`, `image-rendering: auto`. Cadrage strictement équivalent au calcul actuel `transform: scale(zoom) origin(cx,cy)`.
- Si la HR échoue → fallback `<img>` actuel avec `transform: scale`, plus filtre `contrast(1.05) saturate(1.05)` doux et badge discret « détail recadré » en bas droite (manuscrit Caveat) pour assumer le rendu.

### 3. `ZoomDetailGame.tsx`
- Récupérer l'URL via `photoUrl(target, photoBy)` (déjà fait pour la lightbox) et passer à `DetailCropImage` au lieu de `GameCardImage` pour la vignette de gauche.
- Si pas d'URL du tout : conserver `GameCardImage` (picto règne) → état déjà géré pour Memory.
- Dans la `ZoomLightbox` (bloc `renderImage`), utiliser la même HR (`highResDetailSrc(url)`) pour le rendu cadré pré-réponse, afin que la loupe ne re-pixellise pas.

### 4. Détails design (cohérence carnet manuscrit)
- Coins arrondis et ombre `[6px_6px_0_rgba(59,42,26,0.15)]` conservés.
- Légère vignette interne via `box-shadow inset` (radial assombri ~8 %) pour donner une impression « lentille de loupe » et masquer les artefacts de bord du crop.
- Transition CSS `background-position 600ms cubic-bezier(.2,.7,.2,1)` entre rounds → l'œil suit le déplacement du cadre comme un travelling.

## Hors périmètre (sciemment)

- Pas de modification de `species_thumb_cache` ni d'edge function : la HR iNat `large.` est déjà disponible publiquement à partir de la même base d'URL, donc pas d'aller-retour serveur.
- Pas de changement des autres jeux : leur source actuelle est suffisante car non zoomée.
- Pas de touche à la `ZoomLightbox` au-delà de la HR transmise.

## Vérification

- Charger une marche papillons → Découvrir → Enfant → Chasse aux détails : les détails doivent rester nets pendant et après l'animation de cadrage, sur photos iNat et photos marcheurs.
- Forcer un cas vignette `square.` uniquement (espèce sans `large.` joignable) : vérifier l'apparition du badge « détail recadré » + flou artistique, pas de pixels crus.
- Loupe (zoom lightbox) : l'image pré-réponse reste cadrée détail mais nette ; après réponse, image entière nette (comportement actuel inchangé).
