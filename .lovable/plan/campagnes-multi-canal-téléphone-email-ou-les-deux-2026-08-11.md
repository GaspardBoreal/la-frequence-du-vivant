# Campagnes multi-canal : téléphone, email, ou les deux

Aujourd'hui une campagne est implicitement une campagne d'appels : la table des membres ne parle que d'appels (`call_status`, `attempts`, `last_call_at`, `next_call_at`) et l'espace de travail est la « Salle d'appels ». Objectif : qu'une campagne déclare son canal et que toute l'interface s'y adapte, sans casser les campagnes existantes.

## 1. Le canal, une identité visible

Chaque campagne reçoit un canal : **Téléphone**, **Email**, ou **Mixte**.

- Choisi à la création/édition, affiché partout comme une pastille lisible : combiné, enveloppe, ou les deux entrelacés.
- La carte de campagne annonce son canal, sa couleur et ses compteurs propres au canal.
- Les campagnes existantes deviennent « Téléphone » (comportement inchangé).

## 2. Un atelier par canal : « L'Atelier de campagne »

La « Salle d'appels » devient un atelier unique qui change de visage selon le canal.

```text
Téléphone   -> Salle d'appels (existante) : file d'appel, script, issue d'appel, rappel
Email       -> Table d'envoi : file d'envoi, objet + corps, suivi ouverture/réponse
Mixte       -> Piste unifiée : chaque prospect affiche sa prochaine action (appeler ou écrire)
```

En mixte, chaque prospect porte une **cadence** simple et lisible : email d'accroche -> relance téléphone -> email de clôture. L'atelier propose toujours « la prochaine action à faire maintenant », triée par priorité et par échéance : on n'a plus à choisir quoi faire, seulement à le faire.

## 3. Un statut par canal, plus un statut de campagne

Aujourd'hui `call_status` sert de statut unique. On ajoute un statut email (non contacté, envoyé, ouvert, répondu, désabonné, bounce) et un **statut d'engagement** consolidé, affiché dans la table des prospects : à traiter / en cours / joint / refus / gagné. Le badge de canal indique par quel moyen le contact a réellement abouti.

## 4. Statistiques honnêtes par canal

Les KPI de la campagne s'affichent selon son canal :

- Téléphone : tentatives, taux de joignabilité, refus, rappels planifiés.
- Email : envoyés, ouverts, répondus, bounces.
- Mixte : les deux colonnes côte à côte, plus « premier canal ayant déclenché la réponse » — la réponse à la question « qu'est-ce qui marche ici ? ».

Ce qui n'est pas mesurable pour un canal donné n'est simplement pas affiché (sobriété informationnelle), plutôt que rempli de zéros trompeurs.

## 5. Scripts et modèles

`script` (jsonb) accueille deux volets : le script d'appel existant et un ou plusieurs **modèles d'email** (objet + corps) avec variables `{{société}}`, `{{contact}}`, `{{pilote}}`. En atelier email, le modèle est pré-rempli et modifiable avant envoi.

## Détails techniques

- Migration `crm_campaigns` : ajout `canal text not null default 'telephone'` (`telephone` | `email` | `mixte`) + contrainte de valeurs ; backfill implicite par le default.
- Migration `crm_campaign_members` : ajout `email_status text not null default 'non_contacte'`, `emails_sent int not null default 0`, `last_email_at timestamptz`, `next_action_at timestamptz`, `next_action_canal text`. Grants inchangés (colonnes ajoutées à une table existante).
- Statut consolidé calculé côté lecture (pas de colonne dérivée) dans un helper `src/lib/crm/campaignChannel.ts` : canal, libellés, icônes, dérivation du statut d'engagement, et « prochaine action ».
- `CampaignFormDialog.tsx` : sélecteur de canal (3 options) + onglet Modèles d'email écrivant dans `script.email_templates`.
- `CallRoom.tsx` renommé conceptuellement en atelier : extraction d'un `CampaignWorkbench` qui rend `CallRoom` (téléphone), un nouveau `MailRoom` (email), ou une piste unifiée (mixte). Aucun changement de route.
- `CampaignMembersTable.tsx` : colonnes conditionnelles selon le canal, badge d'engagement, prochaine action.
- `CampaignAnalytics.tsx` : blocs KPI conditionnés au canal.
- Les envois d'email réutilisent le mécanisme existant (`crm_email_logs`) ; on y rattache `campaign_id` si la colonne existe déjà, sinon on l'ajoute dans la même migration.
