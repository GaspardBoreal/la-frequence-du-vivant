## Diagnostic — pourquoi le Marronnier (Aesculus hippocastanum) manque

Trois causes cumulées dans le pipeline `classifyFunctions` (`src/lib/ecologicalFunctionsClassification.ts`) :

1. **Aucune règle de genre `Aesculus**` dans `GENUS_RULES` (et pas non plus dans la KB curée).
2. **La famille est inutilisable telle qu'elle arrive d'iNaturalist** : la base stocke `family: "58321"` (ID taxonomique iNat = Sapindaceae) au lieu du nom. Le garde-fou `isUsableFamily` rejette donc tout, et la règle `Sapindaceae → ['arbre','mellifere']` qui existe pourtant ne se déclenche jamais.
3. **Le hook ne passe même pas `family**` : dans `useEcologicalFunctions.ts` ligne 45, `family: null` est hardcodé. Donc, même si la famille était propre, elle ne descendrait pas au classifier.

Conséquence : seuls les genres listés explicitement (Quercus, Tilia, Fagus, Salix, etc.) sont reconnus comme "arbre". Tout le reste tombe dans le vide. Le même bug touchera **Platanus, Pinus, Cedrus, Liquidambar, Liriodendron, Betula, Juglans, Ulmus**… et 95 % des arbres ornementaux urbains de Dordogne et d'ailleurs.

## Stratégie — solution robuste pour cette marche ET toutes les suivantes

L'idée : **utiliser la connaissance déjà présente dans `plantStrate.ts**` (qui sait que `Aesculus → arbre`) comme **source de vérité partagée** pour le tag `arbre`, et résoudre le mapping famille proprement.

### 1. Pont strate → fonction écologique (fix structurel)

Dans `useEcologicalFunctions.ts`, après `classifyFunctions(...)` :

- appeler `resolveStrate({ scientificName })`
- si la strate est `arbre` ou `arbuste` *et* que le règne/iconic vaut Plantae/Plants, **ajouter automatiquement** le tag `arbre` (et `haie_bocage` pour les arbustes ligneux courants comme Crataegus/Cornus/Viburnum).
- garder la déduplication via Set.

Effet : **tout genre déjà cartographié en `GENUS_STRATE: 'arbre'` devient automatiquement un "Arbre"**, sans dupliquer la connaissance. Marronnier ✓, Platane ✓, Pin ✓, Cèdre ✓, Bouleau ✓…

### 2. Enrichir le pool avec une famille propre

Dans `useExplorationSpeciesPool.ts`, déjà-conserver `sp.family` quand c'est un **nom alphabétique** (pas un ID numérique). Le passer ensuite au classifier. Cela réactive les `FAMILY_RULES` existantes (Sapindaceae, Fagaceae, Rosaceae…) qui couvrent tous les arbres restants.

### 3. Compléter `GENUS_RULES` côté éco-fonctions pour la robustesse défensive

Ajouter explicitement : `Aesculus, Platanus, Pinus, Cedrus, Abies, Picea, Betula, Juglans, Ulmus, Liquidambar, Liriodendron` avec au minimum `['arbre']`, plus `vieil_arbre` pour les longévifs (Aesculus, Platanus, Quercus, Tilia, Fagus, Castanea, Cedrus) — la mémoire projet "12 tags multi-étiquettes" inclut déjà `vieil_arbre`.

### 4. Override éditorial pérenne — `exploration_curations`

Le système de curation existe déjà (cf. `useExplorationCurations`). Exposer dans l'onglet **Découverte du vivant**, sur chaque vignette espèce, un petit menu "Ajuster les tags écologiques" pour un ambassadeur/sentinelle/admin :

- coche/décoche les 12 fonctions
- la curation l'emporte sur l'auto-classification
- valable pour cette exploration uniquement (override local) **ou** marquable "à propager à la KB globale" (création d'une PR de mise à jour de `species-knowledge-base.json`)

Ainsi : pour les marches futures, la connaissance accumulée par les marcheurs **enrichit la base** au lieu de se perdre.

## Périmètre du changement

```text
src/hooks/useEcologicalFunctions.ts          modifié  (pont strate + family)
src/hooks/useExplorationSpeciesPool.ts       modifié  (conserve family alpha)
src/lib/ecologicalFunctionsClassification.ts modifié  (genres arbres manquants)
```

Étape 4 (UI curation tags) est plus large : à confirmer avant de l'inclure dans le même lot, ou à séparer dans un second plan.

## Détails techniques

- Garde-fou `isUsableFamily` reste utile (filtre les IDs numériques iNat).
- Dans le pont strate, ne **pas** ajouter `arbre` si `iconic`/`group` indique un règne non-plante (sécurité contre faux positifs sur des genres homonymes).
- Pas de migration DB nécessaire pour les étapes 1-3.
- Étape 4 ré-utilise la table `exploration_curations` déjà en place (colonne `functions` mentionnée dans la mémoire des fonctions écologiques).

## Question avant de coder

inclue dans ce même lot l'**UI de curation des tags** (étape 4) — pour qu'un ambassadeur puisse corriger en 2 clics depuis la vignette espèce 