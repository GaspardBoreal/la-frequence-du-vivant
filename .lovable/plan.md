## Problème
Le bouton flottant « Rejoindre la Fréquence » (`src/components/adhesion/AdhesionFab.tsx`, monté globalement dans `App.tsx`) n'est masqué que sur une liste de routes. Il ne tient aucun compte de l'état de connexion : un utilisateur connecté (ex. Gaspard Boréal) le voit donc partout ailleurs.

## Correction
Dans `src/components/adhesion/AdhesionFab.tsx` :
- Utiliser le hook `useAuth()` (déjà utilisé par `PublicTopBar`) pour lire l'utilisateur courant.
- Retourner `null` dès qu'un utilisateur est connecté, en plus des exclusions de routes existantes.
- Attendre la fin du chargement de la session (`loading`) avant d'afficher le bouton, pour éviter un flash du CTA au premier rendu chez un utilisateur connecté.

Aucun changement pour les visiteurs non connectés : le bouton reste affiché exactement comme aujourd'hui, avec les mêmes routes exclues.

## Note
Le libellé équivalent dans `src/components/carte-mdv/views/MapView.tsx` est déjà conditionné à `user` — rien à modifier là-bas.
