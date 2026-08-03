---
name: Le Chantier avant/après
description: Module « Le Chantier » de l'Atelier — lot d'ouvrages persistant, ICG avant/projeté/constaté, prélèvements et médias par phase, rapport A4 simple ou complet
type: feature
---

Le Chantier compare l'état d'un lot d'ouvrages avant et après travaux.

- **Lot persistant** : tables `propriete_chantiers` (nom, `objet_ids[]`, `date_travaux`, statut) et `propriete_chantier_media_phases` (surcharge manuelle de la phase d'une photo). RLS via `can_access_propriete`.
- **Périmètre** : toujours géométrique (`ouvrageScope.classifyObservations`, jamais un disque autour du centroïde), avec curseur de rigueur strict / lisière 3 m / voisinage 15 m — même vocabulaire que le Scénographe.
- **ICG** : `src/lib/chantierIcg.ts` rejoue le barème D.S. de « J'identifie » (`computeConcordanceDetail`) restreint au lot, sur trois états — avant, projeté (espèces du scénario) et constaté (observations postérieures à la date des travaux). Le calcul est toujours affiché ligne à ligne (sol lu / flore lue / verdict / points) avec la phrase du total.
- **Sol** : seuls les prélèvements géolocalisés dans le périmètre alimentent le `SoilLite` du lot ; sinon repli sur la lecture propriété.
- **Médias** : phase déduite de `taken_at` vs date des travaux, surchargeable à la main (AV/PD/AP) ; mosaïque ou rideau comparatif.
- **Rapport** : `ChantierRapportLayout` en portail `#chantier-print-portal` (classe `chantier-print-mode`), format « simple » (bilan + calcul + preuves) ou « complet » (planches espèces en place et apports retenus). Vignettes résolues via `resolveSpeciesThumbs` avant impression.
- **Entrée** : bouton « Le Chantier » dans la barre de l'Atelier du jardin nourricier.
