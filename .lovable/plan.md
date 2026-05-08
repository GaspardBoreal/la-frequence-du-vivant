# Action

Rendre public le texte « Cerisier » (id `c96ffab7-dcaf-4874-a00e-bf1f3c357e38`) attribué à Karine Log dans l'exploration DEVIAT, Point 01.

# Étape

Une seule requête `UPDATE` sur `marcheur_textes` :

```sql
UPDATE marcheur_textes
SET is_public = true, updated_at = now()
WHERE id = 'c96ffab7-dcaf-4874-a00e-bf1f3c357e38';
```

# Résultat attendu

- Apparaît dans **Apprendre → Le cœur (Textes)** sous **Karine Log**.
- Compté dans **Marcheurs → Karine Log → Textes** pour tous les visiteurs.
- Aucun changement de code.
