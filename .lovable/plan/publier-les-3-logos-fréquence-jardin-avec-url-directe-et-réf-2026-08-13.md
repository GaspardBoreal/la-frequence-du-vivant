# Publier les 3 logos Fréquence Jardin — avec URL directe et référencement image

Objectif : afficher les 3 propositions de logo dans la fiche `/roadmap/frequence-jardin`, donner à chaque logo une URL propre et stable (utilisable dans un annuaire ou un champ « logo » d'une fiche externe), et équiper chaque image de tout ce qu'il faut pour ressortir dans Google Images sur « La Fréquence du Vivant » et « Fréquence Jardin ».

## Ce qui sera visible

**Sur la fiche `/roadmap/frequence-jardin`** — une nouvelle section « Identité visuelle — trois propositions » :
- 3 cartes, une par logo (Germination en fréquence, Feuille-signal, Jardin ondulant)
- pour chaque carte : l'image, son nom, sa description d'intention, le lien « Voir la page du logo » et l'URL directe de l'image affichée en clair avec un bouton copier

**Trois nouvelles pages dédiées**, une par logo :
- `/roadmap/frequence-jardin/logo/germination`
- `/roadmap/frequence-jardin/logo/feuille-signal`
- `/roadmap/frequence-jardin/logo/jardin-ondulant`

Chaque page : le logo en grand, son nom, sa description, la mention de l'association, l'URL directe de l'image copiable, un bouton de téléchargement, un retour vers la fiche. C'est cette URL de page qu'on donne à un annuaire, et l'URL image directe est en dessous pour ceux qui demandent un lien d'image brut.

## Référencement des images

Pour chaque logo, sur la fiche comme sur sa page dédiée :
- `alt` descriptif contenant « Fréquence Jardin » et « La Fréquence du Vivant » ainsi que le nom du logo
- `title`, `width`/`height` explicites (évite le décalage de mise en page), `loading` adapté (image principale en `eager` sur la page dédiée)
- balises `og:image` / `twitter:image` pointant sur l'URL absolue du logo pour chaque page dédiée
- données structurées `ImageObject` (nom, description, `contentUrl`, `license`, `creator` = La Fréquence du Vivant) sur chaque page dédiée, plus une liste `ImageGallery` sur la fiche
- `canonical` propre sur chaque page dédiée
- ajout des 3 pages dans `public/sitemap.xml` avec les extensions `image:image` (URL, titre, légende) — c'est le canal que Google Images privilégie
- mention des 3 URL dans `public/llms.txt`

## Markdown et PDF

- **Markdown** : une section « Identité visuelle » listant les 3 logos avec leur URL image directe et l'URL de leur page — pratique pour alimenter un annuaire ou une IA.
- **PDF** : les 3 logos affichés en vignette avec leur nom, sans les URL techniques (lisibilité).

## Détails techniques

- Source unique : nouveau tableau `logos` dans `src/content/frequenceJardinFiche.ts` (slug, nom, intention, pointeur `.asset.json`, alt, dimensions). Fiche web, pages dédiées, Markdown et PDF le consomment.
- Les images restent servies depuis le CDN Lovable (`/__l5e/assets-v1/...`), URL immuables ; les URL absolues sont construites depuis le domaine public `https://la-frequence-du-vivant.com`.
- Nouveau composant de page `src/pages/FrequenceJardinLogo.tsx` monté sur une route paramétrée `/roadmap/frequence-jardin/logo/:slug` dans `src/App.tsx` (404 propre si slug inconnu).
- Nouvelle section rendue dans `src/pages/FrequenceJardinFiche.tsx`, générateur Markdown étendu, vignettes ajoutées dans `src/components/roadmap/FrequenceJardinPdf.tsx`.
- Vérification : typecheck, rendu des 4 pages en navigateur, contrôle du PDF généré et du sitemap.

## Réserve

Les 3 logos sont des propositions non arbitrées. Les pages les présentent comme telles ; le jour où tu en retiens une, on pourra la promouvoir en logo officiel (favicon, og:image du site, `logo` du schema Organization) sans casser les URL déjà diffusées.
