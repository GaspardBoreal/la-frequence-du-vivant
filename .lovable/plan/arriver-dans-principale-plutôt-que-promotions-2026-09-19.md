# Arriver dans « Principale » plutôt que « Promotions »

Bonne nouvelle : la chaîne fonctionne de bout en bout. Le message est bien parti, Resend l'a remis, et Gmail l'a rangé dans l'onglet **Promotions**. Ce classement est décidé par Gmail seul ; on ne peut pas le forcer, mais on peut fortement l'influencer en rendant le message moins « marketing » et plus « courrier ».

## Ce que je propose

### 1. Un mode d'envoi « lettre personnelle »
Un réglage par lettre, dans l'onglet Composer : **Présentation → Lettre (texte) / Journal (mise en page riche)**.

En mode Lettre :
- pas de fond coloré, pas de bandeau, pas de bouton coloré — le lien d'action devient un lien texte souligné ;
- une seule colonne, typographie proche d'un message écrit à la main ;
- pas d'image en en-tête.

C'est le facteur le plus déterminant : Gmail repère les gabarits à boutons et images comme promotionnels.

### 2. Version texte jointe à chaque envoi
Aujourd'hui l'email part en HTML seul. J'ajoute une version texte équivalente (multipart). Un message HTML seul est un signal promotionnel classique.

### 3. En-têtes de courrier conformes
- `List-Unsubscribe` + `List-Unsubscribe-Post` (désinscription en un clic native Gmail) ;
- `Reply-To` sur une adresse réellement lisible.

Ces en-têtes classent l'expéditeur comme émetteur sérieux et évitent le dossier Spam sur les envois de masse.

### 4. Moins de suivi visible
Le suivi des ouvertures (pixel invisible) et la réécriture des liens de clic sont deux marqueurs promotionnels. J'ajoute un interrupteur par lettre : **Suivi des ouvertures et des clics : activé / désactivé**, désactivé par défaut pour les lettres personnelles. Les statuts « remis / rejeté » continuent de fonctionner (ils viennent du webhook, pas du pixel).

### 5. Test vers une seconde adresse
La fenêtre de test accepte déjà plusieurs adresses ; j'ajoute un rappel explicite d'y mettre une adresse non-Gmail (Outlook, Orange, adresse pro) afin de comparer le classement chez un autre fournisseur.

### 6. Conseils intégrés dans le Studio
Un encart court, à côté du résumé de test, expliquant :
- ce que vous pouvez faire côté destinataire (glisser le message de Promotions vers Principale, puis accepter « Faire cela pour tous les messages futurs » ; ou ajouter l'expéditeur aux contacts) — c'est la méthode la plus fiable et elle vaut pour votre propre adresse ;
- que le classement s'améliore avec la régularité et les réponses/ouvertures réelles.

## Détails techniques

- `supabase/functions/newsletter-send/index.ts` : ajout de `text` (version texte dérivée des blocs), des en-têtes `List-Unsubscribe` et `List-Unsubscribe-Post`, et prise en compte du drapeau de suivi (pixel et réécriture de liens conditionnels).
- `src/lib/newsletter/newsletter-render.ts` : nouveau rendu `letter` (sans table de mise en page décorative, sans bouton, sans image d'en-tête) + fonction `renderPlainText(blocks)`.
- Migration : colonnes `presentation text not null default 'journal'` et `tracking_enabled boolean not null default true` sur `newsletter_campaigns` (GRANT existants inchangés).
- `src/pages/AdminNewsletterEditor.tsx` : sélecteur de présentation, interrupteur de suivi, rappel « ajoutez une adresse non-Gmail » et encart de conseils.
- `src/hooks/admin/useNewsletter.ts` : les deux nouveaux champs dans le type de campagne et dans l'enregistrement.

## Ce que cela ne garantit pas

Gmail ne publie pas ses règles et peut maintenir l'onglet Promotions malgré tout. Le geste manuel (déplacer le message vers Principale une fois) reste le seul levier certain côté destinataire — le reste augmente la probabilité pour l'ensemble de vos lecteurs.
