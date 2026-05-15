# Diagnostic et plan

## Ce qui se passe
- **Vincent est bien déjà présent** dans `event_invited_readers` pour cet événement.
- En revanche, la fonction qui alimente l’onglet, `list_event_invited_readers(...)`, renvoie **`forbidden`** dans le contexte du chargement de la page.
- J’ai aussi vérifié que votre compte est bien reconnu admin quand on teste explicitement l’ID utilisateur.

## Cause probable
Le composant **charge la liste trop tôt**, avant que la session Supabase et la vérification admin soient complètement stabilisées côté client.

Conséquence :
- l’ajout de Vincent fonctionne,
- mais la requête de lecture part dans un état transitoire avec un `auth.uid()` non prêt,
- la fonction SQL refuse alors l’accès,
- et l’UI affiche à tort : **« Impossible de charger les Lecteurs invités. Réessayez dans un instant. »**

## Correction proposée
1. **Attendre explicitement l’état auth/admin prêt** avant d’activer la requête dans `InvitedReadersTab`.
2. **Afficher un vrai état de chargement** tant que la session/admin n’est pas résolue, au lieu d’une erreur.
3. **Ne montrer l’erreur de droits** que si la session est prête et que la RPC échoue encore réellement.
4. **Conserver le refetch explicite** après invitation pour garder la mise à jour dynamique.

## Fichiers concernés
- `src/components/admin/marche-events/InvitedReadersTab.tsx`
- appui sur `src/hooks/useAuth.ts`

## Résultat attendu
- Vincent apparaît bien dans la liste.
- Le faux message d’erreur disparaît.
- La liste reste à jour juste après une invitation.