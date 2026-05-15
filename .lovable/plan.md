## Diagnostic

Laurent Tripied est bien enregistré en base pour l’événement `efe36e8c-75cd-4bd7-9dd8-bccf7d3c9a69` ("Laboratoire à Ciel Ouvert : Biodiversité & Sols Vivants"). Comme Vincent auparavant, **l’ajout fonctionne**. Le blocage est donc **strictement côté lecture UI**.

Le RPC `list_event_invited_readers` est correct et renvoie les lignes attendues, mais il dépend de `auth.uid()` + `check_is_admin_user(auth.uid())`. Dès que la session admin côté navigateur est transitoire, absente, ou pas encore stabilisée, il renvoie `forbidden`, ce que l’onglet traduit par "Impossible de charger les Lecteurs invités".

Le refactor `AuthProvider` a réduit les courses, mais il reste un point fragile : l’onglet **dépend encore directement d’un RPC admin protégé dans le navigateur**, donc le moindre flottement de session continue à casser l’affichage. C’est pour cela que le bug réapparaît sur d’autres événements même quand les données sont bien présentes.

## Ce que je vais corriger

### 1. Rendre la lecture des Lecteurs invités indépendante des micro-états auth du client
- Créer une **Edge Function dédiée** (par ex. `event-invited-readers-list`) qui :
  - valide le JWT côté serveur,
  - vérifie le rôle admin côté serveur,
  - appelle la liste des lecteurs invités avec privilèges serveur,
  - renvoie les lecteurs de façon stable.
- L’onglet `InvitedReadersTab` utilisera cette function au lieu d’appeler directement le RPC depuis le navigateur.

### 2. Garder les protections de sécurité intactes
- Aucune ouverture RLS publique.
- La vérification admin reste obligatoire, mais **entièrement côté serveur** pour éviter les faux `forbidden` transitoires côté client.
- Le RPC SQL existant pourra rester comme couche de sécurité interne, ou être remplacé si la fonction Edge centralise déjà le contrôle.

### 3. Fiabiliser l’UX de l’onglet
- Conserver le retry automatique + le bouton "Réessayer".
- Afficher un vrai état de chargement tant que la session n’est pas prête.
- Après ajout d’un lecteur, invalider proprement la requête de liste pour faire apparaître immédiatement la personne ajoutée.

## Validation

Je validerai sur les trois cas concrets déjà signalés :
- `DEVIAT / Jardin Monde du 11.03.26 à aujourd'hui`
- `DEVIAT Le Réveil de la Terre "Marcher sur un sol qui respire"`
- `Laboratoire à Ciel Ouvert : Biodiversité & Sols Vivants`

Résultat attendu : Vincent et Laurent apparaissent immédiatement dans l’onglet **Lecteurs invités**, sans message d’erreur.

## Détails techniques

Fichiers pressentis :
- `supabase/functions/event-invited-readers-list/index.ts` (nouveau)
- `src/components/admin/marche-events/InvitedReadersTab.tsx`
- éventuellement `src/components/admin/marche-events/InviteReaderDialog.tsx` pour l’invalidation finale

Aucune modification de données existantes n’est nécessaire. Le problème est un problème de **canal de lecture admin côté client**, pas de base.
