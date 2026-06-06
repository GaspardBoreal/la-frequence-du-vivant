## Problème

Dans l'onglet **Marcheurs** d'une exploration, le petit lien `↗ iNat` à côté du nom n'apparaît que pour 2 marcheurs sur 25 — alors que les 25 ont bien renseigné leur compte iNaturalist dans leur profil (table `community_profile_science_accounts`, 25 lignes `network='inaturalist'`).

### Cause racine

Le hook actuel `useMarcheurInatProfile` (utilisé dans `MarcheursTab.tsx` ligne 1074) ne résout le profil iNat **que** si une observation iNat est déjà rattachée au marcheur dans `biodiversity_snapshots.species_data` (via matching d'alias). Tant qu'un marcheur n'a pas d'observation iNat publiée et rattachée à cette exploration, son lien n'apparaît jamais — même s'il a un compte iNat déclaré sur son profil.

→ Aujourd'hui seuls **Victor Boixeda** et **Les marches du Vivant** ont des attributions iNat actives sur cette marche, d'où les 2 seuls liens visibles.

## Proposition

Faire du **compte iNat déclaré dans le profil** la source primaire du lien (toujours fiable, dispo dès qu'un marcheur l'a renseigné), et garder la résolution par observation comme enrichissement.

### 1. Nouveau hook `useMarcheursInatAccounts(userIds)` (batch)

- Une seule requête : `community_profile_science_accounts` JOIN `community_profiles` sur `profile_id`, filtré par `network='inaturalist'` et `user_id IN (…)`.
- Retourne une `Map<userId, { username, profile_url, verified }>`.
- RLS déjà OK : policy SELECT `readable by all` → accessible aux marcheurs connectés et admins.
- Construit `profile_url` via `buildProfileUrl()` de `src/types/scienceAccounts.ts` si la colonne est `NULL`.

### 2. Intégration dans `MarcheursTab.tsx`

- Au niveau du composant parent (liste), appeler **une fois** `useMarcheursInatAccounts` avec tous les `userId` de la liste → évite N requêtes.
- Passer la map à chaque `MarcheurCard` via prop `inatAccount?: { login, profile_url }`.
- Dans le rendu du badge `iNat` (lignes 1132-1144) : prioriser `inatAccount` sur le résultat de `useMarcheurInatProfile`. Logique :
  - `const inatLink = inatAccount ?? (inatProfile?.login ? { login: inatProfile.login, profile_url: inatProfile.profile_url } : null);`
- Le badge utilise déjà `ExternalLink` + texte « iNat » → aucun changement visuel, juste plus de liens affichés.

### 3. Hors périmètre

- Pas de modification de `useMarcheurInatProfile` (conservé pour les attributions réelles utilisées ailleurs : CitizenPlatformsCard, ContributionsSubTab).
- Pas de migration SQL — la table existe et est lisible.
- Pas de changement sur les autres réseaux (eBird, GBIF, Pl@ntNet…) — peuvent être ajoutés ensuite si souhaité avec le même pattern.

### Fichiers touchés

- **Créé** : `src/hooks/useMarcheursInatAccounts.ts`
- **Édité** : `src/components/community/exploration/MarcheursTab.tsx` (appel batch + prop + fallback dans le badge)

### Résultat attendu

Les 25 marcheurs avec compte iNat déclaré afficheront immédiatement le lien `↗ iNat` cliquable vers leur profil iNaturalist, indépendamment de la présence d'observations rattachées à la marche en cours.
