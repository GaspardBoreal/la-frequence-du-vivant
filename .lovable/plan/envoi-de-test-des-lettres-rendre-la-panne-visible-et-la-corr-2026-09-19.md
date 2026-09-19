# Envoi de test des lettres : rendre la panne visible et la corriger

## Ce que montrent les vérifications

- La lettre « Prochaine marches du vivant : Château Boutinet » est bien enregistrée (objet présent, 4 blocs, sauvegarde à 14:38:59).
- La fonction d'envoi s'est bien réveillée juste après (14:39:00 et 14:39:01), mais **elle n'a écrit aucune ligne de journal** : impossible de savoir si le refus vient du contrôle d'accès, du format du message ou du refus de Resend.
- La clé Resend est bien présente. En revanche la lettre n'a **pas d'adresse d'expéditeur propre** : elle emprunte celle du Carnet de terrain (l'adresse « jardin »), ce qui n'est ni voulu ni visible à l'écran.
- Deux limites connues du mode « envoi groupé » de Resend peuvent faire rejeter le message en bloc : les **étiquettes de campagne** et certains **en-têtes** ne sont pas acceptés sur ce mode. Un test part aujourd'hui par ce même canal groupé.
- Diagnostic non confirmé à 100 % faute de journal : la première étape du plan est donc de rendre chaque étape traçable, puis de corriger.

## Ce qui va changer

1. **Un envoi de test part par le canal simple de Resend** (un message à la fois, jusqu'à 10), celui qui accepte l'en-tête de désinscription et la réponse attendue. Les envois de masse gardent le canal groupé, sans les étiquettes refusées.
2. **L'écran dit la vérité** : au lieu d'un simple « Test envoyé », vous voyez le nombre réellement accepté, l'adresse d'expéditeur utilisée, et en cas de refus le motif exact renvoyé par Resend (domaine non vérifié, adresse refusée, quota…).
3. **Chaque étape est journalisée** côté serveur (accès, lettre lue, adresse d'expéditeur retenue, réponse de Resend) pour que la prochaine panne se diagnostique en une minute.
4. **L'expéditeur devient explicite** : un champ « Adresse d'expéditeur » dans l'écran de composition, pré-rempli avec l'adresse vérifiée du domaine, avec un avertissement si aucune adresse propre n'est choisie.
5. **Contrôle avant envoi** : si Resend refuse toutes les adresses, la lettre n'est pas marquée comme envoyée et le message d'erreur reste affiché.

## Détails techniques

- `supabase/functions/newsletter-send/index.ts` : logs structurés à chaque étape ; branche test via `POST https://api.resend.com/emails` (boucle sur ≤10 adresses) ; suppression de `tags` sur `/emails/batch` ; retour enrichi `{ ok, sent, failed, from, failures[] }`.
- `src/hooks/admin/useNewsletter.ts` : propager `failures` et `from` jusqu'à l'appelant.
- `src/pages/AdminNewsletterEditor.tsx` : champ `from_email`, toast détaillé (succès partiel inclus), affichage des motifs de refus dans la fenêtre de test.
- Aucune modification de base de données (`from_email` existe déjà sur `newsletter_campaigns`).

## Après la correction

Nouveau test vers `gaspard.boreal@gmail.com`, lecture des journaux de la fonction pour confirmer l'identifiant de message renvoyé par Resend. Si Resend refuse l'adresse d'expéditeur, le message d'erreur nommera le domaine à vérifier dans Resend.
