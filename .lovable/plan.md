# Supprimer un marcheur depuis l'écran Communauté

Ajouter une action de suppression définitive par ligne dans le tableau des marcheurs (/admin/community, onglet Communauté), réservée aux administrateurs, avec double confirmation et effacement de tous les enregistrements associés.

## Ce qui existe déjà

- La fonction serveur `admin-delete-user-cascade` accepte un identifiant de marcheur, refuse toute cible administrateur, propose un mode « aperçu » (comptage par table) puis effectue la purge complète (17+ tables : participations, invitations, médias, observations, profil, compte de connexion).
- Elle n'est aujourd'hui utilisable que via le panneau « Maintenance · Supprimer un compte de test », qui exige de taper une adresse e-mail.

## Ce qui sera ajouté

1. **Bouton « Supprimer »** (icône corbeille, rouge) à côté de « Éditer » sur chaque ligne du tableau.
   - Masqué pour les marcheurs portant le badge Admin.
   - Visible uniquement si l'utilisateur connecté est administrateur.

2. **Confirmation en deux temps**
   - **Étape 1 — l'inventaire** : une fenêtre affiche le nom du marcheur et l'aperçu chiffré de tout ce qui sera effacé (nombre de participations, photos, observations, invitations, etc.), obtenu en mode aperçu avant toute suppression.
   - **Étape 2 — la signature** : une seconde fenêtre, volontairement austère, demande de saisir le nom de famille du marcheur pour débloquer le bouton « Supprimer définitivement ». Rien n'est effacé tant que la saisie ne correspond pas.

3. **Après suppression** : notification de réussite, rafraîchissement automatique des listes (profils, participations, indicateurs de rôles) et fermeture des fenêtres.

4. **Refus explicites** : si la cible est administrateur ou si le compte est introuvable, le message d'erreur du serveur est affiché tel quel, sans suppression partielle.

## Détails techniques

- Nouveau composant `src/components/admin/community/DeleteMarcheurDialog.tsx` : machine à deux étapes (`inventory` → `signature`), appelle `supabase.functions.invoke('admin-delete-user-cascade', { user_id, dry_run: true })` puis `{ dry_run: false }`.
- `src/pages/CommunityProfilesAdmin.tsx` : nouvelle colonne d'action, état `deleting: EditableProfile | null`, garde `isAdmin` issue de `useAuth()`, bouton masqué si `adminUserIds.has(profile.user_id)`.
- Invalidation des clés React Query : `community-profiles-admin`, `admin-marche-participations`, `community-admin-user-ids`, plus les clés orphelines déjà utilisées par le panneau de maintenance.
- Aucune modification de base de données ni de la fonction serveur : la sécurité (validation du jeton administrateur, refus des cibles admin) reste entièrement côté serveur.
