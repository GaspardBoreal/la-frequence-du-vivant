## Objectif

Centrer les 3 colonnes de liens (**L'association** / **Explorer les Marches** / **Administration**) dans le footer variant `marches`, sur les pages `/marches-du-vivant`, `/marches-du-vivant/entreprises`, `/marches-du-vivant/explorer`, `/marches-du-vivant/association`.

## Changement

Fichier : `src/components/Footer.tsx`

Dans le variant `isMarches`, ajouter le centrage du texte sur chaque colonne :
- Ajouter `text-center` sur les 3 `<div className="space-y-4">` (uniquement quand `isMarches === true`)
- Retirer/neutraliser les alignements `text-center sm:text-left` hérités du variant par défaut, non pertinents ici

Le variant par défaut (page d'accueil, etc.) reste inchangé.

## Vérification

Screenshot Playwright de `/marches-du-vivant` pour confirmer que les 3 titres de colonnes du footer sont centrés horizontalement dans leur colonne.
