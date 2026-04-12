
## Diagnostic

Oui, il y a très probablement un problème de requête, mais ce n’est pas seulement “la photo de Victor” : le code mélange actuellement deux périmètres de données différents dans l’onglet **Marcheurs**.

### Ce que j’ai trouvé dans le code

- Dans `useExplorationParticipants.ts`, les compteurs de photos/vidéos des marcheurs sont calculés sur **tous les `marche_events` de l’exploration** :
  - récupération de tous les events de l’exploration
  - puis requête `marcheur_medias` avec `.in('marche_event_id', eventIds)`
- En revanche, dans `MarcheursTab.tsx`, le sous-onglet **Observations** d’un marcheur recharge ses médias avec un filtre beaucoup plus étroit :
  - `.eq('user_id', userId)`
  - `.eq('is_public', true)`
  - puis, si `marcheEventId` est fourni, `.eq('marche_event_id', marcheEventId)`

### Conséquence visible à l’écran

Cela crée une incohérence :

- le badge d’un marcheur peut afficher des photos publiques parce qu’elles existent **quelque part dans l’exploration**
- mais la grille ouverte sous sa carte peut être vide ou incomplète parce qu’elle ne regarde que **le `marcheEventId` courant**

C’est exactement le type de symptôme montré par ta capture : on a l’impression qu’“il manque des contributions”, alors que l’interface affiche un total calculé sur un périmètre plus large que la liste réelle.

## Cause probable du bug

Le bug n’est pas forcément dans Supabase ni dans la donnée elle-même. Il est surtout dans la logique front :

```text
Badge marcheur = exploration entière
Grille observations = un seul event
=> décalage visuel / impression de requête cassée
```

Et comme la page actuelle est une exploration multi-étapes, ce décalage devient très visible.

## Plan de correction

1. **Aligner les périmètres de données**
   - faire en sorte que la grille “Observations” d’un marcheur utilise le même périmètre que ses stats :
     - soit toute l’exploration
     - soit uniquement l’event courant
   - le plus cohérent ici semble être : **toute l’exploration**, puisque la page est centrée sur l’exploration et que les badges fonctionnent déjà ainsi

2. **Refactorer `ObservationsSubTab`**
   - lui passer les `eventIds` de l’exploration, ou un indicateur explicite de périmètre
   - remplacer le filtre `eq('marche_event_id', marcheEventId)` par un filtre cohérent avec l’exploration (ex: `in('marche_event_id', eventIds)`)

3. **Rendre le comportement explicite dans l’UI**
   - si on reste sur le périmètre exploration : libeller implicitement/visuellement que ce sont les observations publiques du marcheur dans l’exploration
   - éviter toute ambiguïté entre “sur cette marche”, “sur cet event”, “dans cette exploration”

4. **Vérifier aussi les autres sous-onglets / compteurs**
   - contrôler que les résumés et badges de `MarcheursTab` utilisent tous le même niveau de filtre
   - éviter d’autres incohérences similaires entre cartes, compteurs et contenus détaillés

5. **Tester le cas Victor / Gaspard**
   - vérifier qu’un marcheur avec contributions publiques apparaît avec :
     - le bon compteur
     - la bonne grille de photos
     - le même nombre perçu entre carte fermée et contenu ouvert

## Fichiers concernés

- `src/hooks/useExplorationParticipants.ts`
- `src/components/community/exploration/MarcheursTab.tsx`
- possiblement `src/components/community/ExplorationMarcheurPage.tsx` si on doit transmettre proprement le contexte exploration/event au composant

## Détail technique

### Incohérence actuelle

```text
useExplorationParticipants
  -> stats sur tous les events de l’exploration

ObservationsSubTab
  -> photos sur le seul marcheEventId courant
```

### Correction recommandée

```text
MarcheursTab
  -> calcule / récupère les eventIds de l’exploration
  -> les transmet à ObservationsSubTab

ObservationsSubTab
  -> requête marcheur_medias avec:
     user_id = marcheur
     is_public = true
     marche_event_id IN (events de l’exploration)
```

### Bénéfice

- plus de cohérence perçue
- plus de “fausse disparition” de photos
- les contributions de Victor / Gaspard seront affichées au même niveau logique que celui utilisé pour les stats

