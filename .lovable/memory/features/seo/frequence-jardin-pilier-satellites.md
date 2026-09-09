---
name: Fréquence Jardin — pilier SEO/GEO
description: Page pilier /frequence-jardin + 4 satellites, contenu factuel centralisé, signaux SEO/GEO (sitemap, llms.txt, catalogue de recherche)
type: feature
---

Stratégie de référencement de la marque « Fréquence Jardin » (SEO + IA génératives).

- Page pilier `/frequence-jardin` + satellites `/frequence-jardin/diagnostiquer-son-jardin`,
  `/plantes-bio-indicatrices`, `/palette-vegetale`, `/cas-jardin-monde-deviat`.
  Routes déclarées AVANT `/jardin/:slug` dans `src/App.tsx`.
- Contenu factuel centralisé dans `src/content/frequenceJardin/pilier.ts` ; kit de mise en page
  et métadonnées dans `src/components/frequence-jardin/FjKit.tsx` (FjHead, FjBreadcrumb,
  FjSection, FjRelated). Jamais de chiffre inventé : les données viennent de
  `etudeDeSolMethodes.ts`, `plantIndicatorKb.ts`, `paletteSources.ts`, `CasDeviatSection`.
- `/roadmap/frequence-jardin` reste l'annexe technique et pointe vers le pilier.
- Signaux à maintenir en cohérence à chaque ajout de page : `public/sitemap.xml`,
  `public/llms.txt` (section « Fréquence Jardin »), table `site_pages` (univers `jardin`).
- Les changements de métadonnées ne sont visibles sur le domaine public qu'après publication.
