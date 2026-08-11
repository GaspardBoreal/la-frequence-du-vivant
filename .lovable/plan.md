# Remettre la campagne « Financement générique » d'aplomb

État réel en base aujourd'hui pour cette campagne : 100 prospects enrôlés, tous avec `email_status = non_contacte` et `emails_sent = 0` ; le téléphone porte tout l'historique (94 « joint », 4 « intéressé », 2 « refus »). Côté pipeline : 100 opportunités rattachées — 94 en Relance 1, 4 en Relance 2, 2 perdues. D'où l'affichage « 0 email envoyé / 0 % de réponse » alors que la campagne a en réalité été menée à l'email.

## 1. Rétablir la vérité historique des données

Mise à jour ponctuelle des 100 membres de la campagne :

- 100 emails envoyés (`emails_sent = 1`, date d'envoi renseignée sur la date de création du membre).
- 6 réponses : les 4 intéressés et les 2 refus passent en « répondu » côté email.
- Les 94 autres restent « envoyé, sans réponse » — et non plus « joint au téléphone », qui est faux : leur statut téléphone redevient « non contacté ».
- Une seule exception téléphone : **Vienne Nature**, dont l'intérêt a bien été déclenché par un appel — on lui garde 1 tentative d'appel et le statut « intéressé » au téléphone.

Conséquence attendue à l'écran : Emails envoyés 100 · Taux de réponse 6 % · Détection d'intérêt 4 % · Appels passés 1 · « Quel canal a déclenché l'intérêt ? » Email 3 / Téléphone 1.

## 2. La tuile « Opportunités » devient lisible

Aujourd'hui elle annonce « 100 · 98 actives », ce qui ne dit rien : chaque prospect enrôlé a une opportunité de suivi. On la recentre sur ce qui se joue :

- Chiffre principal : **opportunités qualifiées** = celles ayant dépassé la première relance et non perdues (aujourd'hui 4).
- Sous-titre : « 100 créées · 2 perdues », pour garder la trace du volume sans le mettre en avant.

## 3. Cliquer sur « Détection d'intérêt » ouvre les intérêts

La tuile 4 % devient cliquable et ouvre une fenêtre « Les intérêts détectés » :

- une carte par prospect abouti : société, canal ayant déclenché l'intérêt (pastille email ou téléphone), étape pipeline, montant si renseigné, date ;
- clic sur une carte → ouvre l'opportunité dans le pipeline ;
- bouton de pied de fenêtre « Voir dans le pipeline » qui bascule sur le pipeline filtré sur cette campagne.

Même geste disponible depuis la carte de campagne dans la liste (le taux y devient cliquable et mène à la campagne, onglet Pilotage, fenêtre ouverte).

## Détails techniques

- Mise à jour de données (pas de migration de schéma) sur `crm_campaign_members` : `emails_sent`, `last_email_at`, `email_status`, remise à zéro de `call_status`/`attempts` sauf pour la ligne Vienne Nature.
- `CampaignAnalytics.tsx` : tuile Opportunités recalculée (source : `stats` + membres) ; tuile « Détection d'intérêt » enveloppée dans un bouton ouvrant un nouveau `InterestDrawer.tsx`.
- Nouveau `src/components/crm/campaigns/InterestDrawer.tsx` : liste les membres dont `engagementOf(m) === 'gagne'`, jointure locale avec les opportunités déjà chargées, navigation `/admin/crm/pipeline?opportunity=<id>` et `?campaigns=<id>`.
- `campaignChannel.ts` inchangé : `interestRateOf` et `canalDeclencheur` produiront directement les bons chiffres une fois les données corrigées.
