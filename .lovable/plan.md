## Diagnostic
L’association de la pratique fonctionne bien en base, mais elle n’impacte pas la Fréquence car le calcul lit le mauvais identifiant côté frontend.

### Constat vérifié
- La liaison existe bien en base pour Jean‑François Servant :
  - `exploration_curations.title = "Culture de Colza"`
  - `curation_marcheurs.marcheur_id = 988e821e-196d-4cb6-b8ff-803adb5c2234`
- Jean‑François existe bien dans `exploration_marcheurs` avec ce même `id`.
- Le score n’utilise pas toujours cet identifiant base : plusieurs composants passent `marcheur.id`, qui est parfois un identifiant UI synthétique du type `community-<user_id>` ou `crew-<uuid>`.
- Or `useMarcheurPratiques()` et `useMarcheursPratiquesCounts()` interrogent `curation_marcheurs.marcheur_id`, qui attend exclusivement un vrai `exploration_marcheurs.id`.

### Cause racine
Mismatch entre :
- **ID UI de participant** (`community-...` / `crew-...`) utilisé pour afficher les personnes
- **ID relationnel base** (`exploration_marcheurs.id`) utilisé dans `curation_marcheurs`

Résultat :
- l’écriture de l’association marche,
- mais la relecture pour le score et la carte “Pratiques portées” retombe à 0.

## Correction robuste proposée

### 1. Normaliser la source d’identité pour les pratiques
Corriger tous les consommateurs de pratiques pour qu’ils utilisent toujours le vrai `crewId` quand il existe, jamais `marcheur.id` directement.

À corriger en priorité :
- `src/components/community/exploration/impact/MarcheurImpactPanel.tsx`
  - remplacer `useMarcheurPratiques(marcheur.id)` par `useMarcheurPratiques(resolvedCrewId)`
- `src/components/community/exploration/impact/PratiquesPorteesCard.tsx`
  - lui passer le vrai `crewId` résolu, pas l’ID synthétique d’affichage
- tout autre usage similaire détecté pendant l’implémentation

### 2. Centraliser la résolution d’identité
Pour éviter que le bug revienne ailleurs, introduire une règle unique :
- **identité d’affichage** : `marcheur.id`
- **identité relationnelle pour pratiques / observations / rattachements** : `marcheur.crewId` si présent, sinon `null`

Option robuste : petit helper partagé, par exemple :
- `resolveMarcheurRelationIds(marcheur)`
- retourne `userId`, `crewId`, `uiId`

Ainsi, tous les composants critiques consommeront la même logique au lieu de réinventer la résolution localement.

### 3. Sécuriser le hook de lecture des pratiques
Durcir `useMarcheurPratiques()` pour expliciter qu’il prend un `crewId` réel uniquement.

Améliorations proposées :
- renommer le paramètre en `crewId`
- court-circuiter immédiatement si la valeur ressemble à un ID synthétique (`community-` / `crew-`)
- documenter clairement dans le hook qu’il cible `curation_marcheurs.marcheur_id`

But : empêcher qu’un futur appel incorrect produise silencieusement un faux zéro.

### 4. Vérifier le calcul agrégé dans la liste des marcheurs
`MarcheursTab` semble déjà alimenter `useMarcheursPratiquesCounts()` avec les IDs UI `m.id`.
Il faut le corriger pour envoyer les vrais `crewId` disponibles.

Correction proposée :
- construire la liste à partir de `marcheurs.map(m => m.crewId).filter(Boolean)`
- lors du rendu, lire le compteur avec `m.crewId` plutôt que `m.id`
- conserver `0` pour les participants sans carte `exploration_marcheurs`

C’est important car sinon :
- le score détaillé du panneau impact peut être faux,
- et la liste globale des marcheurs peut rester désynchronisée.

## Validation attendue
Après implémentation, vérifier les cas suivants :

### Cas principal
- Jean‑François Servant lié à “Culture de Colza”
- la ligne “Pratiques emblématiques” passe de `0 / 10` à `2 / 10`
- le score global augmente en conséquence
- la carte “Pratiques portées par Jean‑François” affiche bien la pratique

### Cas de non-régression
- un marcheur éditorial natif (`source = crew`) conserve un score correct
- un participant communautaire déjà relié à une carte éditoriale (`community + crewId`) remonte bien ses pratiques
- un participant sans `crewId` n’affiche pas de pratique portée tant qu’aucune carte relationnelle n’existe
- l’ajout puis retrait d’une pratique met bien à jour le score après invalidation React Query

## Détails techniques
- Fichiers probablement concernés :
  - `src/components/community/exploration/impact/MarcheurImpactPanel.tsx`
  - `src/components/community/exploration/impact/PratiquesPorteesCard.tsx`
  - `src/components/community/exploration/MarcheursTab.tsx`
  - `src/hooks/useCurationMarcheurs.ts`
- Pas de migration base nécessaire a priori : le problème est dans la lecture / résolution d’identité frontend.
- La base est cohérente : la relation `curation_marcheurs -> exploration_marcheurs.id` fonctionne déjà.

## Résultat visé
Une association de pratique emblématique doit avoir un effet immédiat, cohérent et identique dans :
- le score global de Fréquence,
- le détail “Pratiques emblématiques”,
- la carte “Pratiques portées”,
- la liste des marcheurs.
