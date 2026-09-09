# Deux indicateurs de biodiversité dans le tableau de bord d'un jardin

## Ce qui existe déjà (vérifié)

- Chaque jardin est relié à des événements de marche (`propriete_marche_events`), et chaque événement porte une exploration. Les 6 jardins reliés en ont aujourd'hui une chacun.
- Le comptage officiel d'espèces d'un jardin existe déjà (`usePropertySpeciesCount`) : il interroge la fonction partagée `get_exploration_species_count` pour chaque exploration rattachée, puis fusionne par nom scientifique — aucun double comptage.
- Les étiquettes écologiques (arbre, mellifère, fixateur d'azote, refuge de faune…) existent déjà avec leur cascade de confiance : correction d'un curateur, puis base de connaissances partagée, puis classification automatique (`useEcologicalFunctions`, mais seulement à l'échelle d'une exploration).

Rien à créer en base : les deux indicateurs se calculent à partir de ces sources.

## Les deux cartes

Elles s'affichent en bandeau, au-dessus des huit cartes de modules, en deux cartes larges (une colonne sur mobile).

### 1. « Le vivant recensé »

- Grand nombre : espèces distinctes observées lors des événements du jardin.
- Sous le nombre : répartition par règne (plantes, animaux, champignons, autres) en pastilles, et le nombre d'événements/explorations qui alimentent ce chiffre.
- État vide explicite si aucun événement n'est rattaché : « Aucune marche rattachée à ce jardin », plutôt qu'un zéro trompeur.

### 2. « Les alliés du jardin »

- Grand nombre : espèces porteuses d'au moins une fonction écologique, et leur part du total (« 34 sur 112, soit 30 % »).
- Sous le nombre : le trio de fonctions dominantes avec leur emoji et leur compte (ex. 🌳 arbres 12 · 🐝 mellifères 9 · 🌱 fixateurs d'azote 4), plus l'indice de fertilité déjà calculé par le référentiel.
- Mention discrète de la provenance des étiquettes (curation, base partagée, classification automatique) pour ne rien laisser croire de plus sûr qu'il ne l'est.

## Export

Les deux indicateurs rejoignent l'export de la propriété (aujourd'hui centré sur l'intention), dans les trois formats :

- **CSV** : un bloc « Biodiversité » avec une ligne par mesure (espèces totales, par règne, alliés, part, chaque fonction écologique comptée, indice de fertilité, nombre d'événements).
- **JSON** : un objet `biodiversite` complet, avec le détail par règne, par fonction, et la liste des explorations sources.
- **PDF** : une section « Biodiversité relevée » après le portrait, avec les deux chiffres clés et le tableau des fonctions.

L'export reste limité à la propriété affichée. Si les données de biodiversité ne sont pas encore chargées, le bouton attend, et l'export mentionne explicitement « aucune marche rattachée » le cas échéant.

## Détails techniques

- Nouveau hook `src/hooks/propriete/usePropertyBiodiversityKpis.ts` : récupère les explorations du jardin (même requête que `usePropertySpeciesCount`), appelle `get_exploration_species_pool` par exploration via `useQueries` (mêmes clés de cache que `useExplorationSpeciesPool` pour éviter tout appel réseau redondant), fusionne par nom scientifique normalisé NFD, puis applique la cascade d'étiquettes : `exploration_curations.functions` → `species_eco_tags_kb` (confiance ≥ 0,75) → `classifyFunctions` + `resolveStrate`. Renvoie total, règnes, compte par fonction, alliés, indice de fertilité (`computeFertilityScore`), explorations et événements.
- La logique de cascade est factorisée depuis `useEcologicalFunctions` dans une fonction pure réutilisée par les deux hooks — pas de duplication de règle métier.
- `ProprieteDashboard.tsx` : bandeau de deux cartes avant la grille existante, mêmes conventions visuelles (jetons sémantiques, animation d'apparition, états vides), aucun chiffre inventé.
- `src/lib/intentionExport.ts` : les trois fonctions d'export acceptent un paramètre optionnel `biodiversite` ; `ProprieteIntentionSection.tsx` le fournit depuis le même hook.
- Lecture seule, aucune migration, aucune URL publique modifiée.
