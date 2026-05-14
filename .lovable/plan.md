## Changement

Dans `src/components/community/EventBiodiversityTab.tsx` :

1. Ajouter un nouvel onglet `indicateurs` (label "Indicateurs") dans `subTabs`, positionné entre `taxons` et `temoignages`.
2. Étendre le type `SubTab` pour inclure `'indicateurs'`.
3. Retirer `<TaxonsIndicesPanel />` du bloc `taxons` (ligne 456).
4. Créer un nouveau bloc d'affichage `activeSubTab === 'indicateurs'` qui rend `<TaxonsIndicesPanel species={allSpeciesWithFrNames as any} />` avec la même animation `motion.div`.

Aucun autre changement (pas de modification de `TaxonsIndicesPanel.tsx` lui-même — son contenu "Lecture écologique du peuplement" reste identique, simplement déplacé vers son propre onglet).

## Hors scope

- Pas de refonte du contenu de `TaxonsIndicesPanel`.
- Pas de modification de `BiodiversityEvolutionChart` ni `SpeciesExplorer` (restent dans Taxons observés).
