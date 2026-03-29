

# Fix: Boutons modifier/supprimer — diagnostic approfondi

## Analyse

Le correctif CSS precedent (`sm:opacity-0 sm:group-hover:opacity-100`) est syntaxiquement correct : sur mobile (< 640px), les prefixes `sm:` ne s'appliquent pas, donc l'opacite par defaut (1) est utilisee — les boutons devraient etre visibles.

Cependant, le probleme reside potentiellement dans un **comportement CSS implicite**. Sans `opacity-100` explicite, certains navigateurs ou certaines cascades CSS pourraient ne pas appliquer l'opacite attendue, surtout avec `transition-opacity` present.

### Problemes identifies

1. **Opacite implicite sur mobile** : La classe `transition-opacity` est presente mais sans valeur d'opacite explicite sur mobile. Il faut ajouter `opacity-100` comme valeur de base pour garantir la visibilite.

2. **Pas de `userId` guard dans les tabs** : `userId` est `string | undefined` (ligne 72 de ExplorationMarcheurPage). Il est passe directement aux VoirTab/EcouterTab/LireTab qui attendent `string`. Si undefined :
   - `useMarcheurMedias` a `enabled: !!userId` → false → aucun media ne charge
   - Les contributions de l'utilisateur sont invisibles
   - Il faut ajouter un guard `userId || ''` avec une gestion correcte

## Correctifs

### Fichier 1 : `src/components/community/contributions/ContributionItem.tsx`

Ligne 171 — Ajouter `opacity-100` explicite :
```
// Avant
<div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">

// Apres
<div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
```

### Fichier 2 : `src/components/community/ExplorationMarcheurPage.tsx`

Lignes 316-326 — Ajouter un guard pour `userId` afin que les tabs ne soient rendus que quand l'utilisateur est connecte (sinon impossible de determiner `isOwner`) :

```typescript
// Avant
{activeSensoryTab === 'voir' && (
  <VoirTab marcheId={activeMarcheId || ''} userId={userId} ... />
)}

// Apres
{activeSensoryTab === 'voir' && userId && (
  <VoirTab marcheId={activeMarcheId || ''} userId={userId} ... />
)}
```

Ajouter le meme guard pour `ecouter`, `lire` et `vivant`. Si `userId` n'est pas encore charge, afficher un message "Connectez-vous pour voir et gerer vos contributions".

## Fichiers impactes

| Fichier | Action |
|---|---|
| `src/components/community/contributions/ContributionItem.tsx` | Ajouter `opacity-100` explicite sur les boutons owner |
| `src/components/community/ExplorationMarcheurPage.tsx` | Guard `userId` avant rendu des tabs sensoriels |

