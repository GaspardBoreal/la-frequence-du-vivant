

# Fix: Suppression de participant bloquee par RLS

## Diagnostic

La table `marche_participations` n'a **aucune policy RLS pour DELETE**. Quand le code appelle `.delete().eq('id', ...)`, Supabase retourne 0 rows affected sans erreur -- la suppression echoue silencieusement.

Policies actuelles : SELECT, INSERT, UPDATE uniquement. Pas de DELETE.

## Correctif

### 1. Migration SQL -- Ajouter une DELETE policy

```sql
CREATE POLICY "Admins can delete marche_participations"
ON public.marche_participations FOR DELETE
TO authenticated
USING (public.check_is_admin_user(auth.uid()));
```

Seuls les admins pourront supprimer des participations (c'est une action admin depuis `/admin/marche-events`).

### 2. Code -- Verifier le resultat de la suppression

Dans `handleDeleteParticipant`, ajouter une verification que la suppression a reellement eu lieu via `.select()` count ou en verifiant `data`/`count` retourne par Supabase. Optionnel mais recommande pour detecter les echecs silencieux a l'avenir.

## Fichiers impactes

| Fichier | Action |
|---|---|
| Migration SQL | Ajouter policy DELETE pour admins |
| `src/pages/MarcheEventDetail.tsx` | (optionnel) Ajouter `{ count: 'exact' }` au delete pour verifier |

