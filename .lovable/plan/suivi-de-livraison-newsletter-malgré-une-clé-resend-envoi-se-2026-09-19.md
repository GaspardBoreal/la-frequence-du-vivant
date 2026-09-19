# Suivi de livraison newsletter malgré une clé Resend « envoi seul »

## Diagnostic (confirmé)
- La clé `RESEND_API_KEY` du projet est une clé **restreinte à l'envoi** (« This API key is restricted to only send emails »). Elle accepte les messages mais refuse toute lecture (`GET /emails/{id}` → 401). Le bouton « Vérifier la livraison » ne peut donc jamais fonctionner avec cette clé.
- La bonne source de vérité pour la remise (remis / rejeté / retardé / ouvert / cliqué) est le **webhook Resend** : Resend appelle notre fonction `newsletter-webhook` à chaque événement. La fonction existe déjà et met à jour les statuts destinataires, mais elle attend le secret de signature `RESEND_WEBHOOK_SECRET` (clé `whsec_…`) qui n'a jamais été fourni.

## Plan

### 1. Message honnête au lieu de « statut illisible »
- Dans `newsletter-send` (action `status`) : détecter le 401 « restricted_api_key » et renvoyer un code `key_restricted`.
- Dans le Studio (`TestDialog`) : afficher « Votre clé Resend ne permet pas la relecture du statut. Le suivi de livraison passe par le webhook (voir ci-dessous). » avec un lien vers les réglages, au lieu du message technique brut.

### 2. Tracer les tests comme de vrais destinataires
- Aujourd'hui un envoi de test ne crée pas de ligne destinataire, donc même le webhook ne pourrait pas le rattacher.
- `newsletter-send` : pour chaque test, créer/mettre à jour une ligne dans `newsletter_recipients` (campagne, email, `status='sent'`, `provider_message_id` = l'identifiant Resend, marqueur `is_test=true`) pour que les événements du webhook puissent mettre à jour son statut.
- Migration : ajouter la colonne `is_test boolean not null default false` (les lignes de test sont exclues des KPI d'audience réelle).

### 3. Activer le webhook Resend (action utilisateur requise)
- Le guide intégré au Studio expliquera pas à pas :
  1. Ouvrir https://resend.com/webhooks → « Add webhook »
  2. URL : `https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/newsletter-webhook`
  3. Événements : `email.delivered`, `email.bounced`, `email.delivery_delayed`, `email.complained`, `email.opened`, `email.clicked`
  4. Copier la clé de signature (`whsec_…`) affichée par Resend
- Je demanderai ensuite cette clé via le coffre-fort de secrets (`RESEND_WEBHOOK_SECRET`).
- Une fois en place, le statut du test (remis / rejeté / ouvert…) apparaîtra directement dans le Studio, sans relecture d'API.

### 4. Affichage du statut webhook dans le Studio
- Le résumé du dernier test lira la ligne destinataire (rafraîchie toutes les 5 s pendant 2 min) et affichera le statut à jour avec les libellés existants (« remis à la boîte », « rejeté », etc.) et le conseil spam si « remis » mais non reçu.

## Technique
- `supabase/functions/newsletter-send/index.ts` : action `status` → code `key_restricted` ; création des lignes de test avec `provider_message_id`.
- Migration : `ALTER TABLE newsletter_recipients ADD COLUMN is_test boolean not null default false` (aucune donnée existante modifiée).
- `newsletter-webhook` : déjà écrit — aucune modification prévue, seul le secret manque.
- `src/pages/AdminNewsletterEditor.tsx` / `TestDialog` : message clé restreinte + lecture du statut webhook + guide de configuration.
- Vérification : `bunx tsgo --noEmit -p tsconfig.app.json`, déploiement des fonctions, puis test réel vers gaspard.boreal@gmail.com une fois la clé webhook en place.

## Hors périmètre
- Pas de changement de clé Resend (une clé « full access » serait une alternative, mais le webhook est la voie propre et déjà prévue).
