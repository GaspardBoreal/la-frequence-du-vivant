## Objectif

Rendre la préparation du « Cahier complet » (Portrait + J'observe + J'analyse) visible, rassurante et nettement plus rapide.

## Constat (vérifié dans le code)

- `usePrintCombined.ts` attend **toutes** les images du portail en une seule promesse, sans aucun retour d'état, puis attend 200 ms fixes et appelle `window.print()`. Aucun timeout : une image lente ou en erreur silencieuse bloque tout.
- Le cahier complet charge en pleine résolution : photo héro + jusqu'à 12 planches Portrait (`PortraitPrintLayout`, plusieurs `<img>` par photo — sommaire visuel + planches + doubles), plus les planches « Preuves de terrain » (`TestMediaPrintPlates`, 12 vignettes par page, URL signées régénérées juste avant via `refetchTestMedias`).
- Le même fichier `usePropertyGallery` / `usePropertyTestMedias` sert les URL originales : aucune variante redimensionnée n'est demandée.

## 1. Overlay de progression (UX)

Nouveau composant `src/components/propriete/print/PrintPreparationOverlay.tsx`, dans l'esprit de `InatFullscreenLoadingOverlay` (framer-motion, `Progress`, étapes cochées) mais habillé Carnet (crème/or/forêt, typo serif italique).

Étapes affichées, avec compteur et coche animée :
1. « Rassemblement des photographies du portrait » (n/N)
2. « Réveil des preuves de terrain » (n/N)
3. « Mise en page des planches A4 »
4. « Encre et papier — ouverture de l'aperçu »

Micro-copies poétiques tournantes sous la barre (« Le papier se prépare… », « Chaque photographie retrouve sa place »), et sous 3 s un message rassurant « L'aperçu d'impression va s'ouvrir ». Overlay non fermable mais avec bouton « Annuler » (annule le `window.print()` et retire la classe body). Respect de `prefers-reduced-motion`.

## 2. Optimisation de la préparation

Dans `usePrintCombined.ts` :
- Suivi image par image (`loaded/total`) exposé via un état → alimente l'overlay.
- **Timeout par image** (≈4 s) et **timeout global** (≈15 s) : on n'attend jamais indéfiniment, l'impression part avec ce qui est prêt, l'overlay signale « n photo(s) non chargée(s) ».
- Préchargement en parallèle plafonné (concurrence 6) via `Image()` + cache `decode()`, au lieu d'attendre passivement le DOM.
- Suppression du `setTimeout(200)` fixe remplacé par un double `requestAnimationFrame` après décodage.

Réduction du poids chargé :
- Ajout d'un utilitaire `printImageUrl(url, width)` qui, pour les URL Supabase Storage, demande une variante redimensionnée (rendu image `width`/`quality`) — largeur cible selon l'usage : ~180 px pour les vignettes du sommaire visuel et les preuves de terrain, ~1200 px pour les planches pleine page et la couverture héro. Fallback transparent sur l'URL d'origine si la transformation n'est pas disponible.
- Déduplication : la même photo réutilisée (sommaire + planche) ne se télécharge qu'une fois par variante.
- `refetchTestMedias` lancé **en parallèle** du montage de l'overlay (et non avant, en bloquant), avec son propre pas de progression.

## Fichiers touchés

- `src/components/propriete/print/usePrintCombined.ts` (progression, timeouts, préchargement)
- `src/components/propriete/print/PrintPreparationOverlay.tsx` (nouveau)
- `src/components/propriete/print/printImageUrl.ts` (nouveau, utilitaire de variantes)
- `src/components/propriete/portrait/PortraitPrintLayout.tsx` et `src/components/propriete/analyze/print/TestMediaPrintPlates.tsx` (utilisation des variantes)
- `src/components/propriete/tabs/TabAnalyze.tsx` et `TabObserve.tsx` (montage de l'overlay, flux `handleConfirmPrint` non bloquant)

Aucun changement de contenu ni de pagination des documents imprimés.
