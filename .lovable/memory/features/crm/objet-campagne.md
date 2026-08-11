---
name: Objet Campagne CRM
description: Campagnes d'appels à froid dans le CRM — ciblage annuaire, enrôlement, salle d'appels, taux de détection d'intérêt, filtre campagne dans le pipeline
type: feature
---

Objet **Campagne** intercalé entre Annuaire et Opportunités (`/admin/crm/campagnes`).

- Tables : `crm_campaigns` (objectif, statut, ciblage jsonb, script jsonb, objectif_contacts, objectif_taux) et `crm_campaign_members` (call_status, attempts, next_call_at, refus_motif, opportunity_id). `crm_opportunities.campaign_id` relie l'opportunité à sa campagne.
- RPC : `get_campaign_stats`, `get_campaign_daily`.
- **Indicateur roi** = taux de détection d'intérêt, calculé par `interestRateOf` (src/lib/crm/campaignChannel.ts), **insensible au canal** : succès = `call_status='interesse'` ∪ `email_status='repondu'`, touchés = joints tél ∪ destinataires d'un email tracé (un canal sans contact tracé n'entre jamais au dénominateur) (objectif 10 %, référence historique 4 %). Toujours l'afficher contre la cible de la campagne.
- **Recruter** rejoue le ciblage sur l'annuaire (`useCrmCompanies`) et exclut les entreprises déjà enrôlées ; signale les doublons multi-campagnes.
- **Salle d'appels** : un prospect à la fois, script (accroche / preuve / demande) sous les yeux, issues en un clic (Intérêt → crée l'opportunité en `relance_2` source `campagne`, Refus + motif, Rappel J+3, Injoignable, Joint).
- Motifs de refus normalisés (`REFUS_MOTIFS`) pour analyser les causes et réajuster le ciblage.
- Pipeline : filtre multi-campagnes via l'URL `?campaigns=id1,id2`, intégré à `usePipelineFilters` (prédicat `matchesAll` unique pour Kanban/Liste/Carte).
