# Mehdiab505 : participant mais absent de la liste des marcheurs

## Ce que j'ai vérifié en base

- Mehdiab505 (compte créé aujourd'hui à 17:06 heure de Paris) a bien une inscription au « Château Boutinet : le vignoble vivant » : la ligne de participation existe.
- Il a aussi une fiche marcheur pour cette exploration (prénom « mehdi », nom « aboulmaouahib »).
- En même temps, à la création de son compte, le partage automatique des nouvelles inscriptions lui a créé trois lignes de « lecteur invité » (dont une sur Château Boutinet), jamais marquées comme promues.

## La cause

L'écran « Marcheurs » écarte de la liste principale toute personne considérée comme « invitée en attente » et n'ayant encore rien déposé (photo, son, texte, espèce). Le service qui fabrique cette liste d'invités regarde uniquement la ligne « lecteur invité » non promue, sans jamais vérifier si la personne est déjà inscrite comme participante. Mehdiab505, inscrit mais sans contribution, est donc rangé parmi les invités et disparaît de la liste des marcheurs — alors que la liste des participants de la marche l'affiche correctement.

Aurelien DRIPT échappe au problème seulement parce qu'il n'a pas de ligne « lecteur invité ».

## Ce que je corrige

1. Une personne réellement inscrite à une marche de l'exploration n'est plus jamais comptée comme « invitée en attente » : elle apparaît dans la liste des marcheurs, même sans contribution.
2. Nettoyage des données existantes : toutes les lignes « lecteur invité » qui correspondent à une inscription déjà validée sont marquées comme promues, y compris celles de Mehdiab505. L'onglet « Lecteurs invités » cesse ainsi d'afficher de vrais participants.
3. Prévention : dès qu'une inscription à une marche est enregistrée (auto-inscription, QR code, ajout par un administrateur), la ligne « lecteur invité » correspondante est automatiquement marquée comme promue.

Aucune inscription n'est supprimée, aucune fiche marcheur n'est touchée.

## Détail technique

- `supabase/functions/exploration-pending-invitees-list/index.ts` : après le chargement des `event_invited_readers` non promus, charger `marche_participations` pour les mêmes `event_ids` et retirer de `registered_not_promoted` tout `user_id` présent dans ces participations. Même exclusion pour les invitations e-mail dont l'utilisateur est déjà participant.
- `src/components/community/exploration/MarcheursTab.tsx` : le filtre « invités fantômes » (ligne ~1627) reste inchangé — il devient correct une fois la source assainie. Vérifier ensuite que Mehdiab505 apparaît bien dans la liste et plus dans le bloc « Invités en attente ».
- Migration : trigger `AFTER INSERT` sur `public.marche_participations` (SECURITY DEFINER, `search_path = public`) qui fait `UPDATE public.event_invited_readers SET promoted_to_participant_at = now() WHERE event_id = NEW.marche_event_id AND user_id = NEW.user_id AND promoted_to_participant_at IS NULL`.
- Correction de données (`run_sql`, pas de migration) : même `UPDATE` appliqué rétroactivement en joignant `marche_participations` sur `(event_id, user_id)`.
- Vérification finale : relire les lignes de Mehdiab505 dans `event_invited_readers` et recharger l'onglet Marcheurs de l'exploration `210e273b…`.
