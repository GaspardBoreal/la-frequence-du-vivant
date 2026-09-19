# Newsletter : domaine d'expédition non vérifié chez Resend

## Diagnostic

Le test d'envoi fonctionne désormais correctement (le message part bien vers Resend), mais Resend le refuse avec :

```
403 — The la-frequence-du-vivant.com domain is not verified.
```

Le bouton « Tester » a utilisé l'expéditeur `contact@la-frequence-du-vivant.com`. Resend n'accepte d'envoyer que depuis un domaine vérifié dans le compte Resend (DNS : enregistrements SPF/DKIM). Ce n'est **pas** un bug de l'application : c'est une étape de configuration côté Resend.

## Ce qu'il faut faire (côté Resend — action de l'utilisateur)

1. Ouvrir https://resend.com/domains et vérifier quels domaines sont listés et « Verified ».
2. Deux cas possibles :
   - **`la-frequence-du-vivant.com` n'y est pas** : l'ajouter, copier les enregistrements DNS (DKIM/SPF) fournis par Resend dans la zone DNS du domaine, attendre la validation (quelques minutes à quelques heures).
   - **Un autre domaine est déjà vérifié** (par ex. `mail.la-frequence-du-vivant.com`) : utiliser une adresse de ce domaine comme expéditeur, par ex. `lettre@mail.la-frequence-du-vivant.com`, dans le champ « Adresse d'expéditeur » de l'onglet Composer.
3. Solution de contournement immédiate pour les tests uniquement : utiliser `onboarding@resend.dev` comme expéditeur — Resend le délivre **uniquement** à l'adresse du propriétaire du compte Resend (si c'est gaspard.boreal@gmail.com, le test arrivera).

## Ce que je fais dans le code

1. **`AdminNewsletterEditor.tsx`** : quand un refus Resend mentionne « domain is not verified », le résumé du test affiche une consigne claire en français : le domaine de l'expéditeur n'est pas vérifié chez Resend, avec les deux options ci-dessus (vérifier le domaine, ou utiliser un domaine déjà vérifié / `onboarding@resend.dev` pour tester).
2. **`AdminNewsletterEditor.tsx`** : validation à la saisie du champ « Adresse d'expéditeur » — avertissement (non bloquant) si le domaine saisi n'est pas `resend.dev`, invitant à confirmer qu'il est vérifié chez Resend.
3. **Valeur par défaut** : laisser le champ vide par défaut (expéditeur `Lovable Emails <onboarding@resend.dev>` géré), plutôt que pré-remplir une adresse d'un domaine non vérifié.

## Vérification

- L'utilisateur renseigne l'expéditeur choisi après vérification du domaine chez Resend, relance le test vers gaspard.boreal@gmail.com.
- Je lis les journaux de `newsletter-send` pour confirmer `id` Resend et `1 accepté, 0 refusé`.
