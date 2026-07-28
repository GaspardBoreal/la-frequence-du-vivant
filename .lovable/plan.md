## Constat

La page n'est pas vide : elle est **imprimée à opacité quasi nulle**. Tout le contenu est bien présent dans l'aperçu (titre, lecture dominante, cortège, 8 pôles, pied de page, 3 feuilles), mais en gris très pâle.

## Cause identifiée

`IdentifySummary.tsx` (lignes 146-149) rend sa racine en `motion.article` avec `initial={{ opacity: 0, y: 12 }}` → `animate={{ opacity: 1 }}`.

Or le contenu d'impression est monté dans un portail `#identify-print-portal` qui est `display: none` hors impression (`index.css`). Une animation d'opacité Framer Motion (WAAPI / composited) lancée sur un sous-arbre non rendu ne progresse pas : au moment où `window.print()` bascule le portail en `display: block`, l'élément reste figé près de son état initial `opacity: 0`. D'où la page fantôme.

## Correction

1. **`IdentifySummary.tsx`** — en mode `printOnly`, rendre un `<article>` statique (pas de `motion`, pas d'`initial/animate`). L'animation reste en place pour l'affichage écran de la synthèse scellée.
2. **Filet de sécurité CSS (`index.css`)** — dans les blocs `@media print`, pour les trois portails d'impression (`#identify-print-portal`, `#analyze-print-portal`, `body.combined-printing`) :
   ```
   * { opacity: 1 !important; transform: none !important; animation: none !important; transition: none !important; filter: none !important; }
   ```
   sauf les opacités décoratives volontaires — la règle sera portée uniquement sur les racines `.identify-print-root`, `.analyze-print-root`, `.observe-print-root` et leurs descendants directs animés, pour ne pas écraser les pastilles de l'atlas (qui utilisent `opacity` inline comme échelle de valeur). Concrètement : cibler `[style*="opacity"]` issus de Framer Motion via les classes racines, et laisser `.flora-atlas-pastille` intacte.
3. **Même prévention pour l'étape 2 et le cahier complet** — `AnalyzeSummary.tsx` et `ObserveSummary.tsx` utilisent le même schéma `motion.article` + `printOnly` ; appliquer le même rendu statique pour éviter des impressions pâles aléatoires (le bug est latent, il dépend du timing de rasterisation).

## Vérification

Rendu de la page d'impression en émulation `media: print` (Playwright) sur `/propriete/jardin-monde-deviat`, capture des 3 pages, contrôle que l'opacité calculée des racines vaut 1 et que l'atlas conserve ses pastilles graduées.

## Fichiers touchés

- `src/components/propriete/identify/IdentifySummary.tsx`
- `src/components/propriete/analyze/AnalyzeSummary.tsx`
- `src/components/propriete/observe/ObserveSummary.tsx`
- `src/index.css` (blocs `@media print` des portails)
