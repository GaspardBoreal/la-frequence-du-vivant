# Email de confirmation non reçu — diagnostic et correctif

## Diagnostic (vérifié dans les logs et le code)

- Log Auth Supabase 07:54:35 : `user_confirmation_requested` pour aurelien.dript@gmail.com → **« Hook ran successfully »**, inscription retournée en 200.
- Code du hook `auth-email-hook` relu : le chemin `signup` / marque `lfdv` est complet (template présent, destinataire = `user.email`, expéditeur réécrit sur le sous-domaine vérifié `mail.la-frequence-du-vivant.com`).
- Point décisif : **si Resend avait refusé l'envoi, le hook lèverait une erreur 500 et l'inscription elle-même aurait échoué**. L'inscription a réussi → Resend a accepté l'email.
- Conclusion : l'email est parti. Le problème est côté **livraison** (spam, bounce, ou simple délai — seulement 5 min s'étaient écoulées au moment du signalement). Le domaine d'envoi a 24 h : aucune réputation, Gmail filtre souvent le premier envoi d'un nouveau domaine.
- Lacune constatée : le hook ne logge rien en cas de succès → impossible aujourd'hui de tracer un envoi sans ouvrir le dashboard Resend.

## Étape 1 — Vérifications immédiates (2 min, toi)

1. Chez Aurélien : vérifier **Courrier indésirable / Spam** et l'onglet **Promotions** de Gmail (pas seulement la boîte de réception). Si l'email y est : « Non spam » + répondre à l'email entraîne Gmail.
2. Cliquer sur **« Renvoyer l'email de confirmation »** depuis l'écran « Vérifiez votre boîte mail » (bouton déjà présent sur ta copie d'écran) et surveiller ~10 min (délai/graylisting possible sur domaine neuf).

## Étape 2 — Vérification décisive côté Resend (toi, 2 min)

Dashboard Resend → **Logs / Emails** : retrouver le message vers `aurelien.dript@gmail.com` de 09:54 (heure de Paris) et lire son statut :
- **Delivered** → c'est du filtrage Gmail (étape 1).
- **Bounced / Suppressed** → la raison exacte y est écrite (adresse invalide, boîte pleine…) ; me la copier et je corrige en conséquence.

## Étape 3 — Traçabilité du hook (moi, code)

Dans `supabase/functions/auth-email-hook/index.ts` :
- Logger en cas de succès : action, domaine du destinataire (adresse masquée), `id` de l'email retourné par Resend.
- Logger déjà présent en cas d'erreur, conservé ; ajouter le corps d'erreur Resend dans le message.
- Redéployer la fonction. Résultat : chaque prochain test sera traçable depuis les logs Lovable/Supabase sans ouvrir Resend.

## Étape 4 — Délivrabilité long terme (toi, IONOS, recommandé)

Ajouter l'enregistrement **DMARC** recommandé par Resend (il manque à la config actuelle : seuls DKIM, MX et SPF ont été créés) :
- Type `TXT`, hôte `_dmarc.mail`, valeur `v=DMARC1; p=none;`
- Améliore le placement en boîte de réception pour ce domaine tout neuf.

## Détails techniques

- Un seul fichier modifié : `supabase/functions/auth-email-hook/index.ts` (~6 lignes de logs). Aucune migration SQL, aucun secret, aucun changement de template.
- Hors périmètre : si l'étape 2 révèle un bounce spécifique, correctif décidé à ce moment-là selon la raison affichée par Resend.
