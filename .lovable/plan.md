## Constat

La vignette 8 (`SensorialBlock`) est enveloppée dans `<div className="md:col-span-2">` dans `TabObserve.tsx`, ce qui la fait s'étendre sur toute la largeur de la grille au lieu de prendre la même largeur qu'une carte 1-7. Résultat : format visuel différent (carte pleine largeur au lieu d'une tuile de la grille 2 colonnes), et l'illustration paraît vide car étirée sur un ratio 16/7 très large.

## Correction (1 fichier)

`src/components/propriete/tabs/TabObserve.tsx` — retirer le wrapper `md:col-span-2` autour de `<SensorialBlock>` pour qu'elle occupe une cellule normale de la grille `md:grid-cols-2`, exactement comme les cartes 1-7.

```diff
- <div className="md:col-span-2">
-   <SensorialBlock values={state.sensorial} onChange={setSensorial} />
- </div>
+ <SensorialBlock values={state.sensorial} onChange={setSensorial} />
```

Ajustement interne dans `SensorialBlock.tsx` : la grille interne des champs sensoriels passe de `sm:grid-cols-3 md:grid-cols-4` à `grid-cols-2 sm:grid-cols-2 md:grid-cols-2` (idem `ObservationCard` en cellule simple) pour que les tuiles Sons/Odeurs/Textures/Vues/Ambiance restent lisibles dans la largeur d'une carte simple, et le slider garde `col-span-full`.

## Résultat attendu

Carte 8 = tuile 8 de la grille, même largeur, même ratio d'illustration, même densité de contenu que les cartes 1-7.

## Hors périmètre

Pas de changement d'illustration, de données, de hook, ni de logique parent.