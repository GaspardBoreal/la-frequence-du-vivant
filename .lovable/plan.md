
## Plan : Corriger l'incompatibilité de type session_id

### Diagnostic technique

- **Table** : `dordonia_parlement`
- **Colonne** : `session_id` (type `uuid`)
- **Valeur envoyée** : `"dord_1769355163807_kd0oo6pad"` (string custom)
- **Erreur** : PostgreSQL rejette cette valeur car ce n'est pas un UUID valide

### Solution recommandée : Modifier le type de colonne

La solution la plus cohérente est de changer le type de la colonne `session_id` de `uuid` vers `text`, car :
1. Le format de session custom est déjà utilisé dans toute l'application (localStorage, autres tables)
2. Changer le générateur de session impacterait les sessions existantes
3. La colonne est nullable, donc aucune contrainte de migration

### Migration SQL

```sql
ALTER TABLE dordonia_parlement 
ALTER COLUMN session_id TYPE text;
```

### Alternative (non recommandée)

Modifier le code pour générer un vrai UUID au lieu du format custom. Cependant, cela :
- Casserait la cohérence avec les autres tables Dordonia qui utilisent le même format
- Nécessiterait de migrer le localStorage des utilisateurs existants

### Vérification des autres tables

Il faudra s'assurer que les autres tables Dordonia (`dordonia_sessions`, `dordonia_fragments`, etc.) utilisent le type `text` pour leurs colonnes `session_id`.

### Résumé des modifications

| Type | Élément | Action |
|------|---------|--------|
| Migration DB | `dordonia_parlement.session_id` | Changer `uuid` → `text` |
| Code | Aucun | Pas de modification nécessaire |

### Résultat attendu

Après la migration, l'insertion fonctionnera avec le format de session existant `dord_xxx_xxx`.
