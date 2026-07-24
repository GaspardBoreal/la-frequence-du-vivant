## Problème

Dans `AppChoiceDialog.tsx`, chaque propriété affiche une vignette 56×56 alimentée par `p.photo_hero_url`. Quand la propriété n'a pas encore de photo hero renseignée (cas actuel de « Jardin Monde DEVIAT » et « Maison sous Blossac »), le fallback est un simple dégradé émeraude uni → carré vide, sans âme, qui casse l'effet « Bienvenue ».

## Proposition — Vignettes vivantes par propriété

Remplacer le carré vide par une **vignette signature** qui reste belle même sans photo, avec une cascade de sources :

1. **Photo hero de la propriété** si présente (comportement actuel).
2. **Sinon, photo dérivée** : première image du hook `useProprieteHeroPhotos` (photos des events liés — déjà utilisé sur `/propriete/:slug`). Ça réutilise la vraie mémoire visuelle du lieu.
3. **Sinon, monogramme illustré** : fond dégradé thématique (émeraude→ambre pour Propriétaire, teal→cyan pour Paysagiste, etc.) + initiales de la propriété en serif italique doré `#c9a24a`, + petit picto `TreePine`/`Vineyard`/`Sprout` selon la famille (jardin/vignoble/exploitation) en overlay bas-droit, + grain subtil.

## Détails visuels

- Vignette agrandie 64×64, coins `rounded-2xl`, ring `ring-1 ring-amber-300/20`, ombre douce.
- Ken Burns léger (scale 1→1.05 en 8s) quand une vraie photo est présente → sensation « vivant ».
- Badge rôle repositionné pour respirer.
- Loading state : shimmer discret pendant la résolution des photos d'events.

## Fichiers concernés

- `src/components/community/AppChoiceDialog.tsx` — remplacer le `<div style={backgroundImage…}>` par un nouveau composant `<ProprieteTile propriete={p} />`.
- `src/components/community/ProprieteTile.tsx` *(nouveau)* — encapsule la cascade photo → monogramme + picto famille.
- Réutiliser `useProprieteHeroPhotos` (déjà en place) pour la source #2, en le rendant paramétrable par `slug` ou `id`.

## Hors scope

Aucun changement DB, aucun changement de routing, aucun impact sur `/propriete/:slug`.
