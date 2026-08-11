# Retrouver les 4 % de la campagne « Financement générique »

## Constat (vérifié en base)

Les 4 prospects intéressés sont bien là, rien n'a été perdu :

- 4 prospects « intéressé » (Naturalia, Lakaa, Vienne Nature, Upciti), 94 « joint », 2 « refus ».
- L'indicateur calculé côté base donne bien 4 intéressés / 100 touchés = **4 %**.

Ce qui a changé, c'est l'affichage. Depuis le passage multi-canal, la campagne est enregistrée avec le canal **Email**. Or, pour une campagne email, la carte et le pilotage calculent le taux uniquement à partir des envois d'emails tracés dans l'outil (0 envoi enregistré, car la campagne a été menée avant la Table d'envoi) et des réponses email (0). Résultat : 0 / 0 → **0 %**, alors que l'historique téléphone est ignoré.

## Correction

1. **Un indicateur unique, insensible au canal.** Le taux de détection d'intérêt devient :
   - numérateur : prospects aboutis, quel que soit le canal (statut d'appel « intéressé » **ou** email « répondu ») ;
   - dénominateur : prospects réellement touchés (joints par téléphone **ou** destinataires d'un email tracé).
   - Ainsi les 4 intérêts historiques comptent de nouveau, et les futures réponses email s'y ajouteront naturellement.
2. **Garde-fou** : si aucun contact n'est tracé sur un canal, ce canal n'entre pas au dénominateur — impossible qu'un canal vide écrase le résultat d'un autre.
3. **Pilotage** : pour une campagne email, le grand cadran affiche à nouveau le taux de détection d'intérêt (avec la cible 10 %), le taux de réponse email restant un indicateur secondaire à côté. L'entonnoir cumule contacts téléphone et emails au lieu de n'en montrer qu'un.
4. **Détail par prospect** : les 4 intéressés apparaissent en « Intérêt » dans la liste quelle que soit la nature de la campagne (déjà le cas via le statut d'engagement, à vérifier à l'écran).
5. **Réglage du canal** : cette campagne a été menée au téléphone puis par email ; je propose de la basculer en canal **Mixte**, plus fidèle, une fois l'indicateur corrigé.

## Détails techniques

- `src/lib/crm/campaignChannel.ts` : nouvelle fonction `interestRateOf(stats, members)` — succès = `call_status = 'interesse'` ∪ `email_status = 'repondu'`, touchés = `joints` ∪ membres avec `emails_sent > 0`, en dédoublonnant par membre.
- `src/components/crm/campaigns/CampaignCard.tsx` : remplacer le calcul `touches/succes` conditionné au canal (lignes ~54-57) par cet appel unique ; la carte a déjà `members` disponibles via le hook, sinon utiliser les compteurs `stats`.
- `src/components/crm/campaigns/CampaignAnalytics.tsx` : le cadran principal utilise `interestRateOf` pour tous les canaux ; `mail.taux_reponse` devient une tuile secondaire ; l'entonnoir email ajoute les étapes téléphone quand `joints > 0`.
- Aucun changement de schéma ni de RPC : `get_campaign_stats` renvoie déjà les bons compteurs.
- Changement de canal de la campagne : simple mise à jour de données, à faire après validation.
