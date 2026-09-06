# Réparer l'envoi du Carnet de Terrain

## Ce qui bloque aujourd'hui

Deux problèmes distincts, tous deux visibles lors du dernier essai depuis « Jardin Monde DEVIAT » :

1. **L'envoi est refusé par le service d'emails.** Le message renvoyé est explicite : le domaine `la-frequence-du-vivant.com` n'est pas encore validé chez Resend. Tant qu'il ne l'est pas, aucun email partant de cette adresse ne sortira.
2. **La liste des destinataires ne se charge pas.** L'appel qui récupère les marcheurs rattachés à la propriété échoue avec une erreur technique (le mot « rôle » désigne deux choses différentes dans la requête). La fenêtre d'envoi ne propose donc aucun marcheur, seulement la saisie manuelle d'adresses.

## Ce que vous faites de votre côté

Ajouter et vérifier `la-frequence-du-vivant.com` dans votre compte Resend (Domains → Add Domain, puis ajouter les enregistrements DNS proposés chez votre hébergeur de domaine). Une fois le domaine affiché comme « Verified », les envois passeront sans autre changement dans l'app.

## Ce que je corrige dans l'app

- **Liste des destinataires réparée** : correction de la requête qui remonte les marcheurs de la propriété et des marches associées, pour que la première étape de la fenêtre d'envoi affiche à nouveau les personnes disponibles (nom, rôle, indication « sans adresse email » le cas échéant), sans jamais afficher leurs adresses.
- **Message d'erreur lisible** : si le service d'emails refuse encore un envoi (domaine non validé, quota, adresse invalide), la fenêtre affiche une phrase claire en français expliquant quoi faire, au lieu du texte technique anglais actuel.
- **Contrôle avant envoi** : si aucune adresse d'expédition n'est configurée, le bouton d'envoi le signale avant d'essayer, plutôt qu'après une erreur.

## Détails techniques

- Migration : recréer `public.get_propriete_carnet_recipients(p_propriete_id uuid)` en levant l'ambiguïté `role` (renommage des colonnes internes / qualification explicite dans le `RETURN QUERY`). Aucun changement de signature ni de contrat côté client.
- `supabase/functions/send-carnet-terrain/index.ts` : mapper les codes d'erreur Resend (403 domaine non vérifié, 422, 429) vers des messages français explicites ; vérifier `FROM_EMAIL_ADDRESS`/`SMTP_FROM` en amont et renvoyer un code dédié.
- `src/hooks/propriete/useCarnetEnvoi.ts` et `src/components/propriete/tour/carnet/CarnetSendDialog.tsx` : afficher le message renvoyé tel quel, sans encapsulation technique.
- Aucun changement de schéma de table ni de mise en page de l'email.
