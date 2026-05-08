## Objectif

Trier la liste des marcheurs (vue Marcheurs → Marcheurs) par **total de contributions décroissant**, où chaque badge compte pour 1. En cas d'égalité parfaite : tri **alphabétique sur prénom puis nom**.

## Définition du score (cohérent avec les badges visibles)

Pour chaque marcheur :
```
score = photos + vidéos + sons + textes + (témoignage ? 1 : 0) + contributions(leaf)
```
Soit exactement la somme des nombres affichés dans les pastilles à droite de chaque ligne. Exemples du screenshot :
- Gaspard Boréal : 48 + 2 + 2 + 49 = **153**
- Sophie D : 15 + 1 + 1 = **17**

## Tri

```
1. score DESC
2. prénom ASC (locale fr, insensible casse/accents via Intl.Collator)
3. nom ASC (même collator)
```

## Problème actuel

- `useExplorationParticipants` trie déjà par `totalContributions` (= photos+vidéos+sons+textes+`speciesCount`), mais :
  - n'intègre **pas** le témoignage,
  - utilise `speciesCount` (snapshot pré-agrégé) qui peut différer de `realContribCount` affiché dans le badge feuille (calculé via `useWalkerContributionsCount` par carte),
  - ne définit pas de tri secondaire alphabétique.
- Chaque `MarcheurCard` lance son propre `useWalkerContributionsCount` → N requêtes parallèles redondantes (même `in(marche_id, …)` à chaque fois). Inutilisable pour trier au niveau parent sans hisser cette donnée.

## Architecture cible

### 1. Nouveau hook `useExplorationContributionsCounts(explorationId, explorationMarcheIds)`

Une seule requête sur `biodiversity_snapshots`, parcourt tous les `species_data → attributions`, dédoublonne par `scientificName|date|source` **par observateur**, et renvoie une `Map<normalizedFullName, number>`.

Avantages : 1 requête au lieu de N, source de vérité unique réutilisée par le parent (tri) ET par les cartes (badge + compteur sous-onglet).

### 2. Refactor `MarcheursTab` (parent)

```
- appelle useExplorationContributionsCounts → contribsByName
- trie marcheurs avec le score complet :
    score(m) = m.stats.photos + m.stats.videos + m.stats.sons
             + m.stats.textes
             + (testimoniesByUser.has(userKey(m)) ? 1 : 0)
             + (contribsByName.get(normalize(`${m.prenom} ${m.nom}`)) ?? 0)
- tie-break alphabétique via Intl.Collator('fr', { sensitivity: 'base' })
- passe la valeur contributionsCount au composant MarcheurCard en prop
```

### 3. Refactor `MarcheurCard`

- Reçoit `contributionsCount: number` en prop (au lieu d'appeler `useWalkerContributionsCount`).
- Supprime l'appel local au hook → suppression des N requêtes redondantes.
- Le hook `useWalkerContributionsCount` peut alors être retiré (ou conservé en utilitaire local si on veut le réutiliser ailleurs — à vérifier d'un grep).

## Fichiers à modifier

```text
src/components/community/exploration/MarcheursTab.tsx
  - Ajout du nouveau hook (ou import si extrait)
  - Mémoisation `sortedMarcheurs` avec score + collator
  - Passage de contributionsCount à chaque MarcheurCard
  - Suppression de l'appel local useWalkerContributionsCount dans MarcheurCard
```

(Possible extraction du nouveau hook dans `src/hooks/useExplorationContributionsCounts.ts` pour la propreté — recommandé.)

## Notes de robustesse

- `Intl.Collator('fr', { sensitivity: 'base', usage: 'sort' })` gère accents et casse correctement (« Élise » entre « Eliott » et « Émile »).
- `normalize()` (NFD, suppression des accents) déjà utilisé dans le code pour matcher noms d'observateurs : on le réutilise tel quel pour la clé de la Map.
- Si `contribsByName` est encore en chargement, on tombe à 0 pour ce marcheur — l'ordre se réajustera automatiquement quand la requête termine (tri dans `useMemo` dépendant de la Map).
- Performance : le tri se fait côté client sur un tableau déjà petit (≤ quelques dizaines de marcheurs).
- Aucun changement back-end, aucune migration SQL.
