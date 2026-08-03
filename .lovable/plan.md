# « Ouvrir le Scénographe » depuis Le Chantier

## Ce qui se passe réellement

Le clic fonctionne : le Scénographe s'ouvre bien. Mais il s'ouvre **derrière** l'écran du Chantier.

- Le Scénographe est une surface plein écran posée à l'altitude `z-3000`.
- L'écran du Chantier, ouvert par-dessus, est posé à `z-3200`.

Résultat : l'outil est là, actif, mais entièrement masqué par le Chantier — d'où l'impression que « rien ne se passe ».

## La correction

Quand le Scénographe s'ouvre, le Chantier **s'efface** (il n'est plus rendu à l'écran, mais son état — lot, statuts du cortège, brouillons — reste intact en mémoire). À la fermeture du Scénographe, le Chantier réapparaît exactement dans l'état où il était, avec l'ICG projeté recalculé à partir du scénario qui vient d'être composé.

Un court retour visuel accompagne le geste : le bouton passe en « Ouverture du Scénographe… » le temps de la bascule, pour que l'enchaînement soit lisible plutôt que brutal.

Même traitement pour le raccourci replié « Modifier la scénographie » (cas où un scénario existe déjà) : c'est le même chemin d'ouverture.

## Détails techniques

- `ChantierOverlay.tsx` s'abonne à `useScenographeState()` ; si `open` est vrai et que la propriété correspond, il retourne `null` au lieu de son portail. Aucun démontage d'état métier : les hooks (`useChantierSpeciesPhases`, lot courant, brouillons) continuent de vivre puisque le composant reste monté, seul le rendu est suspendu.
- Alternative écartée : relever le `z-index` du Scénographe au-dessus de 3200 — deux surfaces plein écran superposées restent illisibles et le Chantier capterait encore les clics.
- `ProjectionGuide.tsx` : léger état local `opening` pour le libellé transitoire du bouton, remis à zéro quand le Scénographe est effectivement ouvert.
- Rien à changer dans `scenographeStore.ts` ni dans `ScenographeMount.tsx`.
