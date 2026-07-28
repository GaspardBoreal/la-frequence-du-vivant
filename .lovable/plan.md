## Intention

Aujourd'hui, l'étape 5 « Refus assumés » (`TabPalette.tsx`, bloc `palette-block-excluded`) affiche 3 espèces écartées venant soit de la liste noire éditoriale (`PALETTE_BLACKLIST`), soit du scoring site (`buildExclusions`) — sans aucun lien avec ce que les marcheurs ont réellement observé. Or `usePropertySpeciesPool(proprieteId)` fournit déjà les `waypoints` géolocalisés (nom scientifique, photo, date, source, corrections GPS appliquées) : c'est la même source que la « Carte des révélations » de l'étape 3.

L'idée : quand une espèce refusée est **présente sur site**, le refus devient une **consigne de gestion localisée** — on la voit, on la situe, on corrige sa position si elle est mal placée. C'est exactement ce qui justifie « une palette par lieu, pas une pour la propriété ».

## 1 — Voir : détecter et signaler la présence

Nouveau hook `src/hooks/propriete/useExcludedOnSite.ts` :
- entrée : `proprieteId` + la liste `exclusions` affichée.
- appariement par nom latin **normalisé** (NFD, minuscules) sur les `waypoints`, avec deux niveaux :
  - correspondance exacte espèce (`Buddleja davidii`),
  - correspondance de genre (`Buddleja` → « genre présent, espèce à confirmer »), signalée différemment pour ne pas mentir sur la donnée.
- sortie par exclusion : `{ occurrences: PropertyWaypoint[], count, matchLevel, lastObservedOn, firstPhoto }`.

Dans la carte de refus : bandeau d'alerte discret mais net quand `count > 0` —
`⚠ PRÉSENTE ICI · 7 observations · dernière le 12 juin 2026`, vignette photo miniature, et le picto passe de « Par principe » à **« Présente sur site — à gérer »** (teinte ambre/rouge distincte du gris actuel). Aucune observation → l'affichage reste exactement comme aujourd'hui.

Une exclusion présente sur site voit aussi son texte enrichi automatiquement d'une phrase de gestion (ex. « Constatée à N points sur la propriété : ne pas replanter, prévoir un retrait progressif avant montée en graines »), toujours éditable dans le textarea existant.

## 2 — Situer : mini-carte de refus

Nouveau composant `src/components/propriete/palette/ExcludedSpeciesMap.tsx` :
- déployé au clic sur « Situer » dans la ligne d'exclusion (accordéon, pas de nouvelle page),
- `RichMap` avec les mêmes primitives que `RevealMapBlock` : anneaux des parcelles (`useProprieteParcelles` + `buildGeofence`), fond cadastre, markers colorés par statut de géofence (dedans / lisière / dehors),
- markers dédiés « espèce refusée » (rouge brique, cerclés), popup : nom FR via `useFrenchSpeciesNamesAuto`, latin, date, source, photo cliquable,
- mode plein écran par `createPortal` avec verrouillage du scroll, comme `RevealMapBlock`,
- superposition des **zones de palette déjà dessinées** (`useProprieteZones`) : on voit immédiatement quelle zone est contaminée — le lien direct avec « une palette par lieu ».

## 3 — Repositionner : réutiliser la console de curation

Aucun nouveau système de correction : on réutilise `GpsControlConsole` (`src/components/propriete/gps/GpsControlConsole.tsx`), déjà branché sur `set_observation_gps_override` / `clear_observation_gps_override` via `useGpsOverrides`.
- bouton « Repositionner » sur la carte de refus et dans les popups → ouvre la console avec `candidates` = tous les waypoints de la propriété, `contextCandidates` = les seules occurrences de l'espèce refusée, `contextLabel` = « Refus : Buddleja davidii », `focusId` = le point cliqué.
- Le geste (drag / clic / exclusion / validation) est donc identique à l'étape 3, et les corrections se propagent partout puisque `usePropertySpeciesPool` applique les overrides à la lecture.
- Le bouton n'apparaît que si `useCanCurateParcelles` retourne vrai (même règle de droits qu'à l'étape 3).

## 4 — Verrouillage et impression

- `PaletteSummary.tsx` : dans la section « Refus assumés », ajout du compteur et de la mention de présence (« constatée à N points »), sans carte interactive.
- `PalettePrintLayout.tsx` / `CombinedPrintLayout.tsx` : la ligne de refus imprimée gagne un badge « Présente sur site · N points » et, si des occurrences existent, la liste courte des zones concernées. Pas de carte supplémentaire pour ne pas changer la pagination A4 déjà calée.

## Détails techniques

- Aucune migration : tout s'appuie sur `propriete_zones`, `propriete_palette`, `observation_gps_overrides` et les RPC existantes.
- Le comptage d'occurrences déduplique par `scientificName|lat|lng` comme le fait déjà `usePropertySpeciesPool`, et exclut les waypoints dont `overrideStatus === 'excluded'`.
- Tous les noms d'espèces passent par `<SpeciesName />` / `useFrenchSpeciesNamesAuto` (règle projet), jamais de `commonName` brut.
- Fichiers touchés : `useExcludedOnSite.ts` (nouveau), `ExcludedSpeciesMap.tsx` (nouveau), `TabPalette.tsx`, `PaletteSummary.tsx`, `PalettePrintLayout.tsx`, `CombinedPrintLayout.tsx`.
