# Identité visuelle — deux familles de marque

Objectif : décliner le logo « Feuille-signal » pour **La Fréquence du Vivant**, restructurer la section de la fiche en « Identité visuelle » avec deux sous-sections, et proposer 3 logos pour **Les Marches du Vivant**.

## Ce que verra le visiteur

Sur `/roadmap/frequence-jardin`, la section devient **« Identité visuelle »** avec deux sous-sections :

**Fréquence Jardin** (4 logos)
- Les 3 existants : Germination en fréquence, Feuille-signal, Jardin ondulant
- Nouveau : **Feuille-signal — La Fréquence du Vivant**, déclinaison du logo Feuille-signal où le texte « FREQUENCE JARDIN » est remplacé par « La Fréquence du Vivant », composition, couleurs et graphisme strictement identiques (édition d'image à partir du fichier existant, pas de regénération).

**Les Marches du Vivant** (3 logos, nouveaux)
Même direction botanique poétique, mais orientée marche et itinéraire :
1. **Sentier en fréquence** — un chemin sinueux qui devient onde, ponctué de silhouettes végétales.
2. **Empreinte vivante** — une empreinte de pas dont l'intérieur est un feuillage, cercles concentriques doux.
3. **Horizon marché** — une ligne d'horizon en courbes superposées (haies, collines) traversée par un signal.

Chaque logo garde exactement le même traitement que les actuels : carte avec image, intention, URL image directe copiable, lien vers sa page dédiée `/roadmap/frequence-jardin/logo/:slug`.

Le bouton d'en-tête « Logos (3) » affichera automatiquement « Logos (7) ».

## Markdown et PDF

- **Markdown** : section « Identité visuelle » avec deux sous-titres (Fréquence Jardin / Les Marches du Vivant) et, pour chaque logo, image, intention, URL directe et URL de page.
- **PDF** : deux rangées de vignettes, une par famille, avec titre de sous-section ; sans les URL techniques.

## Détails techniques

- Génération : `edit_image` sur `logo-feuille-signal.png` pour la variante texte, puis `generate_image` (premium, fond transparent) pour les 3 Marches du Vivant. Upload via `lovable-assets`, pointeurs `.asset.json` dans `src/assets/brand/…`.
- `src/content/frequenceJardinFiche.ts` : ajout d'un champ `family` (`'jardin' | 'marches'`) sur `FicheLogo`, extension du tableau `ficheLogos` à 7 entrées, générateur Markdown adapté aux deux groupes. Les helpers `logoImageUrl`, `logoPageUrl`, `findLogo` restent inchangés — les URL déjà diffusées ne bougent pas.
- `src/pages/FrequenceJardinFiche.tsx` : titre de section renommé, rendu groupé par famille, ancre `#identite-visuelle` conservée.
- `src/components/roadmap/FrequenceJardinPdf.tsx` : deux blocs de vignettes.
- `src/pages/FrequenceJardinLogo.tsx` : rien à changer (route paramétrée, alt/JSON-LD lus depuis la source).
- SEO : `alt` par logo contenant « La Fréquence du Vivant » et le nom de la famille, ajout des 4 nouvelles pages dans `public/sitemap.xml` avec extensions `image:image`, et mention dans `public/llms.txt`.

## Vérification

Typecheck, rendu de la fiche et des pages dédiées en navigateur, PDF généré et inspecté page par page.
