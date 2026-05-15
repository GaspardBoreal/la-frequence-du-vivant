## Objectif
Faire en sorte que lorsqu’un admin ajoute un marcheur existant comme Lecteur invité, la liste “Lecteurs invités” se mette à jour immédiatement et reflète correctement l’état backend.

## Constats
- L’ajout de Vincent fonctionne bien côté modale : il apparaît dans la recherche et le clic “Ajouter” part bien.
- La liste sous l’onglet “Lecteurs invités” ne se met pas à jour dynamiquement après cet ajout.
- Le cache React Query global est configuré avec un `staleTime` de 5 minutes, donc un simple retour visuel peut rester figé si l’invalidation n’entraîne pas un refetch visible.
- La page détail d’événement monte `InvitedReadersTab` dans un onglet Radix ; il faut donc sécuriser le refetch côté composant liste, pas seulement compter sur la fermeture de la modale.

## Plan de correction
1. **Fiabiliser le refetch après ajout d’un lecteur existant**
   - Dans `InviteReaderDialog`, après succès de `add_existing_reader_to_event`, ne pas seulement invalider la query : déclencher aussi un refetch explicite de `['event-invited-readers', eventId]`.
   - Garder la fermeture de la modale seulement après confirmation que le rafraîchissement a bien été demandé.

2. **Renforcer la robustesse de `InvitedReadersTab`**
   - Ajouter la gestion explicite de l’état `error` pour `list_event_invited_readers` afin d’éviter un faux état vide si la relecture backend échoue.
   - Exposer un état de rechargement/refetch plus clair pour que l’UI reflète un rafraîchissement en cours après ajout.

3. **Synchroniser les vues liées à l’événement**
   - Invalider/refetch aussi les queries connexes de l’événement si nécessaire (participants / compteurs) pour éviter les écarts entre onglets.
   - Vérifier que la suppression de Vincent des résultats de recherche après ajout est cohérente avec la liste rechargée.

4. **Validation du cas Vincent**
   - Rejouer le cas exact : chercher Vincent, cliquer “Ajouter”, vérifier qu’il apparaît immédiatement dans “Lecteurs invités” sans rechargement manuel.
   - Vérifier qu’aucun message “Aucun Lecteur invité” ne persiste après ajout réussi.

## Détails techniques
- Fichiers visés :
  - `src/components/admin/marche-events/InviteReaderDialog.tsx`
  - `src/components/admin/marche-events/InvitedReadersTab.tsx`
- Approche : correction frontend uniquement, sans nouvelle migration SQL à ce stade.
- Cause la plus probable : invalidation de cache insuffisante dans un contexte où la query reste en cache frais et où la vue n’exprime pas correctement l’état de refetch.