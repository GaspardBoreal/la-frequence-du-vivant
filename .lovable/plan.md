## Diagnostic

Le problème ne vient pas de l’absence de données : la base contient bien des signaux d’usage et de communauté, notamment :

- `marcheur_activity_logs` : 11 336 lignes
- `community_profiles` : 55 profils
- `marcheur_medias` : 430 médias
- `marcheur_observations` : 870 observations
- `marche_participations` : 112 participations

Le point fragile identifié est la RPC `get_community_usage_dashboard` : elle lève `unauthorized` dès que le contexte SQL n’a pas `auth.uid()`. C’est normal dans certains tests serveur, mais côté interface il faut maintenant distinguer clairement :

1. erreur d’autorisation réelle ;
2. réponse RPC vide ou incomplète ;
3. exception masquée par l’UI en simple “Aucune donnée”.

## Plan de correction

1. **Sécuriser la fonction RPC**
   - Remplacer le test `is_admin_user()` par un contrôle explicite basé sur `check_is_admin_user(auth.uid())`.
   - Lever une erreur claire si aucun utilisateur authentifié n’est présent.
   - Garder la fonction en `SECURITY DEFINER` pour qu’un admin puisse agréger les tables protégées par RLS.
   - Conserver l’accès uniquement aux utilisateurs authentifiés/admins.

2. **Rendre la réponse RPC robuste**
   - Garantir que les champs JSON attendus par le frontend ne soient jamais `null` quand il n’y a pas de résultat sur une sous-section :
     - `personas: []`
     - `persona_members: {}`
     - `bubble: []`
     - `heatmap: []`
     - `radar: []`
     - `top_cities: []`
     - `daily: []`
   - Cela évite que le dashboard soit considéré comme vide alors que les KPIs existent.

3. **Améliorer le hook frontend**
   - Ne plus afficher “Aucune donnée” pour une erreur RPC.
   - Ajouter un état d’erreur visible avec le message utile : non connecté, non admin, ou erreur RPC.
   - Journaliser temporairement l’erreur côté console avec le nom de la RPC pour faciliter la vérification.

4. **Améliorer l’état vide**
   - Afficher “Aucune activité sur la période sélectionnée” uniquement si la RPC fonctionne mais que les compteurs sont réellement à zéro.
   - Ajouter un bouton “Réessayer” et garder le sélecteur 7/30/90/180/365 jours.

5. **Validation**
   - Vérifier que la RPC retourne un JSON complet pour un admin connecté.
   - Vérifier dans l’onglet “Usages” que le dashboard affiche les cartes au lieu du message vide.
   - Si l’utilisateur connecté n’est pas admin, afficher un message d’accès clair au lieu d’un faux état vide.