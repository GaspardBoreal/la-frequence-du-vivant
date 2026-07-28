## Ce que je comprends

Sur `/propriete/:slug`, quand on fait défiler chacune des étapes (Portrait, J'observe, J'analyse…), les widgets restent visibles **au-dessus et au travers** de la barre d'onglets collante : on voit du contenu passer dans la bande de 4rem au-dessus de la barre, et le fond translucide laisse transparaître ce qui glisse dessous. Attendu : tout ce qui remonte disparaît proprement sous la barre, sur mobile, tablette et desktop.

## Cause

Dans `src/pages/ProprieteEspace.tsx` :
- La barre (`TabsList`) est en `sticky top-16` alors que le header sombre du haut est en `absolute` **à l'intérieur du hero** : il défile et disparaît. Il reste donc une bande vide de 64px au-dessus de la barre dans laquelle le contenu défile à découvert (le « 26 % » visible sur la copie d'écran).
- Le fond est semi-transparent (`bg-background/95` + `backdrop-blur`), donc le contenu reste perceptible derrière.
- La barre est limitée à la largeur du conteneur : sur les côtés (desktop large), le contenu peut apparaître hors barre.

## Correctifs prévus

1. **Position** : passer la barre en `sticky top-0` (avec `padding-top` de zone sûre iOS `env(safe-area-inset-top)`) — plus aucune bande transparente au-dessus.
2. **Opacité** : fond pleinement opaque (token `--background`), suppression de la dépendance au flou, bordure basse + ombre douce pour marquer la séparation.
3. **Pleine largeur** : bandeau plein écran (wrapper full-bleed) avec la liste d'onglets centrée à l'intérieur, pour qu'aucun contenu ne remonte sur les côtés.
4. **Hiérarchie z-index** : barre au-dessus des blocs internes (matrice éco, listes d'observations, cartes plein écran conservées au-dessus). Un niveau cohérent sera fixé pour ces trois cas.
5. **Ancrages** : ajout de `scroll-margin-top` correspondant à la hauteur de barre, afin que le scroll par clic d'onglet ne cache pas les titres de section.
6. **Responsive** : barre défilable horizontalement (mobile), centrée (desktop) ; hauteur mesurée via variable CSS pour rester juste sur les trois formats.

## Vérification

Contrôle en aperçu Playwright aux trois tailles (390, 834, 1440 px) : capture pendant le défilement sur J'observe, J'analyse et J'identifie pour confirmer qu'aucun widget n'est visible au-dessus ou à travers la barre.

## Fichiers touchés

- `src/pages/ProprieteEspace.tsx` (barre d'onglets, wrapper full-bleed, scroll-margin)
- ajustements mineurs de z-index dans `src/components/propriete/identify/blocks/EcoMatrixBlock.tsx` et `RevealObservationList.tsx`
