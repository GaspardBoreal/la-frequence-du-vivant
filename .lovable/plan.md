# Correction Aperçu suppression cascade

## Diagnostic

Edge function `admin-delete-user-cascade` plante en mode Aperçu (dry_run) avec :
```
TypeError: admin.from(...).eq is not a function
  at index.ts:95 (helper tally)
```

Cause : les appels lignes 73, 74 et 85 chaînent `.eq()` directement sur `admin.from('table')`. Avec `@supabase/supabase-js`, `.from()` retourne un `PostgrestQueryBuilder` sur lequel il faut d'abord appeler `.select()`, `.delete()` ou `.update()` avant tout filtre. Le helper `tally` essaie ensuite de chaîner `.select(...)` sur le résultat de `.eq()` qui n'existe pas.

Le bloc `event_invitations` (l.77-83) fonctionne car il appelle `.select(...).eq(...)` directement — c'est le bon pattern.

## Correction

Refactorer le helper `tally` pour qu'il construise lui-même la requête `select count` :

```ts
const tally = async (
  table: string,
  filter: (q: any) => any,
) => {
  const { count, error } = await filter(
    admin.from(table).select('*', { count: 'exact', head: true })
  );
  if (error) console.warn(`[delete-cascade] count ${table} failed`, error);
  counts[table] = count ?? 0;
};

await tally('marche_participations', (q) => q.eq('user_id', userId!));
await tally('event_invited_readers',  (q) => q.eq('user_id', userId!));
await tally('community_profiles',     (q) => q.eq('user_id', userId!));
```

Le bloc `event_invitations` reste tel quel (déjà correct).

La partie suppression (l.101-121) est déjà correcte (`.delete({ count: 'exact' }).eq(...)`) — pas touchée.

## Validation

1. Redéployer `admin-delete-user-cascade`.
2. Onglet « Communauté → Activités → Supprimer compte test », saisir `aurelien.dript@gmail.com`, cliquer **Aperçu** → doit retourner les `counts` par table sans erreur.
3. Vérifier les logs edge : plus de TypeError.
