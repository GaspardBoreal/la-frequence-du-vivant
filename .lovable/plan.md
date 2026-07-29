## Objectif

L'onglet **Vivant** de l'Atelier du jardin nourricier filtre aujourd'hui par Types, Catégories végétales, Sources et Bio-indicatrices. Il manque deux entrées essentielles : **recherche par nom** et **filtre par mes tags**. Les deux existent déjà ailleurs dans l'app (vue « Carte des révélations » de J'identifie) — on réutilise exactement la même mécanique pour garantir la cohérence, puis on soigne la mise en scène.

## Ce qui existe déjà et qu'on réutilise

- `matchVivantFilter()` et l'état `VivantFilterState` — le point de passage unique du filtrage, appliqué à la fois aux marqueurs de la carte et aux compteurs.
- La recherche texte de `useRevealIndex` : normalisation des accents (NFD), recherche sur nom français + nom scientifique + observateur.
- Le système de tags marcheur : table `marcheur_species_tags`, hook `useMarcheurSpeciesTags`, indexation par nom scientifique normalisé, et la logique **ET / OU / SAUF** déjà écrite dans `matchesTagFilter`.

## Ce qu'on construit

### 1. Barre de recherche « scanner du vivant »

Un champ de recherche en tête du panneau Vivant, au-dessus des chips Types :
- recherche insensible aux accents et à la casse, sur nom français, nom scientifique et nom de l'observateur ;
- saisie temporisée (debounce) pour rester fluide même avec plusieurs centaines d'observations ;
- bouton d'effacement, et raccourci « Échap » pour vider ;
- pendant la frappe, les observations non correspondantes s'estompent progressivement sur la carte au lieu de disparaître sèchement, et les correspondantes prennent un halo — l'utilisateur voit *où* se trouve ce qu'il cherche.

### 2. Filtre « Mes tags »

Une section **MES TAGS** sous Sources :
- chips des tags de l'utilisateur, chacun avec sa couleur d'origine et le nombre d'observations concernées dans la propriété (les tags à 0 sont grisés, pas masqués, pour rester lisibles) ;
- trois modes de combinaison — **Tous** (ET), **Au moins un** (OU), **Sauf** (exclusion) — repris à l'identique du filtre tags existant ;
- si l'utilisateur n'a encore aucun tag, la section affiche une invitation courte plutôt qu'un vide.

### 3. Cohérence et robustesse

- Les deux nouveaux critères entrent dans le même `VivantFilterState`, donc ils s'appliquent **partout d'un coup** : marqueurs de carte, compteur « N observations affichées sur N », répartition par type, lightbox photo et navigation de curation GPS.
- Une ligne de synthèse des filtres actifs avec un bouton **Réinitialiser** apparaît dès qu'un filtre est posé — aujourd'hui rien ne signale qu'un filtre est actif, ce qui est la première source de confusion.
- Le compteur bio-indicatrices reste calculé sur la sélection visible, cohérent avec le reste.
- Les filtres actifs sont mémorisés par propriété pendant la session, pour ne pas repartir de zéro à chaque retour dans l'atelier.

## Détails techniques

- `src/components/propriete/palette/studio/LivingLayer.tsx`
  - étendre `VivantFilterState` avec `query: string` et `tags: { labels: string[]; mode: 'and' | 'or' | 'not' }` ;
  - étendre `matchVivantFilter(w, f, ctx)` avec un contexte optionnel `{ displayName, tagsBySpecies }` — la signature reste rétrocompatible pour les appelants existants ;
  - enrichir `LivingFilterPanel` : champ de recherche + section tags + résumé/reset.
- `src/components/propriete/palette/studio/PaletteStudio.tsx`
  - alimenter le contexte : noms français déjà disponibles via `displayNameFor`, tags via `useMarcheurSpeciesTags(scientificNames)` + `indexTagsBySpecies` ;
  - `visibleWaypoints` et `vivantCounts` passent par le même contexte ; facettes de tags calculées dans la même passe pour éviter un second parcours ;
  - passer le contexte à `LivingLayer` pour que la carte et le panneau restent strictement synchrones.
- Aucune modification de base de données : la RPC `get_my_marcheur_tags_for_species` couvre le besoin.
- Le champ de recherche du bloc « Carte des révélations » n'est pas touché ; seule la fonction de normalisation est factorisée pour éviter deux implémentations divergentes.
