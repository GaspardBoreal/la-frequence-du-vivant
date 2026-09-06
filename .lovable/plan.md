# Fiche espèce du Tour de Jardin : photo au premier plan + auteur de l'observation

Deux corrections sur le panneau « Espèce » qui s'ouvre depuis une action du Tour de Jardin.

## 1. La photo agrandie doit passer devant

Aujourd'hui la photo agrandie s'affiche derrière le voile sombre du panneau : elle apparaît petite et assombrie au milieu de l'écran, comme sur la capture. C'est un simple problème d'ordre d'empilement (la visionneuse est placée sous le panneau).

Correction : la visionneuse passe au-dessus du panneau, sur un fond plein, avec la photo occupant la quasi-totalité de l'écran (jusqu'à 92 % de la hauteur), la croix de fermeture, les flèches et le compteur bien visibles par-dessus. Fermeture inchangée : croix, Échap, clic sur le fond, balayage latéral sur mobile.

## 2. Afficher qui a fait l'observation

Sous la date de dernière observation, ajout d'une ligne « Observé par … » :

- nom de l'observateur (ou pseudo) issu de la dernière observation connue de l'espèce sur le lieu ;
- si l'observation vient d'une base citoyenne (iNaturalist, eBird…), le nom devient un lien vers le profil public de cet observateur, plus un lien vers l'observation elle-même ;
- si l'observation vient d'un marcheur du projet, le nom renvoie vers sa fiche marcheur dans le site ;
- si aucun observateur n'est connu, la ligne n'apparaît pas (pas de « — » inutile).

Affichage mobile-first : nom sur une ligne, avatar/initiale à gauche, petite icône de lien externe quand la fiche est hors du site, cible tactile confortable.

## Détails techniques

- `SpeciesPhotoViewer.tsx` : passer `z-[120]` à `z-[1200]` (au-dessus du `Sheet`, qui est en `z-[1100]`), fond `bg-background/98`, image `max-h-[92vh]`.
- Données déjà disponibles, aucune migration :
  - attributions de snapshot : `observerName`, `observerLogin`, `observerProfileUrl`, `originalUrl`, `source` ;
  - observations marcheur : `marcheur_id` (+ `observation_date`).
- `usePropertySpeciesPool.ts` : étendre `resolveLastObserved` pour renvoyer, en plus de la date, l'observateur de cette date la plus récente sous forme `{ kind: 'inat' | 'marcheur', name, profileUrl, observationUrl, marcheurId }` ; propager lors de la fusion des doublons ; exposer `lastObserver` dans `BiodiversitySpecies` (`src/types/biodiversity.ts`, champ optionnel).
- `RefSpeciesPanel.tsx` : nouvelle ligne sous la date. Pour un marcheur, résoudre prénom/nom/avatar via une requête légère `exploration_marcheurs` + `community_profiles` (même logique que `usePropertyContributors`) et lier vers la fiche marcheur ; pour une source citoyenne, lier `observerProfileUrl` (fallback `https://www.inaturalist.org/people/<login>`) et `originalUrl`.
- Tokens sémantiques uniquement, `focus-visible`, `prefers-reduced-motion` respectés.
