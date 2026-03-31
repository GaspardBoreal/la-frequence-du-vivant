

# Fix : une seule citation par jour pour tous les utilisateurs

## Cause racine

La fonction `getCitationDuJour` calcule un index déterministe basé sur le jour de l'année — c'est correct. Mais la requête Supabase ne spécifie aucun `ORDER BY`, donc les citations arrivent dans un ordre aléatoire à chaque fetch. Le même index pointe alors vers des citations différentes selon l'ordre reçu, ce qui explique les 4 citations avec `viewed_count = 1`.

## Correction

Dans `FrequenceWave.tsx`, ajouter `.order('id')` à la requête :

```typescript
const { data, error } = await supabase
  .from('frequence_citations')
  .select('id, texte, auteur, oeuvre, url, shown_count, viewed_count')
  .eq('active', true)
  .order('id');  // ← garantit un ordre stable
```

Un seul caractère de changement, un seul fichier impacté.

## Fichier impacté

| Fichier | Action |
|---|---|
| `src/components/community/FrequenceWave.tsx` | Ajouter `.order('id')` à la requête (ligne 69) |

