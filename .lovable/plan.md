# Logo horizontal en haut de la page Sauniers

Remplacer la pastille actuelle (petite empreinte + « LES MARCHES DU VIVANT » en texte mono) en haut
de `/saunier` par le lock-up horizontal joint : empreinte en feuillage à gauche, wordmark serif
« LES MARCHES DU VIVANT » à droite.

## Point d'attention contraste

Le fichier joint est encré en vert olive foncé sur fond transparent. Le hero de la page est un fond
Forêt Émeraude sombre : posé tel quel, le wordmark serait presque invisible. Le logo sera donc
décliné en version claire (empreinte vert clair, wordmark crème `#F5F2E8`) à partir du fichier
fourni, sans rien changer au dessin ni à la composition. Le fichier d'origine est également conservé
comme variante « fond clair » pour les usages documents/PDF.

## Ce que verra le visiteur

En haut du hero, à la place de la pastille arrondie : le lock-up horizontal seul, aligné à gauche,
largeur maîtrisée (environ 260 px sur mobile, 320 px à partir de `sm`), hauteur automatique, avec
une respiration verticale identique à l'actuelle pour ne pas décaler le reste du hero. Pas de cadre,
pas de bordure — le logo respire sur le dégradé. Le reste de la page (eyebrow « Proposition ·
Coopérative des Sauniers », titre Crimson, CTA) est inchangé.

## Détails techniques

- Upload du fichier joint via `lovable-assets`, pointeur
  `src/assets/brand/marches-du-vivant/logo-lockup-horizontal.png.asset.json` ; déclinaison claire
  générée par édition d'image (recoloration seule) puis uploadée de la même façon
  (`logo-lockup-horizontal-clair.png.asset.json`).
- `src/content/brandLogo.ts` : ajout de deux entrées au registre existant
  (`BRAND_LOGO_LOCKUP_H` fond clair, `BRAND_LOGO_LOCKUP_H_DARKBG` pour fond sombre) via le helper
  `build`, avec `alt` dédié incluant « Les Marches du Vivant ». Aucun alias existant modifié — les
  URL déjà publiées et le JSON-LD canonique restent intacts.
- `src/pages/SauniersProposition.tsx` : le bloc `div.inline-flex…rounded-full` du hero est remplacé
  par une simple `<img>` du lock-up fond sombre (`width`/`height` renseignés, `loading="eager"`,
  `alt` issu du registre). L'import `BRAND_LOGO_MARK` est remplacé s'il n'est plus utilisé ailleurs
  dans le fichier.

## Périmètre exclu

Aucune modification des autres pages (`/agent-ia`, fiche logo, nav, footer), aucune suppression
d'asset publié, aucun changement de texte.

## Vérification

Typecheck, puis rendu de `/saunier` en navigateur (mobile 390 px et desktop) pour confirmer la
lisibilité du wordmark sur le dégradé sombre.
