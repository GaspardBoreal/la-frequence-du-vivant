# Correction impression Portrait — cause + refonte design

## Diagnostic (confirmé par la lecture de `TabPortrait.tsx`, `PortraitPrintLayout.tsx`, `src/index.css` l.1042-1130)

La page imprimée est vide/noire parce que la règle d'isolation d'impression est cassée :

```css
body.portrait-printing > *:not(.portrait-print-root-wrapper) { display: none !important; }
```

- Elle cible les **enfants directs de `body`** avec la classe `portrait-print-root-wrapper`.
- Or `<PortraitPrintLayout>` est rendu profondément à l'intérieur de l'arbre React (`<div className="portrait-print-only">` dans `TabPortrait`), donc son ancêtre direct-du-body (le root React) est masqué → tout le contenu disparaît, y compris le cahier. Le rectangle noir visible sur ta capture, c'est le `<body>` avec le fond sombre du thème et plus rien dedans.
- Conséquence : pas de titre, pas de date, pas de photos.

## Correctif technique

1. **Portail dédié au body pendant l'impression** : rendre `PortraitPrintLayout` via `createPortal` dans un `<div id="portrait-print-portal">` monté sur `document.body` uniquement pendant `printMode`. Ainsi l'isolation `body > *:not(#portrait-print-portal) { display:none }` fonctionne réellement.
2. **Attendre le chargement des images** avant `window.print()` : `Promise.all(imgs.map(img => img.complete ? … : new Promise(r => img.onload = r)))` pour éviter les pages vides côté navigateur.
3. **Forcer fond blanc et couleurs fidèles** : `@page { size: A4; margin: 0; background: white }` + `html, body { background: #fff !important }` + `-webkit-print-color-adjust: exact; print-color-adjust: exact` sur `.portrait-print-root` et enfants.
4. **`img { break-inside: avoid }`** + `crossOrigin="anonymous"` (sinon Chrome peut refuser d'imprimer des images cross-origin sombres).
5. **Nettoyer** l'ancienne règle `.portrait-print-root-wrapper` obsolète.

## Refonte design du cahier (créative & inspirante)

Objectif : un cahier qui ressemble à un **carnet d'atelier paysagiste**, sobre, mémorable, imprimable en A4 couleur ou N&B.

- **Couverture éditoriale** (page 1)
  - Bandeau sépia clair, filet à l'or fin (`#B08D57`) en haut et en bas.
  - Surtitre `PORTRAIT DU SITE` en petites capitales espacées.
  - Titre `{proprieteNom}` en serif large (Cormorant/Playfair fallback système : `'Cormorant Garamond', 'Playfair Display', Georgia, serif`).
  - Sous-titre lieu + ville, filet fin.
  - **Cachet circulaire daté** en bas-droite (SVG concentrique « Édité le … · N photographies · N contributeurs »).
  - Pas de fond sombre, papier crème `#FBF7EE`.

- **Page 2 — Sommaire visuel**
  - Grille miniature 4×3 de toutes les photos numérotées (01 → N), avec renvoi de page. Permet à un professionnel de repérer d'un coup d'œil la matière.

- **Pages photo (nouveau rythme éditorial)**
  - **Planche « pleine page »** : image au bord perdu haut, cartouche typographique en bas (numéro géant `01` en outline serif + auteur + date + lieu si présent).
  - Alternance **planche « double »** : 1 grande photo à gauche + 3 petites en colonne à droite (règle des tiers, respire).
  - Toutes les 6 pages, une **page de respiration** : citation courte + filet + numéro de page, sur papier crème.

- **Colophon final**
  - Liste des contributeurs (petites capitales), période couverte (date min → max des photos), nombre de marches liées.
  - Signature `Marches du Vivant · La Fréquence du Vivant` + pastille or.
  - QR code (généré via lib déjà utilisée dans Studio Fonds d'Écran) renvoyant vers l'URL publique de la propriété.

- **Pieds de page** discrets à partir de la page 2 : nom de la propriété à gauche, `— {page}/{total} —` centré à l'or fin.

## Fichiers modifiés

- `src/components/propriete/portrait/TabPortrait.tsx` : portail body + attente `image.decode()` avant `window.print()`.
- `src/components/propriete/portrait/PortraitPrintLayout.tsx` : nouvelle structure (couverture, sommaire, planches alternées, pages de respiration, colophon avec QR).
- `src/index.css` (bloc `@media print`) : nouvelle isolation via `#portrait-print-portal`, `@page`, typographie serif, cartouches, filets or, pieds de page, `print-color-adjust: exact`.
- Réutilisation de `qrcode` (déjà présent pour les fonds d'écran).

## Vérification

Après build, ouvrir `/propriete/jardin-monde-deviat` → onglet Portrait → bouton Imprimer → aperçu Chrome doit afficher la couverture crème avec titre, cachet daté, puis les planches photo.
