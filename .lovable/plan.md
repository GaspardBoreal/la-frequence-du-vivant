# Correction : sauvegarde des pratiques éditoriales multi-sources

## Diagnostic

L'erreur `invalid input syntax for type uuid: "media:4514b801-..."` provient de la colonne `exploration_curations.media_ids` qui est typée `uuid[]` en base. Or, depuis l'introduction du sélecteur multi-sources (marches + Convivialité), nous stockons des **clés composites** au format `media:<uuid>` et `conv:<uuid>` pour distinguer la source de chaque média. Postgres rejette donc l'INSERT.

Bonne nouvelle : la table est actuellement vide (`SELECT … WHERE array_length(media_ids,1) > 0` → 0 ligne), aucune donnée à migrer.

## Solution retenue

Faire évoluer la colonne `media_ids` de `uuid[]` vers `text[]`. C'est la solution la plus alignée avec l'architecture validée précédemment (clés composites stables) et la plus simple côté code (le frontend manipule déjà des `string`).

### Migration SQL

```sql
ALTER TABLE public.exploration_curations
  ALTER COLUMN media_ids TYPE text[] USING media_ids::text[];
```

Aucune RLS, contrainte ou index à toucher (la colonne n'est référencée nulle part en clé étrangère ni indexée).

### Côté code

- `useExplorationCurations.ts` : ajuster le type TypeScript de `media_ids` (`string[]` au lieu de `string[]` issu de uuid — déjà `string[]` côté TS, donc rien à changer fonctionnellement, juste vérifier).
- `MainCuration.tsx` et `MediaPickerSheet.tsx` : aucun changement, ils manipulent déjà des clés composites.
- `src/integrations/supabase/types.ts` : régénéré automatiquement par Supabase après la migration.

## Validation

Après migration, recréer une pratique avec un mélange de médias issus de marches et du mur Convivialité, puis vérifier en base :

```sql
SELECT title, media_ids FROM exploration_curations ORDER BY created_at DESC LIMIT 1;
```

Les valeurs doivent ressembler à `{"media:4514b801-…","conv:abc123-…"}`.

## Fichiers impactés

- **Migration DB** : `exploration_curations.media_ids` → `text[]`
- **Vérification** : `src/hooks/useExplorationCurations.ts` (types)
