# Filtre « Utilisateur » vide dans Admin → Propriétés

## Diagnostic (confirmé)

La liste du filtre « Utilisateur » reste vide (« Aucun utilisateur… ») quand on tape un nom.

**Cause racine vérifiée en base** : la table `propriete_marcheurs` ne possède **pas** de colonne `user_id` — elle référence les personnes via `community_profile_id` (→ `community_profiles.user_id`). Or la requête dans `AdminProprietes.tsx` fait `.select('propriete_id, role, user_id')` : PostgREST renvoie une erreur de colonne inexistante, `lienMarcheurs` retombe à `[]`, et `usersOptions` est vide. La recherche « contient » n'a donc aucune option à filtrer.

**Effet secondaire visible sur la capture** : le champ de recherche n'a pas `autoComplete="off"`, donc Chrome superpose son propre menu d'adresses par-dessus la liste de l'application.

## Correctifs

1. **`src/pages/AdminProprietes.tsx`** — corriger la requête des liaisons :
   - Sélectionner `propriete_id, role, community_profile_id` + jointure `community_profiles(user_id)` (ou requête en deux temps : liaisons puis `community_profiles` par ids).
   - En déduire `userIdsLies` et `usersOptions` comme aujourd'hui (e-mail via RPC `admin_get_profile_emails`, compte de propriétés par utilisateur).
   - Ne plus avaler l'erreur silencieusement : en cas d'échec, afficher une petite mention d'erreur dans le filtre au lieu d'une liste vide trompeuse.

2. **`src/components/admin/veille/SearchableSelect.tsx`** — ajouter `autoComplete="off"`, `name` dédié et `autoCorrect="off"` sur le champ de recherche pour empêcher le menu d'adresses du navigateur de recouvrir les résultats.

3. Vérifier que le croisement « Utilisateur + Rôle » (ex. gaspard.boreal@gmail.com + Propriétaire) filtre bien les trois vues Carte / Tableau de bord / Analyse, et que le paramètre `user` dans l'URL fonctionne.

## Vérification

- Compilation propre.
- Test navigateur (Playwright) sur /admin/proprietes si une session admin est disponible : taper « gas » doit afficher gaspard.boreal@gmail.com avec son nombre de propriétés ; sinon, vérification par requête SQL des données sous-jacentes.
