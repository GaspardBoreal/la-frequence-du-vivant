# Palette végétale : une impression qui donne envie de planter

## Pourquoi la page est blanche

L'impression « Palette végétale » seule fabrique son contenu dans un conteneur nommé `palette-print-portal`, alors que la règle d'impression activée ne rend visible qu'un conteneur nommé `synthesize-print-portal`. Résultat : tout le document est masqué au moment d'imprimer, et l'imprimante ne reçoit qu'une page vide. Le « Cahier complet » fonctionne parce qu'il utilise, lui, un conteneur cohérent avec sa règle.

## Ce qui change

### 1. Le document s'imprime (correctif)

Le mode d'impression de la palette obtient son propre habillage A4 dédié, aligné sur son conteneur. Plus de page blanche, quel que soit le navigateur.

### 2. Une maquette « Atelier » qui inspire

Le cahier passe de deux pages sobres à une brochure de chantier, prête à convaincre un propriétaire :

```text
1  Couverture       Grand aplat végétal, titre gravé, la règle du site en exergue
2  Le serment       La règle du site en pleine page + les 3 refus fondateurs
3  Les ambiances    Une planche par emplacement : bandeau nuancier, strates,
                    espèces retenues, intention écrite
4  Le calendrier    Frise des 12 mois : continuité florale de l'ensemble du site
5  Le plan gravé    (existant) emplacements & ouvrages
6  La table         (existant) métrés, coûts, bilan de l'Atelier
7+ Fiches ouvrages  (existant) conseils par type
n  Ce qu'on écarte  Refus argumentés + présence terrain constatée
n+1 La mise en œuvre Frise an 0 / an 1 / an 3 en jalons, + sources et signature
```

Traitements graphiques ajoutés :

- **Bandeau nuancier** en tête de chaque planche d'emplacement : dégradé réel des teintes retenues, nom du nuancier, harmonie déduite.
- **Frise de floraison** imprimée en couleur (12 cases), par emplacement puis en cumul site, pour lire d'un coup d'œil les mois creux.
- **Vignettes d'espèces** en grille régulière avec nom français puis nom scientifique en italique, strate et rôle écologique en micro-typographie.
- **Cartouche de bas de page** cohérent avec les autres étapes (propriété, étape, pagination).
- **Aplats et filets** en tons crème/or/forêt du cahier, avec forçage des couleurs à l'impression.

### 3. Prêt pour les données de l'Atelier

Les blocs plan gravé, table de l'Atelier et fiches ouvrages restent branchés tels quels : quand les données de l'Atelier seront complétées, elles alimenteront la brochure sans nouvelle modification de maquette. Les pages vides ne s'impriment pas (une section sans donnée disparaît au lieu de laisser une page creuse).

## Détails techniques

- `src/index.css` : nouveau bloc `@media print` pour `body.palette-print-mode` + `#palette-print-portal` (mêmes primitives A4 que `synthesize-print-page`, réutilisées via un sélecteur groupé pour ne pas dupliquer les règles) ; styles des nouveaux éléments (`palette-print-cover`, `palette-print-oath`, `palette-print-zone`, `palette-nuancier-band`, `palette-bloom-frieze`, `palette-species-grid`, `palette-timeline`).
- `src/components/propriete/tabs/TabPalette.tsx` : `bodyClass` du print solo passe de `synthesize-print-mode` à `palette-print-mode`.
- `src/components/propriete/print/PalettePrintLayout.tsx` : nouvelle pagination (serment, planches d'emplacement, frise cumulée, mise en œuvre), pages conditionnelles, compteur total recalculé.
- Nouveaux composants de présentation sous `src/components/propriete/print/palette/` : `PaletteOathPage`, `PaletteZonePlate`, `PaletteBloomFrieze`, `PaletteImplementationTimeline`.
- Le nuancier réutilise `hexOf` / `nuancierName` / `harmonieOf` de `src/lib/nuancierKb.ts` ; aucune requête ni changement de données.
