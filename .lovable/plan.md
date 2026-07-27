## Objectif

Transformer le bandeau gauche du mode plein écran de la « Carte des révélations » en un véritable **index vivant** : recherche, tri et filtre par tags personnels, avec une présentation soignée.

## Ce qui est ajouté

**Barre d'outils (en tête du bandeau, sticky)**
- Champ de recherche « nom contient » : filtre sur nom français, nom scientifique et nom d'observateur, avec effacement rapide et compteur de résultats en direct.
- Deux pastilles de tri commutables, chacune avec sa flèche de sens :
  - « Espèce » — A→Z par défaut, clic pour inverser.
  - « Date » — plus récent d'abord par défaut, clic pour inverser.
  Une seule pastille active à la fois ; tri par espèce actif à l'ouverture.
- Pastille « Mes tags » : n'apparaît que si l'utilisateur connecté a des tags sur les espèces visibles. Cliquer ouvre une rangée de puces colorées (une par libellé de tag, avec le compte) ; sélection multiple, filtrage cumulatif.

**Présentation des lignes**
- En-têtes de section flottants : lettre initiale en mode tri espèce, mois/année en mode tri date — pour donner du rythme à la liste.
- Chaque ligne conserve la vignette (clic = zoom), et gagne les pastilles de tags de l'utilisateur sous le nom.
- Surlignage des occurrences recherchées dans le nom.
- État vide illustré et sobre quand aucun résultat ne correspond.
- Le bandeau reste synchronisé avec la carte (défilement auto + anneau doré sur la sélection) ; la carte n'est pas refiltrée par ces contrôles, seul le bandeau l'est — ou, si vous préférez, on peut aussi filtrer les points de la carte (à confirmer).

## Détails techniques

- Composant `RevealObservationList.tsx` : ajout d'une barre d'outils interne, état local `query` / `sortKey` / `sortDir` / `activeTagKeys`, dérivation mémoïsée de la liste affichée et des en-têtes de groupe.
- Tri par nom : `displayNameFor` + `localeCompare('fr')`. Tri par date : `observationDate`, valeurs nulles rejetées en fin de liste.
- Tags : réutilisation de `useMarcheurSpeciesTags(scientificNames)` et `indexTagsBySpecies` (`src/hooks/useMarcheurSpeciesTags.ts`) — le hook est déjà scopé RLS à l'utilisateur connecté ; couleurs via `getTagColor`. Aucun changement base de données.
- Styles strictement sur les tokens `--ds-*` déjà utilisés dans le bloc, pas de couleur en dur.
- Aucun changement dans `RevealMapBlock.tsx` hormis, éventuellement, le passage de la liste des noms scientifiques déjà disponible.
