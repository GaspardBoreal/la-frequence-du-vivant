# Filtre « Utilisateur » dans Admin → Propriétés

## Besoin
Voir toutes les propriétés liées à un utilisateur précis (ex. gaspard.boreal@gmail.com), éventuellement croisé avec un rôle (Propriétaire, Prestataire, Marcheur).

## Constat
- La barre de filtres (`ProprietesFilters.tsx`) propose déjà un filtre « Rôle » qui s'appuie sur la table de liaisons `propriete_marcheurs` (propriété ↔ utilisateur ↔ rôle), chargée en entier côté client (`idsParRole`).
- Aucun filtre ne permet aujourd'hui de cibler **une personne** : on ne peut filtrer que par rôle global.
- Les e-mails sont accessibles à l'admin via la RPC existante `admin_get_profile_emails`.

## Solution proposée

1. **Nouveau filtre « Utilisateur »** dans la barre de filtres, juste à côté du filtre « Rôle » :
   - Sélecteur avec recherche « contient » (réutilisation du composant `SearchableSelect` créé pour la Veille) : on tape un morceau du nom ou de l'e-mail.
   - La liste ne propose que les **utilisateurs ayant au moins une propriété rattachée**, avec pour chacun : nom (ou e-mail à défaut), e-mail en sous-titre, et le **nombre de propriétés** (ex. « 6 propriétés »).
   - Une croix pour effacer la sélection.

2. **Croisement avec le rôle** :
   - « Utilisateur » seul → toutes les propriétés de cette personne, quel que soit son rôle.
   - « Utilisateur » + « Rôle » → uniquement les propriétés où cette personne a ce rôle (ex. « les propriétés dont G. Boréal est propriétaire »).
   - Le filtre « Rôle » seul continue de fonctionner comme aujourd'hui.

3. **Implémentation** :
   - Charger `propriete_marcheurs` avec `user_id` en plus de `propriete_id` et `role` (table petite, déjà chargée en entier).
   - Résoudre les e-mails/noms via `admin_get_profile_emails` (RPC existante) pour les seuls `user_id` présents dans les liaisons.
   - `types.ts` : ajout de `user: string` (id ou `'all'`) dans `ProprietesFilterValues` et `DEFAULT_FILTERS`.
   - `AdminProprietes.tsx` : dans `applyFilters`, si `user` est choisi, restreindre aux `propriete_id` des liaisons de cet utilisateur (croisées avec le rôle si renseigné) ; mémorisation dans l'URL (`user=...`) comme les autres filtres, donc partageable et conservée à la navigation.
   - S'applique aux trois vues (Carte, Tableau de bord, Analyse) comme les autres filtres.

4. **Affichage** : quand un utilisateur est choisi, une pastille récapitulative au-dessus de la liste : « Propriétés de Gaspard Boréal (propriétaire) · 6 » avec bouton pour tout effacer.

## Vérification
- Build OK ; test visuel : choisir gaspard.boreal@gmail.com + rôle Propriétaire affiche uniquement ses propriétés, compteur cohérent entre Carte et Tableau.
