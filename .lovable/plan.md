## Objectif

1. Accélérer encore le carrousel hero du Jardin (cadence plus rapide).
2. Enrichir la source des photos : agréger, en plus des photos « Convivialité » de l'exploration, toutes les photos de l'onglet **Voir** de chaque étape (`marches`) de l'event : à la fois les photos officielles de l'étape (`marche_photos`) et les contributions marcheurs (`marcheur_medias`) rattachées à ces étapes.
3. Renforcer l'effet « wahou » de transition.

## Changements

### `src/hooks/useGardenFiche.ts`
- Récupérer les `marches` liées à l'event : `marche_events_marches` (ou champ équivalent) → obtenir la liste des `marche_id` (steps) de l'event Jardin.
- Ajouter deux queries en parallèle :
  - `marche_photos` où `marche_id in (...)` → mapper `{ id, url: url_supabase }`.
  - `marcheur_medias` où `marche_event_id = event.id` et `type = 'image'` (ou url image) → mapper `{ id, url: url_fichier }`.
- Fusionner avec les photos Convivialité existantes, dédupliquer par URL, exposer `heroPhotos` unifié.
- Vérifier au préalable les noms exacts de tables/colonnes via un rapide `rg` avant implémentation (les hooks existants `useMarcheurMedias` et la query `marche_photos` de `MarcheDetailModal` servent de référence).

### `src/components/immersive-garden/KenBurnsCarousel.tsx`
- **Cadence** : `intervalMs` par défaut `2800` → `1900` ms (image toutes ~1.9 s).
- **Transitions renforcées (wahou++)** :
  - Cross-fade court (600 ms) mais avec **overlap** : la nouvelle image apparaît avant la sortie complète de l'ancienne.
  - **Blur reveal** raccourci à 700 ms (`blur(18px) → 0`).
  - **Iris clip-path** conservé, durée 900 ms, origine randomisée à chaque image.
  - **Ken Burns directionnel** conservé, durée alignée sur la nouvelle cadence.
  - **Flash doré** conservé mais plus vif (opacity crête 0.45, 400 ms).
  - **Léger tint saisonnier** : chromatique subtile (hue-rotate ±6°) sur l'image sortante juste avant fondu → sensation de « respiration » du jardin.
  - Préchargement des 2 prochaines images (`n+1`, `n+2`) pour éviter tout flash blanc à cette cadence.
- **Reduced motion** : cadence 4 s, cross-fade simple, aucun blur/clip-path/hue-rotate.

## Hors scope
- Aucun changement UI hors carrousel + hook data.
- Aucun changement backend, aucune migration.

## Fichiers touchés
- `src/hooks/useGardenFiche.ts` (élargir la source photos)
- `src/components/immersive-garden/KenBurnsCarousel.tsx` (cadence + effets)
