# Correctif « Seuil du Vivant » — rendre le bandeau toujours diagnosticable

## Problème observé
Sur le profil Ines Darroman (11 obs iNat / 4 reconnues), le bandeau n'apparaît pas. Il est masqué par la condition `pendingCount === 0`, qui retourne `null` aussi bien quand :
- tout va bien (rien à montrer)
- le login iNat n'a pas pu être résolu
- aucun alias n'a été passé au composant
- l'API iNat n'a rien renvoyé

→ aucun feedback, aucune pédagogie.

## Objectif
Le bandeau doit **toujours s'afficher** dès qu'on suspecte qu'un marcheur a un compte iNat — même à 0 pending — et il doit raconter pourquoi. C'est précisément ce qui transforme un filtre silencieux en pédagogie inspirante.

## Plan

### 1. Logique d'affichage du bandeau

Dans `EnCheminBanner.tsx`, remplacer `if (pendingCount === 0) return null` par 4 états visuels :

| État | Condition | Apparence |
|---|---|---|
| **Loading** | `isLoading` | skeleton actuel |
| **Login introuvable** | `!hasInatLogin` | bandeau gris doux « Pas encore de compte iNat détecté · Découvrir comment vos photos sont reconnues → » |
| **Toutes franchies** | `hasInatLogin && pendingCount === 0` | bandeau vert doux ✨ « Toutes vos {N} obs ont franchi le seuil · Comprendre la démarche → » |
| **En chemin** | `hasInatLogin && pendingCount > 0` | bandeau actuel (vert/ambre) |

Le clic ouvre dans tous les cas le drawer pédagogique (qui s'adapte à l'état).

### 2. Adapter le hook pour exposer l'état de résolution

`useMarcheurInatPending` renvoie déjà `login`. Ajouter dans le retour :
- `hasInatLogin: boolean` (`!!login`)
- `inatProfileResolved: boolean` (distingue « en cours de résolution » vs « pas de compte »)
- `marcheCount: number` (debug)

### 3. Adapter `ContributionsSubTab`

Passer `hasInatLogin` et `inatProfileResolved` au bandeau. Toujours rendre `<EnCheminBanner>` (jamais conditionné en amont).

### 4. Drawer `SeuilDuVivantDrawer` — branche « login introuvable »

Si `inatLogin === null`, le drawer affiche :
- la mini-frise pédagogique (inchangée)
- un bloc *« Vos observations vivent sur iNaturalist. Si vous avez un compte, indiquez-le dans votre profil pour que vos obs apparaissent automatiquement ici. »*
- pas de liste

### 5. Diagnostic alias (optionnel mais utile pour Ines)

Dans `useMarcheurInatProfile`, si **aucun match alias** mais qu'on a quand même des attributions iNat dans les snapshots des marches de cette exploration, garder une trace : `console.debug('[seuil] alias mismatch', { aliases, observerNames })`. Permet de diagnostiquer rapidement ce genre de cas (alias normalisé « ines-darroman » vs login « inesia »).

**Pas de correctif automatique du matching** ici — c'est le rôle de la table `marcheurs_inat_accounts` (déjà existante via `useMarcheursInatAccounts`). Si Ines a une entrée dans cette table, on doit **préférer ce login à la résolution par alias**.

### 6. Fallback prioritaire : compte iNat déclaré

`useMarcheurInatPending` doit accepter un `inatAccount` optionnel (récupéré par le parent via `useMarcheursInatAccounts`). Si présent, on prend ce `login` directement, court-circuitant `useMarcheurInatProfile`. C'est probablement ce qui manque pour Ines (son compte est sans doute déjà rattaché manuellement côté admin).

## Fichiers touchés
- `src/hooks/useMarcheurInatPending.ts` — accepter `inatAccount?.login`, exposer `hasInatLogin` + `inatProfileResolved`
- `src/components/community/exploration/marcheurs/EnCheminBanner.tsx` — 4 états
- `src/components/community/exploration/marcheurs/SeuilDuVivantDrawer.tsx` — branche « pas de login »
- `src/components/community/exploration/MarcheursTab.tsx` — passer `inatAccount` au hook, supprimer condition d'affichage

## Hors scope
- Pas de migration DB
- Pas de modif backfill
- Pas d'auto-matching d'alias (reste manuel via admin)

## Recommandation
Faire §6 en premier (1 ligne de plus dans la prop du hook) — c'est probablement la résolution immédiate pour Ines. Puis §1+§2+§4 pour ne plus jamais avoir de disparition silencieuse.
