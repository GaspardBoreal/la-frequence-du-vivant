# Clôturer l'analyse de la campagne « Financement générique »

## Constat (vérifié en base)
- Les deux refus mécénat — **Léa Nature (BIO)** (COMPAGNIE LEA NATURE) et **La Boulangère Bio** (LA BOULANGERE) — sont bien au statut « perdu », mais ils ne sont **rattachés à aucune campagne** aujourd'hui, et leur date de clôture est vide.
- Leurs notes contiennent la réponse écrite de refus : Léa Nature indique que les sciences participatives ne sont pas dans ses axes prioritaires de philanthropie ; La Boulangère répond une fin de non-recevoir à la demande de partenariat.
- Les trois autres opportunités « perdu » de la base (Vignoble Castillon Claire, Galande & Associés, Bastien Panier des familles) relèvent d'offres de marches commerciales, pas de la recherche de financement : elles restent hors campagne.

## Ce qui sera fait
1. Rattacher les deux opportunités Léa Nature et La Boulangère Bio à la campagne Financement générique.
2. Créer leur fiche prospect dans la campagne avec le statut d'appel « refus » et le motif de refus tiré de leur réponse :
   - Léa Nature : « Hors axes prioritaires de financement (sciences participatives) »
   - La Boulangère Bio : « Refus de partenariat / mécénat »
3. Renseigner leur date de clôture avec la date de la dernière réponse enregistrée (3 août pour Léa Nature, 6 août pour La Boulangère), pour que la campagne ait une fin de cycle datée.

## Effet attendu
- Onglet Pilotage : l'entonnoir passe à 101 prospects, dont 2 refus qualifiés avec motif, et le bloc « motifs de refus » devient exploitable.
- Onglet Prospects : les deux lignes apparaissent en refus, plus rappelables par erreur en Salle d'appels.
- Pipeline : les deux opportunités remontent sous le filtre campagne « Financement générique », en colonne Perdu et datées.

## Détails techniques
Opération de données seule, sans changement de schéma ni de code :
- `UPDATE crm_opportunities SET campaign_id = <id campagne>, closed_at = <date de la réponse>` sur les deux identifiants.
- `INSERT INTO crm_campaign_members (campaign_id, company_id, opportunity_id, call_status, refus_motif, attempts, last_call_at)` avec `call_status = 'refus'`, protégé par un `NOT EXISTS` sur `opportunity_id` pour rester idempotent.
