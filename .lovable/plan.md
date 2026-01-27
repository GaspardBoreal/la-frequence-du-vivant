

## Plan : Centrer "Choisissez un cas de délibération"

### Diagnostic

Le texte est dans un `<p>` à l'intérieur d'un `<div className="text-center">`, donc il devrait être centré. Cependant, le problème visuel peut provenir du fait que le conteneur parent (`max-w-lg`) n'est pas lui-même centré correctement dans certains cas.

### Solution

Ajouter explicitement `text-center` au paragraphe lui-même pour garantir le centrage indépendamment de la cascade CSS.

### Modification

**Fichier** : `src/components/dordonia/DordoniaParliament.tsx`

**Ligne 132-134** — Modifier :

```tsx
// Avant
<p className="text-muted-foreground mt-2">
  Choisissez un cas de délibération
</p>

// Après
<p className="text-muted-foreground mt-2 text-center">
  Choisissez un cas de délibération
</p>
```

### Résumé

| Fichier | Ligne | Modification |
|---------|-------|--------------|
| `DordoniaParliament.tsx` | 132 | Ajouter `text-center` au `<p>` |

