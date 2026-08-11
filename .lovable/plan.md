# Brancher le webhook Brad (nouvelle clé partagée)

## Ce que vous saisirez chez Brad

| Champ | Valeur |
| --- | --- |
| Activer le Webhook | ON |
| URL du Webhook HTTP(S) | `https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/iot-webhook-brad` |
| Clé secrète (HMAC-SHA256) | la nouvelle clé partagée (voir ci-dessous) |
| Mode de transmission | Total (full) |

## La clé secrète

C'est un secret *partagé* : la même valeur doit exister chez Brad et chez nous. Elle ne peut donc pas être générée en aveugle de notre côté — vous devez pouvoir la copier.

1. Vous créez une valeur aléatoire forte (gestionnaire de mots de passe, ou `openssl rand -hex 32`).
2. Vous la collez dans le champ « Clé Secrète d'Authentification » chez Brad, puis « Enregistrer la Configuration ».
3. Je vous ouvre le formulaire sécurisé pour enregistrer **la même valeur** dans `BRAD_WEBHOOK_SECRET` côté Lovable (remplacement de l'ancienne).

Ordre important : tant que les deux valeurs diffèrent, chaque trame Brad repart en `401 — Signature HMAC invalide`.

## Vérification après bascule

- Chez Brad : bouton « Tester le Webhook Maintenant ».
- Chez nous : `/admin/iot` → onglet « Poste de contrôle » → la livraison doit apparaître avec signature valide, et le voyant « en direct » s'allumer.
- Si retour `404 Capteur inconnu` : le `serialNumber` envoyé par Brad ne correspond pas aux `serial_number` de nos 3 sondes (ex. `b26s002`) — on aligne alors les numéros de série dans la fiche capteur.

## Détails techniques

- Fonction : `supabase/functions/iot-webhook-brad/index.ts`, publique, POST uniquement, vérification HMAC-SHA256 sur le corps brut, en-tête `X-Brad-Signature: sha256=<hmac>`.
- Déduplication par en-tête `X-Brad-Delivery`, journalisation dans `iot_webhook_deliveries`, mesures normalisées en unités SI dans `iot_mesures`.
- Aucune modification de code n'est nécessaire : seule la rotation du secret `BRAD_WEBHOOK_SECRET` est à faire.
