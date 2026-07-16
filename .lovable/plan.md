
## Objectif

Déplacer l'ouverture du panneau « Votre progression » du bloc RÔLE (retiré de la page d'accueil) vers le badge de rôle dans la topbar.

## Changements

### 1. Extraire le panneau en composant autonome
Créer `src/components/community/ProgressionSheet.tsx` qui contient uniquement le `Sheet` détaillé (rôle actuel, encouragement, barre + jalons), piloté par des props `open` / `onOpenChange` et les données de progression (`role`, `marchesCount`, `formationValidee`, `certificationValidee`, `pendingCount`).

### 2. Supprimer `ProgressionCard` de l'accueil
- Retirer `<ProgressionCard>` et son import dans `src/components/community/tabs/AccueilTab.tsx`. La page d'accueil ne conservera que `FrequenceWave` (les 3 boutons rapides ont déjà été retirés).
- Supprimer le fichier `ProgressionCard.tsx` (plus aucun usage).

### 3. Rendre le badge de rôle cliquable dans la topbar
Dans `src/components/community/MonEspaceHeader.tsx` :
- Ajouter un state local `progressionOpen`.
- Envelopper `<RoleBadge>` dans un `<button>` (aria-label « Voir votre progression ») qui ouvre le sheet.
- Rendre `<ProgressionSheet>` contrôlé par ce state.
- Étendre les props du header pour recevoir `marchesCount`, `formationValidee`, `certificationValidee`, `pendingCount` (déjà tous disponibles dans `MarchesDuVivantMonEspace.tsx` : via `profile.*` et `pendingCount`).

### 4. Câbler depuis la page parente
`src/pages/MarchesDuVivantMonEspace.tsx` : passer les nouvelles props à `<MonEspaceHeader>` (aucune nouvelle donnée à calculer, tout existe déjà l.185).

## Résultat

- Page d'accueil épurée : seulement la vague de Fréquences.
- Le badge de rôle en topbar (visible sur tous les onglets de Mon Espace) ouvre le panneau « Votre progression » identique à celui d'avant.

## Détails techniques

- Fichiers modifiés : `AccueilTab.tsx`, `MonEspaceHeader.tsx`, `MarchesDuVivantMonEspace.tsx`.
- Fichiers créés : `ProgressionSheet.tsx`.
- Fichiers supprimés : `ProgressionCard.tsx`.
- Aucune modification de logique métier ni du contenu du panneau.
