## Diagnostic

L'erreur `there is no unique or exclusion constraint matching the ON CONFLICT specification` vient du fait que la table `species_taxonomy_aliases` n'a **aucune contrainte unique** en base :

```
species_taxonomy_aliases_pkey  PRIMARY KEY (id)
species_taxonomy_aliases_marche_id_fkey  FOREIGN KEY (marche_id) → marches
```

Or le hook `useTaxonomyAliases` fait :
- `upsert(..., { onConflict: 'marche_id,alias_key' })` pour un alias lié à une marche
- `upsert(..., { onConflict: 'alias_key' })` pour un alias global

Postgres refuse l'`ON CONFLICT` s'il n'y a pas d'index unique correspondant. D'où l'erreur au 1er clic « Fusionner ».

## Correction (1 migration SQL)

Ajouter deux **index uniques partiels** qui correspondent exactement aux deux cibles d'`onConflict` :

```sql
-- Alias global (une seule ligne par alias_key quand marche_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS species_taxonomy_aliases_global_uidx
  ON public.species_taxonomy_aliases (alias_key)
  WHERE marche_id IS NULL;

-- Alias spécifique marche (une seule ligne par couple)
CREATE UNIQUE INDEX IF NOT EXISTS species_taxonomy_aliases_marche_uidx
  ON public.species_taxonomy_aliases (marche_id, alias_key)
  WHERE marche_id IS NOT NULL;
```

Avant de créer les index, dédupliquer les éventuels doublons déjà insérés en gardant le plus récent (`updated_at DESC`), sinon la création échouera.

## Contrôle post-migration

- Refaire la fusion Lantana → Lantana camara sur DEVIAT.
- Vérifier que l'upsert passe pour les trois scopes : global, marche unique, fan-out événement multi-marches.

Aucun changement de code applicatif nécessaire — le hook et l'UI sont déjà corrects, seule la structure de la table manquait.
