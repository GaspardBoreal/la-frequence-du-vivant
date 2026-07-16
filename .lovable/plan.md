
## Contexte

Aujourd'hui le bouton flottant universel **"Rejoindre la Fréquence"** (`AdhesionFab`) ouvre le formulaire d'adhésion à l'association loi 1901 (`AdhesionDialog`). Beaucoup de marcheurs le confondent avec la création de compte marcheur (`/marches-du-vivant/connexion`), qui est ce qu'ils cherchent en réalité.

## Objectif

Réserver le formulaire d'adhésion à la **page Association** (là où le contexte est clair), et faire du bouton universel une porte d'entrée directe vers l'**inscription marcheur**.

## Changements

### 1. Bouton flottant universel → inscription marcheur
- `AdhesionFab` : au clic, ne plus ouvrir le dialog d'adhésion. Rediriger vers `/marches-du-vivant/connexion?tab=register`.
- Le libellé reste "Rejoindre la Fréquence" (identité de marque conservée).
- Le composant est déjà masqué sur `/marches-du-vivant/mon-espace`, `/admin`, `/adhesion`, etc. On ajoute `/marches-du-vivant/association` à la liste `hideOn` pour éviter tout doublon avec le CTA dédié de cette page.

### 2. Page Association → CTA "Rejoindre l'association"
- Ajouter, dans `src/pages/MarchesDuVivantAssociation.tsx`, un CTA visible "Rejoindre l'association" qui ouvre l'`AdhesionDialog` (comportement actuel du FAB, cf. capture jointe).
- Emplacement suggéré : à côté / au-dessus du bloc final "Rejoindre la communauté" (qui, lui, garde son lien vers la création de compte marcheur — ce sont deux actions différentes).
- Style aligné sur la charte de la page (violet/emerald existants).

### 3. Page Connexion → prise en compte de `?tab=register`
- `src/pages/MarchesDuVivantConnexion.tsx` : dans le `useEffect` déjà présent (l.67), lire `searchParams.get('tab')` et, si la valeur vaut `register`, faire `setMode('register')`.
- Les paramètres existants (`affiliate`, `invitation`) continuent de fonctionner et forcent déjà `mode = 'register'`, donc pas de régression.

## Résultat pour l'utilisateur

- Depuis n'importe quelle page publique, cliquer sur "Rejoindre la Fréquence" ouvre directement l'onglet **Inscription** de la page Connexion → plus de confusion.
- Sur la page **Association**, un bouton clair "**Rejoindre l'association**" ouvre le formulaire loi 1901 (collèges, adhésion, etc.).
- Sur la page Association, le FAB flottant est masqué pour éviter le doublon.

## Détails techniques

- Fichiers modifiés :
  - `src/components/adhesion/AdhesionFab.tsx` — remplacer `onClick` par un `<Link to="/marches-du-vivant/connexion?tab=register">`, ajouter `/marches-du-vivant/association` dans `hideOn`, retirer l'usage local d'`AdhesionDialog` et de son `useState`.
  - `src/pages/MarchesDuVivantAssociation.tsx` — importer `AdhesionDialog`, ajouter un bouton "Rejoindre l'association" avec state local `open`.
  - `src/pages/MarchesDuVivantConnexion.tsx` — dans le `useEffect` initial, ajouter `if (searchParams.get('tab') === 'register') setMode('register');`.
- Aucun changement de logique métier, aucune migration DB, aucune modification du formulaire d'adhésion ni du flux d'inscription marcheur.

Confirme si tu valides — je passe en implémentation.
