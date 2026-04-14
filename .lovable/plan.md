

## Mettre à jour le statut de Victor Boixeda en "Marcheur"

### Contexte
Victor Boixeda (user_id: `7a5cc1a2-301c-4070-ae62-248558ce0eec`) est actuellement "marcheur_en_devenir" avec 0 marches comptées. Il faut passer son rôle à "marcheur" et ajuster son compteur.

### Action
Une migration SQL qui exécute :

```sql
UPDATE community_profiles
SET role = 'marcheur', marches_count = 1, updated_at = now()
WHERE user_id = '7a5cc1a2-301c-4070-ae62-248558ce0eec';
```

### Fichier concerné
| Fichier | Action |
|---------|--------|
| Nouvelle migration SQL | UPDATE du rôle de Victor Boixeda |

