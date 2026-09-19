# Newsletter : débloquer l'envoi (domaine non vérifié chez Resend)

## Cause confirmée

Le test part bien vers Resend, mais Resend répond `403 — The la-frequence-du-vivant.com domain is not verified`. L'expéditeur `contact@la-frequence-du-vivant.com` appartient à un domaine non vérifié dans le compte Resend. Resend n'envoie que depuis un domaine vérifié (enregistrements DNS DKIM/SPF) ou depuis son adresse d'essai `onboarding@resend.dev` (livrée uniquement au propriétaire du compte Resend).

## Changements

1. **Expéditeur par défaut** (`AdminNewsletterEditor.tsx`) : champ « Adresse d'expéditeur » vide par défaut → `onboarding@resend.dev`. Les tests vers gaspard.boreal@gmail.com passent immédiatement (si c'est l'adresse du compte Resend), sans configuration.
2. **Avertissement à la saisie** : si l'expéditeur saisi n'est pas en `resend.dev`, message non bloquant rappelant que le domaine doit être vérifié sur https://resend.com/domains.
3. **Résumé de test enrichi** : quand Resend répond « domain is not verified », le dialogue affiche en français : le domaine de l'adresse d'expédition n'est pas vérifié chez Resend + les deux options (vérifier le domaine, ou laisser vide pour utiliser l'adresse d'essai).
4. **Guide de vérification du domaine** (texte d'aide dans le dialogue) : ajouter le domaine sur resend.com/domains, copier les enregistrements DKIM/SPF dans la zone DNS du domaine (réglages du projet Lovable si le domaine a été acheté via Lovable, sinon chez le registrar), attendre la validation, puis saisir l'adresse d'expédition.

## Vérification

- `bunx tsgo --noEmit -p tsconfig.app.json` passe.
- L'utilisateur relance « Tester » : résumé « 1 accepté, 0 refusé » et réception sur gaspard.boreal@gmail.com.
- Lecture des journaux de `newsletter-send` pour confirmer l'identifiant Resend.
