## Objectif
Simplifier le hero de la page Propriété (`/propriete/:slug`) sans toucher au reste.

## Modifications (fichier unique : `src/pages/ProprieteEspace.tsx`)

1. **Supprimer** le bouton flottant animé « ↓ Descendez dans votre jardin » en bas du hero (lignes 303-311), ainsi que ses styles/animations propres.
2. **Descendre le bouton « Explorer votre diagnostic vivant »** : passer sa marge haute de `mt-10` à une valeur plus généreuse et responsive (ex. `mt-16 md:mt-24`) pour qu'il occupe l'espace libéré et respire dans la composition.

## Non touché
- `scrollToDiagnostic` reste utilisé par le bouton principal (aucune suppression de logique de scroll).
- Aucun changement aux onglets, au sticky header, à la galerie ou aux autres pages.
- Nettoyage éventuel de `useReducedMotion` uniquement s'il n'est plus utilisé ailleurs dans le composant (à vérifier avant retrait).
