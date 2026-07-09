## Diagnostic

Le message affiché côté interface masque encore l’erreur réelle. Les logs client indiquent clairement la cause SQL :

```text
column o.user_id does not exist
hint: Perhaps you meant to reference the column "u.user_id".
```

La RPC `get_community_usage_dashboard` compte les contributions avec :

```sql
marcheur_observations o WHERE o.user_id = u.user_id
```

Or la table `marcheur_observations` n’a pas de colonne `user_id`; elle utilise `marcheur_id`. C’est donc la RPC qui échoue avant de retourner le JSON attendu.

## Plan de correction

1. **Corriger la RPC Supabase**
   - Remplacer le comptage direct `o.user_id = u.user_id` par une correspondance fiable entre `marcheur_observations.marcheur_id` et le profil communautaire.
   - Utiliser `marcheur_id = u.profile_id`, car `base_users` expose déjà `cp.id AS profile_id`.
   - Garder les autres sources inchangées : `marcheur_medias.user_id`, `marcheur_textes.user_id`, `marcheur_audio.user_id`.

2. **Conserver la sécurité existante**
   - Ne pas ouvrir la RPC à `anon`.
   - Garder `SECURITY DEFINER`.
   - Garder le contrôle admin via `check_is_admin_user(auth.uid())`.
   - Garder le droit d’exécution uniquement pour les utilisateurs authentifiés.

3. **Améliorer le message frontend si besoin**
   - Le hook journalise déjà l’erreur technique en console.
   - Option minimale : enrichir temporairement le message générique pour afficher le code SQL en mode admin si une erreur inconnue revient, afin d’éviter un nouveau “Impossible de charger” opaque.
   - Ne pas transformer le dashboard ni les métriques.

4. **Valider après migration**
   - Tester la RPC en lecture avec un admin connecté.
   - Vérifier que le JSON contient bien `kpis`, `bubble`, `personas`, `heatmap`, etc.
   - Vérifier dans `/admin/community`, onglet Usages, que les cartes s’affichent au lieu de “Données d’usage indisponibles”.

## Changement SQL attendu

La correction centrale est équivalente à :

```sql
COALESCE((
  SELECT COUNT(*)
  FROM marcheur_observations o
  WHERE o.marcheur_id = u.profile_id
), 0)
```

au lieu de :

```sql
COALESCE((
  SELECT COUNT(*)
  FROM marcheur_observations o
  WHERE o.user_id = u.user_id
), 0)
```

## Résultat attendu

Le dashboard “Usages” doit charger les données réelles de communauté au lieu d’échouer silencieusement sur la colonne inexistante.