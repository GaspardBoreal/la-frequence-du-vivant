# Fiabiliser les chiffres de la campagne « Financement générique »

## Constat (vérifié en base)
- 99 prospects enrôlés, **tous marqués « intéressé »** par le rattachement en masse précédent → taux de détection affiché à 100 %, entonnoir faux, motifs de refus vides.
- La réalité : seules **4 opportunités sont en Relance 2** — NATURALIA FRANCE, LAKAA (Lefebvre), Vienne Nature (Thubé), UPCITI (Sangani). Ce sont exactement les 4 de la capture, les seuls intérêts réellement détectés.
- Les 95 autres sont en Relance 1 : plaquette envoyée, aucune réponse d'intérêt.
- Les deux refus mécénat (Léa Nature, La Boulangère Bio) ne sont toujours rattachés à aucune campagne.

## PB1 — Remettre les chiffres d'aplomb
1. Repasser les 95 prospects en Relance 1 au statut d'appel **« joint »** (contactés, sans intérêt déclaré).
2. Laisser **« intéressé »** aux 4 prospects en Relance 2.
3. Rattacher les 2 opportunités perdues (Léa Nature, La Boulangère Bio) à la campagne avec le statut **« refus »** et leur motif tiré de leur réponse écrite.

Résultat : 101 enrôlés, 101 joints, 4 intéressés → **taux de détection 4 %** contre une cible de 10 %, ce qui correspond à la référence historique, et un bloc « motifs de refus » enfin exploitable.

## PB2 — Comment tenir le lien prospect ↔ opportunité dans la durée
Règle unique, une seule source de vérité par phase :

```text
Prospect de campagne  = phase prospection (a_appeler → joint → intéressé / refus)
Opportunité           = phase pipeline (relance_1 … gagné / perdu)
Le passage de l'une à l'autre se fait par opportunity_id
```

- **Sens prospection → pipeline** (déjà en place) : en Salle d'appels, « Intérêt » crée l'opportunité et inscrit son `opportunity_id` sur la fiche prospect.
- **Sens pipeline → prospection** (à ajouter) : un déclencheur en base met à jour le statut d'appel du prospect quand le statut de son opportunité change :
  - opportunité **perdue** → prospect en « refus » (motif conservé s'il existe déjà)
  - opportunité **relance 2 et au-delà, ou gagnée** → prospect en « intéressé »
  - opportunité repassée en **relance 1** → prospect en « joint »
- Conséquence : plus aucune divergence possible entre le Kanban et le tableau de bord de campagne, quel que soit l'endroit où l'on travaille.
- Affichage : sur la fiche prospect et dans le tableau des prospects, un badge indique le statut de l'opportunité liée, pour lire les deux niveaux d'un coup d'œil.

## Détails techniques
- Opération de données : `UPDATE crm_campaign_members` par jointure sur `crm_opportunities.statut` ; `UPDATE crm_opportunities SET campaign_id, closed_at` + `INSERT ... NOT EXISTS` pour les 2 refus.
- Migration : fonction `crm_sync_campaign_member_from_opportunity()` + trigger `AFTER UPDATE OF statut ON crm_opportunities`, en `SECURITY DEFINER` avec `search_path = public`, sur le modèle de `crm_log_stage_change`.
- Front : `CampaignMembersTable.tsx` affiche le statut d'opportunité lié (jointure déjà disponible via `opportunity_id`). Aucun changement sur `get_campaign_stats`, qui recalcule à la lecture.
