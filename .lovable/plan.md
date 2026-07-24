## Diagnostic

Dans `src/pages/MarchesDuVivantConnexion.tsx` (`handleLogin`, lignes ~119-130), le code appelle `get_user_apps_access` puis **redirige silencieusement** vers la propriété principale (ou la première) sans demander à l'utilisateur. C'est pourquoi Gaspard Boréal, référent principal de « Jardin Monde DEVIAT », est envoyé directement sur `/propriete/jardin-monde-deviat` sans choix.

Deux cas doivent être distingués :
- **1 seul espace disponible** (Mon Espace uniquement, ou 1 propriété uniquement) → redirection directe, aucun dialogue.
- **≥ 2 espaces disponibles** (Mon Espace marcheur + 1 ou N propriétés) → **dialogue de choix** après connexion réussie.

## Plan

### 1. Nouveau composant `AppChoiceDialog`
Fichier : `src/components/community/AppChoiceDialog.tsx`

- Modal (shadcn `Dialog`) affiché après login réussi quand l'utilisateur a accès à ≥ 2 espaces.
- Titre : « Bienvenue {prenom} ! Où souhaitez-vous aller ? »
- Liste de cartes cliquables :
  - **Mon Espace Marcheur** (toujours présent) — icône Leaf, sous-titre « Vos marches, votre carnet, votre progression ».
  - Une carte par propriété accessible — image `photo_hero_url` en fond, nom, ville, badge rôle (« Référent·e », « Marcheur·euse », etc.), badge « Principal » si `is_main`.
- Chaque carte navigue vers `/marches-du-vivant/mon-espace` ou `/propriete/{slug}` puis ferme le dialogue.
- Bouton discret « Ne plus me demander — toujours ouvrir {choix} » (stocke dans `localStorage` la clé `mdv:default-app` avec la valeur `mon-espace` ou `propriete:{slug}`).

### 2. Refonte de `handleLogin` dans `MarchesDuVivantConnexion.tsx`
- Après `signIn` + gestion invitation Lecteur invité (inchangée), appeler `get_user_apps_access`.
- Logique :
  1. Si `localStorage['mdv:default-app']` existe et correspond à un espace toujours accessible → redirection directe.
  2. Sinon, si `proprietesAccessibles.length === 0` → redirection directe `/marches-du-vivant/mon-espace` (comportement actuel sans propriété).
  3. Sinon (≥ 1 propriété) → **ouvrir `AppChoiceDialog`** avec la liste `[MonEspace, ...proprietes]`. Ne pas naviguer automatiquement.
- État local `appChoice: { open: boolean; apps: ProprieteAccess[] }` pour piloter le dialogue.

### 3. Comportement attendu pour Gaspard
Gaspard est référent de « Jardin Monde DEVIAT » **et** marcheur → il verra désormais un dialogue avec 2 cartes (Mon Espace + Jardin Monde DEVIAT), au lieu d'être redirigé silencieusement.

### 4. Hors scope
- La redirection post-inscription (`handleRegister`) reste inchangée (dialogue de confirmation email d'abord).
- Pas de changement backend : la RPC `get_user_apps_access` renvoie déjà les bonnes données.
- Pas de changement dans `AppSwitcher` (déjà présent dans le header de Mon Espace).

### Fichiers modifiés
- `src/components/community/AppChoiceDialog.tsx` (nouveau)
- `src/pages/MarchesDuVivantConnexion.tsx` (handleLogin + rendu du dialogue)
