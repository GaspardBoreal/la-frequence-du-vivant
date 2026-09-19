# Vérifier le suivi de livraison de la newsletter

La clé de signature Resend (`RESEND_WEBHOOK_SECRET`) est maintenant rangée dans le coffre-fort. Le webhook Resend est configuré côté Resend (URL + 6 événements). Reste à prouver que la chaîne complète fonctionne.

## Étapes

1. **Test réel depuis le Studio Newsletter** : relancer un test de la campagne « Prochaine marches du vivant : Château Boutinet » vers `gaspard.boreal@gmail.com` (l'utilisateur le fait depuis l'écran, expéditeur `contact@mail.la-frequence-du-vivant.com`).

2. **Lire les journaux des deux fonctions** :
   - `newsletter-send` : confirmer l'envoi accepté et la création de la ligne destinataire de test (`is_test = true`, `resend_message_id` renseigné).
   - `newsletter-webhook` : confirmer la réception des événements Resend (signature vérifiée, pas de 401/403) et la mise à jour du statut (`sent` → `delivered` → éventuellement `opened`).

3. **Vérifier en base** : interroger `newsletter_recipients` (ligne de test) et `newsletter_events` pour confirmer que le statut et les horodatages remontent bien.

4. **Confirmer l'affichage** : le bloc « Suivi de remise » de la fenêtre de test doit passer de « accepté » à « remis » sans action de l'utilisateur (rafraîchissement automatique toutes les 5 s).

## Si un échec apparaît

- 401/403 dans les journaux du webhook → la clé ne correspond pas : regénérer la clé de signature dans Resend et la retransmettre.
- Aucun événement reçu → revoir la configuration du webhook dans Resend (URL exacte, événements email.* cochés).
- `delivered` mais rien dans Gmail → vérifier le dossier Courrier indésirable et marquer « non spam ».

## Technique

Lecture seule : journaux des edge functions (`supabase--edge_function_logs`) et requêtes SQL de contrôle. Aucune modification de code prévue sauf si un journal révèle un défaut.
