# L'objet Campagne dans le CRM

Nouvel étage entre **Annuaire** et **Opportunités** : une campagne définit une cible, embarque des prospects de l'annuaire, organise les appels, et mesure son rendement en temps réel (taux de détection d'intérêt).

```text
Annuaire (entreprises)  →  Campagne (cible + liste d'appel)  →  Opportunités (pipeline)
```

## 1. Écran Liste des campagnes — `/admin/crm/campagnes`

Cartes campagne (bento, cohérent avec l'Accueil CRM) affichant pour chacune :
- nom, segment visé, période, statut (brouillon / active / en pause / clôturée), pilote
- barre de progression « appelés / cible »
- **Taux de détection d'intérêt** en gros chiffre avec objectif (ex. 4 % → cible 10 %), pastille verte/ambre/rouge
- actions rapides : reprendre les appels, ouvrir, dupliquer, archiver

Filtres : statut, pilote, période. Tri par rendement.

## 2. Création / édition d'une campagne

Formulaire en 3 volets :
1. **Identité** — nom, objectif (partenariat, mécénat, prestation), dates, pilote, objectif de rendement (%), objectif de contacts.
2. **Ciblage** — critères sauvegardés : secteur/labels, département/région, taille, stage annuaire (suspect/prospect), mots-clés. Le ciblage est *stocké* pour pouvoir re-rejouer la recherche et proposer de nouveaux prospects correspondants.
3. **Script & argumentaire** — accroche, 3 objections/réponses, lien plaquette. Affiché pendant les appels.

Suppression avec confirmation (les opportunités ne sont pas supprimées, seulement détachées).

## 3. Rattacher des prospects — sans friction

Trois chemins, tous vers la même table de membres de campagne :
- **Depuis l'annuaire** : sélection multiple existante → bouton « Ajouter à une campagne » (choix ou création à la volée).
- **Depuis la campagne** : panneau « Recruter » qui rejoue les critères de ciblage et propose les entreprises non encore enrôlées, ajout en un clic ou « tout ajouter ».
- **Depuis une opportunité** : sélecteur « Campagne » dans le formulaire d'opportunité.

Anti-doublon : une entreprise ne peut être enrôlée qu'une fois par campagne, et on signale si elle est déjà active dans une autre campagne.

## 4. Organiser les appels — « La Salle d'appels »

Vue plein écran, un prospect à la fois :
- fiche condensée (site web, positionnement, contact, historique) + script de la campagne à droite
- issue en un clic : *Pas de réponse* / *Rappeler* (avec date) / *Intéressé* → crée l'opportunité rattachée / *Refus* (avec motif dans une liste courte)
- note dictée/tapée, enregistrée sur la fiche et l'opportunité
- passage automatique au suivant ; file d'appel priorisée (jamais appelés → rappels du jour → relances)
- compteur de session : appels passés, intérêts détectés, temps moyen

C'est la brique qui fait passer le rendement : elle supprime la navigation entre onglets pendant les appels.

## 5. Monitorer le rendement

Onglet **Pilotage** dans la campagne :
- entonnoir : enrôlés → joints → intéressés → opportunités actives → gagnées
- taux de détection d'intérêt vs objectif, avec courbe jour par jour
- **Motifs de refus** classés (top 5) — la matière pour corriger le script
- rendement comparé par segment/secteur, pour identifier où concentrer l'effort restant
- meilleurs créneaux horaires de décroché

## 6. Filtres campagne dans les Opportunités

- Ajout d'un filtre **Campagne** dans la barre de filtres du pipeline (multi-sélection), partagé par Kanban / Liste / Carte, persisté en URL (`campaigns=`).
- Badge campagne sur les cartes d'opportunité et colonne dans la vue Liste.

## Détails techniques

Base de données (migration, avec GRANT + RLS réservés aux rôles CRM, sur le modèle des tables `crm_*` existantes) :
- `crm_campaigns` — nom, objectif, statut, dates, pilote (`team_members`), objectifs chiffrés, script (jsonb), critères de ciblage (jsonb).
- `crm_campaign_members` — `campaign_id` + `company_id` (et/ou `contact_id`), statut d'appel, dernier appel, prochain rappel, motif de refus, notes, `opportunity_id` créée. Unicité `(campaign_id, company_id)`.
- `crm_opportunities.campaign_id` — colonne nullable + index.
- RPC `get_campaign_stats(campaign_id)` pour l'entonnoir et les taux, afin d'éviter de rapatrier toute la base côté client.

Front :
- Route `campagnes` + `campagnes/:id` dans `src/App.tsx`, entrée « Campagnes » dans `CrmSidebar` entre Annuaire et Opportunités.
- Pages `CrmCampagnes.tsx`, `CrmCampagneDetail.tsx` (onglets Cible / Membres / Salle d'appels / Pilotage).
- Hooks `useCrmCampaigns`, `useCampaignMembers`, `useCampaignStats`.
- `usePipelineFilters` étendu avec `campaigns`, `PipelineFiltersBar` complété.
- Tokens sémantiques CRM existants (`--crm-*`), micro-animations Motion sur les compteurs et le passage d'appel.

## Ordre de livraison

1. Schéma + rattachement opportunité + filtre campagne dans le pipeline (utilisable immédiatement sur la campagne en cours).
2. Liste + création/édition + enrôlement depuis l'annuaire.
3. Salle d'appels.
4. Pilotage et motifs de refus.
