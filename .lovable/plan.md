# Plan de correction

## Diagnostic
Le `87` affiché dans le chatbot n’est pas un bug de rendu : c’est une conséquence directe de la règle `mergeGenusIntoSpecies()` appliquée dans `useExplorationSpeciesPool`.

Pour l’exploration `20dd3be8-e594-492c-998a-5c4d009a5094` :
- union canonique `biodiversity_snapshots ∪ marcheur_observations` = `92` espèces/taxons distincts
- fusions taxonomiques appliquées ensuite = `5`
- total post-fusion utilisé par le chatbot = `87`

Les 5 fusions détectées sont :
- `Aesculus` -> `Aesculus hippocastanum`
- `Arion` -> `Arion vulgaris`
- `Corylus` -> `Corylus avellana`
- `Quercus` -> `Quercus robur`
- `Rubus` -> `Rubus idaeus`

Le problème est donc architectural :
- le chiffre affiché dans `Liste des espèces (...)` utilise une liste déjà “compressée”
- alors que partout ailleurs la référence métier attendue est le total canonique `92`

## Correction proposée

### 1. Séparer clairement les deux notions dans `useExplorationSpeciesPool`
Faire retourner le hook avec deux niveaux explicites :
- `rawSpecies`: union canonique non fusionnée, utilisée pour le comptage métier et les pièces jointes “liste complète”
- `mergedSpecies`: version fusionnée, utilisée uniquement là où l’on veut réduire les doublons visuels
- `rawCount` et `mergedCount`

Objectif : ne plus faire dépendre le compteur métier d’une optimisation de présentation.

### 2. Aligner le chatbot sur le total canonique
Dans `CommunityChatBotMount` :
- utiliser `rawCount` pour le libellé du menu `Liste des espèces (92)`
- attacher par défaut la liste canonique complète au chatbot quand l’utilisateur la demande explicitement
- conserver le format compact actuel pour rester frugal

Comme le cap est déjà `200`, envoyer `92` entrées compactes reste acceptable et cohérent avec l’intention utilisateur.

### 3. Garder la fusion taxonomique seulement là où elle est voulue
Ne plus appliquer `mergeGenusIntoSpecies` comme comportement implicite “global”.
La fusion doit devenir une vue optionnelle d’affichage, pas la source unique.

Concrètement :
- chatbot / export / comptages globaux : source canonique non fusionnée
- vues de confort visuel si nécessaire : source fusionnée

### 4. Ajouter une garde de cohérence
Ajouter une petite couche défensive pour éviter ce type d’écart à l’avenir :
- nommer explicitement les compteurs (`rawCount`, `mergedCount`) au lieu de réutiliser `speciesPool.length`
- éviter toute ambiguïté dans les labels UI
- si une fusion est appliquée, elle ne doit jamais modifier le total métier affiché sans intention explicite

## Validation prévue
Après implémentation, vérifier :
- le dropdown affiche bien `Liste des espèces (92)` sur cette exploration
- la pièce jointe envoyée au chatbot contient bien les 92 taxons attendus
- les autres vues qui utilisent volontairement la fusion continuent à fonctionner sans régression
- plus aucun écart entre le chatbot et la source canonique `snapshots ∪ marcheur_observations`

## Détails techniques
Fichiers à modifier ensuite :
- `src/hooks/useExplorationSpeciesPool.ts`
- `src/components/chatbot/CommunityChatBotMount.tsx`
- éventuellement les consommateurs qui veulent explicitement la version fusionnée

Approche recommandée :
```text
source canonique (92)
  -> rawSpecies/rawCount
  -> mergedSpecies/mergedCount (optionnel, pour affichage seulement)

chatbot label + attachment
  -> rawCount + rawSpecies

UI de confort visuel
  -> mergedSpecies
```

Cette correction est minimale, robuste, et remet le chatbot en cohérence stricte avec le référentiel métier attendu.