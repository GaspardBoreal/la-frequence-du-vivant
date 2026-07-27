## Diagnostic (vérifié dans le code)

Dans `RevealObservationList.tsx`, les états `query`, `sortKey`, `activeTagKeys` sont **locaux au bandeau** (lignes 58-63) et le filtrage produit une liste `displayed` qui ne sort jamais du composant.

Dans `RevealMapBlock.tsx`, les marqueurs (ligne 457), le compteur d'en-tête (« X espèces · Y obs. », lignes 397-399 et 614-616), le cadrage `bounds` (ligne 181) et la visionneuse `RevealPhotoLightbox` (ligne 673) consomment tous `filtered`, qui n'applique que les filtres de la barre du haut (règne, source, périmètre, bio-indicatrices).

D'où l'écart observé : 3 résultats à gauche, 357 points à droite.

## Correction : un seul état de filtrage, deux rendus

1. **Remonter l'état d'index dans `RevealMapBlock`** : `query`, `sortKey`, `nameAsc`, `dateDesc`, `activeTagKeys` deviennent des props contrôlées passées à `RevealObservationList` (le composant reste purement présentiel).
2. **Extraire la logique dans un hook `useRevealIndex(items, …)`** (nouveau fichier `useRevealIndex.ts`) qui expose : `matched` (liste filtrée + triée), `matchedIds` (Set), `tagFacets`, `tagsFor`, `isIndexActive` (recherche ou tags actifs).
3. **Brancher la carte sur `matchedIds`** :
   - marqueurs correspondants : rendu normal ;
   - marqueurs non correspondants : version « fantôme » (opacité ~0.18, sans ombre, `interactive: false`) plutôt que suppression, pour garder le contexte spatial du jardin ;
   - un petit bouton `Effacer la recherche` apparaît sur la carte quand l'index est actif.
4. **Cadrage automatique** : quand une recherche/tag est active et qu'au moins 1 point correspond, `bounds` se calcule sur `matched` (avec le même écrêtage des points isolés). Retour au cadrage global dès que l'index est vide.
5. **Compteurs cohérents** : les en-têtes affichent `N espèces · M obs.` calculés sur `matched`, avec la mention discrète `/ total` quand un filtre d'index est actif (même convention que le bandeau).
6. **Visionneuse et navigation** : `RevealPhotoLightbox` reçoit `matched` (donc ← → circule uniquement dans les résultats de recherche, dans l'ordre de tri affiché) ; le clic carte continue de surligner la ligne correspondante.

## Détails techniques

- Le tri n'affecte pas la carte mais conditionne l'ordre de la visionneuse → il reste dans le même hook.
- `useMarcheurSpeciesTags` est appelé une seule fois dans le hook (au lieu du bandeau), ce qui évite un doublon de requête quand la carte doit aussi connaître les tags.
- Aucune modification des RPC/données : purement présentation et état React.
- Fichiers touchés : `src/components/propriete/identify/blocks/RevealMapBlock.tsx`, `RevealObservationList.tsx`, nouveau `src/components/propriete/identify/blocks/useRevealIndex.ts`.
