

# Fix: Permettre aux marcheurs de voir les co-participants

## Diagnostic

La policy SELECT sur `marche_participations` ne permet a chaque utilisateur de voir **que sa propre participation**. Laurence ne voit donc pas les autres marcheurs inscrits a la meme marche.

## Correctif

### Migration SQL — Remplacer la policy SELECT

Supprimer l'ancienne policy et la remplacer par une policy qui autorise :
1. Les **admins** a tout voir (inchange)
2. Chaque **participant** a voir tous les autres participants **du meme evenement** auquel il participe

```sql
DROP POLICY "Users can read own participations" ON public.marche_participations;

CREATE POLICY "Users can read co-participants"
ON public.marche_participations FOR SELECT
TO authenticated
USING (
  public.check_is_admin_user(auth.uid())
  OR
  marche_event_id IN (
    SELECT mp.marche_event_id 
    FROM public.marche_participations mp 
    WHERE mp.user_id = auth.uid()
  )
);
```

**Logique** : si tu participes a un evenement, tu peux voir tous les participants de cet evenement. Tu ne peux pas voir les participants d'evenements auxquels tu n'es pas inscrit.

### Securite

- Pas de fuite de donnees : on ne voit que les co-participants, pas tous les inscrits de toutes les marches
- La sous-requete utilise `user_id = auth.uid()` comme filtre, donc pas d'escalade possible
- Les policies INSERT/UPDATE/DELETE restent inchangees

## Fichier impacte

| Fichier | Action |
|---|---|
| Migration SQL | Remplacer la policy SELECT sur `marche_participations` |

Aucun changement de code cote frontend — le probleme est 100% RLS.

