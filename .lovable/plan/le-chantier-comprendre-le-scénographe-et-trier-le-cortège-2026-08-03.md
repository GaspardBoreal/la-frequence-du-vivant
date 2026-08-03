# Le Chantier — comprendre le Scénographe et trier le cortège

Deux manques dans l'écran « Le Chantier » : on ne sait pas comment fabriquer l'après, et le « Cortège en place » est une liste morte qu'on ne peut pas qualifier.

## A. « La table de projection » — rendre le Scénographe évident

Aujourd'hui, quand aucun scénario n'existe sur le lot, l'écran affiche une phrase grise : « posez des espèces dans le Scénographe ». Aucun bouton, aucune explication.

À la place, une carte pédagogique en trois marches, avec l'ouvrage à choisir et un bouton qui ouvre réellement l'outil :

```text
COMMENT FABRIQUER L'APRÈS
1 · Choisir l'ouvrage      2 · Poser les espèces      3 · Revenir ici
   [Massif Fréquence 01]      dans l'Herbier, un clic     l'ICG projeté se
   [Haie basse]               sur la carte = une plante   recalcule seul
                       [ Ouvrir le Scénographe → ]
```

- Chaque marche a son pictogramme et une phrase courte, écrite pour quelqu'un qui n'a jamais ouvert l'outil.
- Le bouton ouvre le Scénographe sur l'ouvrage sélectionné du lot (même mécanique que l'Atelier), scénario vierge ou scénario existant.
- Quand un scénario existe déjà, la carte se replie en une ligne discrète « Modifier la scénographie » — elle n'encombre que tant qu'elle est utile.
- Dans le Scénographe lui-même, un liseré « Premiers pas » s'affiche tant qu'aucune espèce n'est posée : trois repères pointant l'Herbier (choisir), la carte (cliquer pour poser), la frise An 0 / 3 / 10 (voir grandir). Il disparaît à la première plante posée et ne revient pas.

## B. « Le tri du cortège » — avant / après, espèce par espèce

Le bloc « Cortège en place · 19 » devient un plan de travail. Chaque espèce reçoit un statut, à la main, qui prime sur la date d'observation :

| Statut | Sens | Effet sur le calcul |
| --- | --- | --- |
| Conservée | présente avant, maintenue après | compte dans l'ICG avant **et** après |
| Retirée | présente avant, supprimée par les travaux | compte avant seulement |
| Nouvelle | apparue / apportée après travaux | compte après seulement |
| Écartée | erreur d'identification, hors sujet | ne compte nulle part |

Mise en œuvre :

- Chaque puce du cortège porte un petit sélecteur à quatre crans, coloré (vert conservée, terre retirée, or nouvelle, gris écartée). Par défaut : le statut déduit de la date des travaux, exactement comme aujourd'hui — rien ne change tant qu'on ne touche à rien.
- Les modifications restent en brouillon. Une barre d'action apparaît en bas du bloc : « 4 changements · ICG projeté 58 → 64 (+6) » avec **Valider** et **Annuler**. L'écart est calculé à la volée pour qu'on voie l'effet **avant** de valider.
- À la validation : enregistrement, puis recalcul complet — hero avant/après, échelles ICG, « Comment ce chiffre est né », jury des espèces, rapport imprimé. Une ligne du rapport mentionne les statuts posés à la main, pour l'honnêteté du document.
- Actions groupées en tête de bloc : « tout conserver », « réinitialiser sur les dates » — le tri de 19 espèces doit tenir en quelques secondes.

## Détails techniques

- Nouvelle table `propriete_chantier_species_phases` (`chantier_id`, `scientific_name`, `statut`, horodatages), clé unique (chantier, espèce), GRANT + RLS alignés sur `propriete_chantier_media_phases` (`can_access_propriete`). Hook `useChantierSpeciesPhases` calqué sur `useChantierMediaPhases`.
- `src/lib/chantierIcg.ts` : les pools avant/après sont dérivés en appliquant les surcharges par nom scientifique normalisé au-dessus du filtre `isAfterWorks` actuel. Le pool « après » fusionne conservées + nouvelles + `poolFromPlantings(scenario)`. Le barème D.S. (`computeConcordanceDetail`) n'est pas touché.
- Nouveau composant `CortegeTriage.tsx` (état brouillon local, aperçu du delta via un `readIcg` sur le pool simulé) remplaçant la liste de puces dans `ChantierOverlay.tsx`.
- Nouveau composant `ProjectionGuide.tsx` pour la carte du A, utilisant `openScenographe(objetId, { scenarioId })` déjà en place.
- Noms français toujours résolus par `useWaypointFrenchNames`, y compris dans le tri et le rapport.
