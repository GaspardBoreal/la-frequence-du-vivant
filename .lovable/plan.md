

# Correction : page "Mon espace" bloquee sur "Chargement..."

## Diagnostic

Le compte `gaspard.boreal@gmail.com` est un compte **admin** cree avant le systeme communautaire. Il n'a donc **aucune ligne dans `community_profiles`**.

Dans `MarchesDuVivantMonEspace.tsx` (ligne 26), la condition `!profile` maintient l'ecran de chargement indefiniment quand le profil est `null` apres le chargement.

## Solution

Deux corrections complementaires :

### 1. `src/pages/MarchesDuVivantMonEspace.tsx` — Gerer l'absence de profil

Remplacer la condition de chargement (ligne 26) pour distinguer "loading" de "pas de profil" :

- Ajouter un etat derive : si `!loading && user && !profile` → afficher un ecran invitant a completer son profil (avec bouton qui cree le profil minimal automatiquement)
- Concretement : apres le bloc `if (loading)`, ajouter un bloc `if (!profile)` qui affiche un message "Votre profil communautaire n'existe pas encore" avec un bouton "Creer mon profil" qui insere une ligne dans `community_profiles` avec les infos minimales (prenom depuis l'email ou vide)

### 2. `src/hooks/useCommunityAuth.ts` — Ajouter une methode `createProfile`

Ajouter une fonction `createProfile(userId, prenom, nom)` qui fait un `upsert` dans `community_profiles` et rafraichit le profil. Utilisee par le bouton ci-dessus.

### 3. Securiser le loading state

Separer `loading` (auth en cours) de `profileLoading` (profil en cours de fetch) dans le hook pour eviter les etats incoherents. Ou plus simplement, dans la page, ne bloquer sur "Chargement" que si `loading` est true, et traiter `!profile` comme un cas distinct.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/pages/MarchesDuVivantMonEspace.tsx` | Modifier (gerer `!profile` separement) |
| `src/hooks/useCommunityAuth.ts` | Modifier (ajouter `createProfile`) |

