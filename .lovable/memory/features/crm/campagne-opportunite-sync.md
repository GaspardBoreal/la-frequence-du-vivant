---
name: Lien prospect de campagne ↔ opportunité
description: Règle unique de synchronisation entre crm_campaign_members.call_status et crm_opportunities.statut (trigger DB), pour que les chiffres de campagne ne divergent jamais du pipeline
type: feature
---

Une seule source de vérité par phase :
- **Prospect de campagne** (`crm_campaign_members.call_status`) = phase prospection : `a_appeler → joint → interesse / refus / injoignable`.
- **Opportunité** (`crm_opportunities.statut`) = phase pipeline. Lien par `opportunity_id`.

Sens prospection → pipeline : la Salle d'appels crée l'opportunité sur « Intérêt » et renseigne `opportunity_id`.

Sens pipeline → prospection : trigger `trg_crm_sync_campaign_member` (`AFTER UPDATE OF statut ON crm_opportunities`) → fonction `crm_sync_campaign_member_from_opportunity()` :
- `perdu` / `pas_interesse` → `refus` (le motif déjà saisi n'est pas écrasé)
- `relance_2`, `relance_3`, `gagne` → `interesse`
- `relance_1` → `joint`
- `a_contacter` → `a_appeler`

**Ne jamais marquer en masse des prospects « interesse » lors d'un rattachement rétroactif** : un import doit dériver le `call_status` du statut d'opportunité, sinon le taux de détection d'intérêt monte artificiellement à 100 %.

Campagne « Financement générique » (réf. historique) : 101 enrôlés, 95 joints, 4 intéressés (Naturalia, Lakaa, Vienne Nature, Upciti), 2 refus → taux 4 % pour une cible de 10 %.
