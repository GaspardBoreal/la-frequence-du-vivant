# Envoi du carnet : utiliser le domaine vérifié `mail.la-frequence-du-vivant.com`

## Diagnostic (confirmé par le journal du service)

L'envoi du carnet échoue avec ce motif exact de Resend :

> 403 — The **la-frequence-du-vivant.com** domain is not verified.

Or, d'après votre capture, seul le sous-domaine **`mail.la-frequence-du-vivant.com`** est vérifié dans Resend. L'adresse d'expédition actuelle (secret `FROM_EMAIL_ADDRESS`, ex. `...@la-frequence-du-vivant.com`) utilise le domaine racine, que Resend refuse. Les emails d'inscription, eux, passent par un autre canal déjà configuré sur `mail.` — d'où l'écart que vous avez remarqué.

## Correction

1. **Adresse d'expédition dédiée au carnet**, sur le domaine vérifié :
   - Nouveau secret `CARNET_FROM_EMAIL` = `jardin@mail.la-frequence-du-vivant.com` (enregistré sans action de votre part).
   - Dans `supabase/functions/send-carnet-terrain/index.ts` : l'expéditeur devient `Fréquence Jardin <CARNET_FROM_EMAIL>`, avec repli sur `FROM_EMAIL_ADDRESS` si absent.
   - Aucune création de boîte mail nécessaire : c'est une adresse d'émission Resend, et les réponses arrivent déjà chez l'expéditeur du carnet (champ `reply_to` existant).

2. **Redéploiement** de la fonction `send-carnet-terrain`.

3. **Vérification** : lecture du journal après un envoi de test pour confirmer que Resend accepte (plus de 403).

## Hors périmètre

- Les emails d'inscription/mot de passe oublié ne sont pas modifiés : ils fonctionnent déjà.
- Alternative non retenue : vérifier aussi le domaine racine dans Resend — inutile, le sous-domaine `mail.` suffit et est déjà vérifié.
