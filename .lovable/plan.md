# Webhook Brad : l'erreur vient de leur interface, pas de nous

## Lecture de l'erreur

`saveResult.unwrapErr is not a function` est une erreur JavaScript **du back-office Brad** : leur code appelle une méthode qui n'existe pas sur l'objet retourné par leur propre enregistrement. Rien dans cette erreur ne concerne notre URL, notre clé ou notre fonction — aucune requête n'est même partie vers nous.

Ce qu'il faut faire : signaler ce bug à Brad (capture d'écran + message exact) et leur demander si la configuration a malgré tout été enregistrée côté serveur. Astuce utile en attendant : recharger la page de configuration — si l'URL et la clé sont toujours affichées, l'enregistrement a bien eu lieu et seule l'étape d'affichage du résultat plante.

## Vos saisies sont correctes

| Champ | Valeur saisie | Verdict |
| --- | --- | --- |
| URL | `https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/iot-webhook-brad` | conforme |
| Clé HMAC-SHA256 | clé hexadécimale 64 caractères | conforme |
| Mode | Total (full) | conforme |

## Ce que je fais de mon côté (à votre validation)

1. Enregistrer côté Lovable, dans le secret `BRAD_WEBHOOK_SECRET`, **exactement la clé affichée dans votre capture**, pour que les signatures concordent.
2. Vérifier ensuite dans `/admin/iot` → « Poste de contrôle » qu'une livraison Brad arrive avec signature valide dès que leur bouton de test fonctionne.

Aucune modification de code n'est nécessaire.

## Point de sécurité

Cette clé a circulé dans une capture d'écran. Une fois la remontée confirmée et le flux stabilisé, il faudra la remplacer par une nouvelle valeur des deux côtés (Brad + `BRAD_WEBHOOK_SECRET`).

## Si le test Brad part enfin et échoue chez nous

- `401 Signature HMAC invalide` → les deux clés diffèrent (espace ou caractère collé en trop).
- `404 Capteur inconnu` → le `serialNumber` envoyé ne correspond pas à nos numéros de série (`b26s001`, `b26s002`, `b26s003`) ; on alignera la fiche capteur.
