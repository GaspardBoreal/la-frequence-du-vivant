# Doublons de marcheurs — Sentinelles du lieu

## Cause confirmée

`usePropertySpeciesPool` agrège les contributeurs par `marcheur_id` (UUID de la ligne `exploration_marcheurs`). Or **un même humain a une ligne `exploration_marcheurs` par exploration** à laquelle il participe. La propriété « Jardin Monde Deviat » agrège plusieurs marches/explorations → Gaspard Boréal et Laurence Karki apparaissent chacun 2 fois (un `marcheur_id` différent par exploration), avec des stats splittées (107/74 esp., 47/31 esp.).

Le fix doit se faire **après résolution des profils** (là où on connaît `user_id` + nom), pas dans le pool brut — c'est le seul endroit où on peut fusionner de manière fiable.

## Correctif

Modifier `src/hooks/propriete/usePropertyContributors.ts` pour :

1. Après avoir résolu les `exploration_marcheurs` + `community_profiles`, calculer pour chaque contributeur une **clé d'identité canonique** :
   - priorité 1 : `user_id` (si non nul)
   - priorité 2 : `normName(prenom + ' ' + nom)` (NFD, lowercase, trim — cohérent avec `identity-matching-logic` en mémoire)
   - fallback : `marcheurId` (comportement actuel, cas anonyme sans nom)

2. Fusionner les entrées partageant la même clé :
   - `observations` = somme
   - `speciesCount` = **union** des clés espèces, pas somme (nécessite de remonter `speciesKeys: Set<string>` depuis `usePropertySpeciesPool` au lieu d'un simple `speciesCount` déjà agrégé)
   - `lastSeen` = max
   - profil (prenom/nom/avatar/rôle/couleur) = première valeur non nulle, avec préférence au profil issu de `community_profiles`
   - `marcheurIds: string[]` = liste conservée pour debug / futures actions

3. Trier par `observations` desc puis afficher (aucun changement dans `SentinellesBlock.tsx` sauf la `key` qui devient la clé canonique).

## Détails techniques

- `usePropertySpeciesPool.contributorSummaries` : remplacer `speciesCount: number` par `speciesKeys: string[]` (ou garder les deux) pour permettre l'union côté hook contributors.
- `usePropertyContributors` :
  - signature d'entrée inchangée côté appelant ; interne consomme `speciesKeys`.
  - la sortie `PropertyContributor` reste identique + optionnel `marcheurIds?: string[]`.
- `SentinellesBlock.tsx` : changer `key={c.marcheurId}` en `key={c.marcheurIds?.[0] ?? c.marcheurId}` (ou une clé stable dérivée).

## Hors périmètre

- Pas de migration SQL : le doublon est structurel (1 ligne exploration_marcheurs par participation) et légitime côté data. On corrige uniquement l'affichage agrégé propriété.
- Pas de dedup côté carte / delta pour l'instant (à voir dans un second temps si tu veux fusionner aussi les waypoints par personne).
