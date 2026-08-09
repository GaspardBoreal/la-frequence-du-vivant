# Concordance sol / flore en 5 crans — état réel

## Verdict

Oui, le chantier « Refonte de la concordance sol / flore en échelles à 5 crans » est livré côté produit. Il reste une seule chose à faire : le marquer comme terminé dans la feuille de route, où il est encore affiché « à faire ».

## Ce qui est constaté dans l'application

- Moteur de projection et libellés de texture : `src/lib/soilFloraScales.ts`.
- Trois curseurs à 5 crans (Eau, Nutrition, pH) avec deux repères — le sol et la flore — et l'écart énoncé en mots, sans chiffre : `ScaleRow`.
- La texture n'est plus un triangle mais un mot (« argilo-limoneux ») accompagné des trois jauges argile / limon / sable : `TextureWord`.
- Présent partout où la concordance se lit : écran « J'identifie » (`ConcordanceBlock`, `IdentifySummary`), écran « Je synthétise » (`TabSynthesize`), avant / après du chantier (`ChantierScales`, rapport imprimé) et impressions Identifier / Combinée via la synthèse.

## Ce qui n'est pas dans ce lot (tâche voisine, toujours à faire)

« Détail replié derrière le curseur » : aujourd'hui les curseurs ne s'ouvrent pas au clic pour révéler le décompte (« 11 plantes fraîches contre 8 sèches ») et la liste des espèces qui portent le verdict. C'est une tâche distincte de la feuille de route, estimée 2 jours, qui reste ouverte.

## Travaux proposés

1. Passer le statut de la tâche « Refonte de la concordance sol / flore en échelles à 5 crans » de « à faire » à « terminé » dans `src/lib/partnerRoadmaps/vdtpRoadmap.ts`, avec une note de livraison courte visible sur la page partenaire.
2. Ne rien changer d'autre : la tâche « Détail replié derrière le curseur » reste en l'état, pour être traitée dans un chantier suivant si vous le souhaitez.

## Détails techniques

Seul `src/lib/partnerRoadmaps/vdtpRoadmap.ts` est modifié (champ `status` de la tâche, thème `echelles`, priorité P1). Aucun impact sur le diagnostic, les impressions ou la base de données.
