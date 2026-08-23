# Validation DNS mail + finalisation délivrabilité

## Résultat des tests (déjà exécutés — tout est bon)

Requêtes DNS en direct sur `la-frequence-du-vivant.com` :

| Enregistrement | Valeur résolue | Statut |
|---|---|---|
| `_dmarc.mail` TXT | `v=DMARC1; p=none; rua=mailto:dmarc@la-frequence-du-vivant.com` | OK — exactement la valeur attendue |
| `resend._domainkey.mail` TXT | clé DKIM `p=MIGfMA0G...` | OK |
| `send.mail` MX | `10 feedback-smtp.eu-west-1.amazonses.com` | OK |
| `send.mail` TXT | `v=spf1 include:amazonses.com ~all` | OK |

Copies 1 et 2 validées : le formulaire IONOS était correctement rempli (nom `_dmarc.mail`, type TXT, TTL 2 h) et l'enregistrement est déjà propagé mondialement.

## Ce que ça change

La chaîne d'authentification email est maintenant complète : **SPF + DKIM + DMARC**. Gmail et les autres webmails disposent de tous les signaux pour sortir progressivement les emails LFDV/FJ du dossier spam au fur et à mesure que le domaine `mail.la-frequence-du-vivant.com` se forge une réputation (quelques jours à quelques semaines d'envois réguliers).

## Actions restantes (facultatives, sans code)

1. **Boîte `dmarc@`** : l'adresse `dmarc@la-frequence-du-vivant.com` recevra des rapports DMARC XML quotidiens des webmails. Soit créer cette boîte/alias chez IONOS, soit laisser tel quel (aucun impact sur la délivrabilité, juste pas de rapports reçus).
2. **Test end-to-end de traçabilité** : refaire un « mot de passe oublié » sur LFDV, puis vérifier dans les logs de l'Edge Function `auth-email-hook` que la nouvelle ligne de log structurée apparaît (action, marque, domaine destinataire, `emailId` Resend). L'`emailId` permet de retrouver l'email en 1 clic dans le dashboard Resend → Logs.
3. **Poursuite des 3 flux d'inscription** (déjà validés techniquement) : LFDV simple, QR code événement, Fréquence Jardin. Surveiller le placement boîte de réception vs spam sur les prochains envois.

## Détails techniques

- Aucune modification de code ni de base de données dans ce plan — la partie code (logs structurés du hook) est déjà déployée.
- Le plan se limite à valider le test end-to-end de l'étape 2 ci-dessus via les logs de l'Edge Function une fois que tu auras déclenché un envoi.
