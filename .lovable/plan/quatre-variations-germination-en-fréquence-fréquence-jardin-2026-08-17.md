# Quatre variations « Germination en fréquence » — Fréquence Jardin

Le logo actuel `/roadmap/frequence-jardin/logo/germination` porte en réalité l'esprit de la marque ombrelle. On garde ce dessin de graine en germination comme motif fondateur et on en produit **4 nouvelles variations signées « FRÉQUENCE JARDIN »**, ajoutées à la famille Fréquence Jardin existante.

## Les 4 variations

Toutes reprennent la graine en germination (cotylédons vert sauge, graine ambrée, racines fines) et la palette actuelle vert sauge / or, sur fond transparent, format carré 1024×1024, texte « FRÉQUENCE JARDIN » en capitales espacées.

1. **Germination — onde pleine** : la graine au centre, l'onde sonore traverse horizontalement de bord à bord, racines développées sous la ligne d'onde.
2. **Germination — cercle** : le germe inscrit dans un cercle fin d'ondes concentriques, sceau lisible en très petit (favicon, pastille d'annuaire).
3. **Germination — nervure** : la tige du germe devient directement une onde qui monte, composition verticale élancée pour bandeaux et documents.
4. **Germination — sol lu** : germe posé sur une ligne de sol stratifiée (horizons), l'onde court dans le sol plutôt qu'en l'air, la plus narrative.

Chaque variation obtient, comme les logos existants : une carte dans la section « Identité visuelle », une page dédiée `/roadmap/frequence-jardin/logo/:slug`, une URL image directe copiable, son intention rédigée et son `alt` SEO.

Slugs : `germination-onde-pleine`, `germination-cercle`, `germination-nervure`, `germination-sol-lu`.

La famille Fréquence Jardin passe de 4 à 8 logos ; le compteur d'en-tête (« Logos (7) ») affichera 11 automatiquement.

## Détails techniques

- Génération : `generate_image` en qualité premium, fond transparent, à partir d'une description dérivée du logo Germination existant pour garder le trait, puis upload via `lovable-assets` dans `src/assets/brand/frequence-jardin/logos/` (pointeurs `.asset.json`).
- `src/content/frequenceJardinFiche.ts` : 4 imports + 4 entrées dans `ficheLogos` (family `'jardin'`), intro de la famille jardin mise à jour. Aucun helper ni slug existant modifié — les URL déjà diffusées restent intactes.
- `src/pages/FrequenceJardinFiche.tsx` et `src/pages/FrequenceJardinLogo.tsx` : rien à changer (rendu piloté par la source).
- `src/components/roadmap/FrequenceJardinPdf.tsx` : la rangée de vignettes jardin passe à 8 → passage en grille qui se replie sur plusieurs lignes pour éviter l'écrasement.
- `public/sitemap.xml` : 4 nouvelles URL avec extensions `image:image` ; mention dans `public/llms.txt`.

## Vérification

Typecheck, rendu de la fiche et des 4 pages dédiées en navigateur (375 px et 1280 px), PDF généré et inspecté page par page.
