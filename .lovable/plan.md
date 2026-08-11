# Rattacher les relances à la campagne « Financement générique »

## Constat (vérifié en base)
- Campagne existante : « Campagne FINANCEMENT GENERIQUE (mécène, sponsor) », statut actif.
- Opportunités : 95 en Relance 1, 4 en Relance 2 — aucune n'est aujourd'hui rattachée à une campagne.
- Relance 3 (1 opportunité) reste hors périmètre.

## Ce qui sera fait
1. Rattacher les 99 opportunités (Relance 1 + Relance 2) à la campagne Financement générique.
2. Les faire apparaître dans l'onglet Prospects de la campagne : création d'une fiche prospect par opportunité, avec l'entreprise liée quand elle existe, un statut d'appel « intéressé » (elles sont déjà en relance, donc en aval de la prise de contact) et un rattachement direct à l'opportunité.
3. Aucun doublon : les opportunités déjà rattachées et les prospects déjà présents sont ignorés.

## Effet attendu
- Filtre campagne du pipeline : les 99 opportunités remontent sous « Financement générique ».
- Onglet Pilotage : l'entonnoir et le taux de détection d'intérêt intègrent ces 99 lignes.
- Onglet Prospects : liste complète, exploitable en Salle d'appels pour les relances.

## Détails techniques
- Une opération de données en deux temps, sans changement de schéma :
  - `UPDATE crm_opportunities SET campaign_id = <id campagne> WHERE statut IN ('relance_1','relance_2') AND campaign_id IS NULL`
  - `INSERT INTO crm_campaign_members (campaign_id, company_id, opportunity_id, call_status, priorite)` en `SELECT` depuis ces opportunités, avec un `NOT EXISTS` sur `opportunity_id` pour l'idempotence.
- Aucun fichier applicatif à modifier : l'UI campagnes/pipeline lit déjà `campaign_id` et `crm_campaign_members`.
