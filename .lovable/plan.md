# Newsletter : « accepté » mais rien reçu — tracer la livraison

## État des lieux (confirmé)

- Le test avec `contact@mail.la-frequence-du-vivant.com` renvoie `{ ok: true, sent: 1, messageIds: ["01a0ba2c-…"] }` : **Resend a accepté le message**. Le domaine `mail.la-frequence-du-vivant.com` est donc bien vérifié.
- « Accepté » ne signifie pas « délivré » : le message peut être en file d'attente, rejeté par Gmail (bounce), ou filtré en spam.

## Pistes probables (par ordre)

1. **Dossier spam/courrier indésirable** de gaspard.boreal@gmail.com — le plus fréquent pour un domaine d'envoi récent sans historique.
2. **Délai Resend** : quelques minutes possibles avant remise.
3. **Bounce ou mise en quarantaine** : visible uniquement dans le statut du message côté Resend.

## Ce que je fais

1. **Lecture du statut réel du message** : j'interroge Resend (`GET /emails/{id}`) via la connexion du projet pour lire le statut exact des deux envois de test (delivered / bounced / complained / delivery_delayed) et le motif éventuel. Je vous donne le résultat en clair.
2. **Statut visible dans le Studio Newsletter** : dans le dialogue « Tester », après l'envoi, un bouton « Vérifier la livraison » relit le statut Resend du ou des messages du dernier test (via `newsletter-send`, nouvelle action `status`, qui appelle `GET https://api.resend.com/emails/{id}` avec la clé existante — pas de nouveau secret) et l'affiche en français : « remis à la boîte », « rejeté par le destinataire (motif) », « en attente de remise ».
3. **Aide à la délivrabilité** : si le statut est « delivered » mais rien en boîte de réception, le dialogue recommande de vérifier le dossier spam et, si le message y est, de le marquer « non spam » (cela entraîne la réputation du domaine d'envoi).

## Vérification

- Statut Resend des deux messages de test lu et communiqué.
- `bunx tsgo --noEmit -p tsconfig.app.json` passe ; fonction `newsletter-send` déployée.
- L'utilisateur refait un test, clique « Vérifier la livraison » et confirme la réception (ou me transmet le motif de rejet affiché).
