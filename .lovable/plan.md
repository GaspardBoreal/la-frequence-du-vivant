# Ne plus afficher « Aucune Marche du Vivant… » pendant le chargement

## Constat
Sur la page d'un jardin, le bandeau reçoit « aucune date de dernière marche » tant que les données de biodiversité ne sont pas arrivées. Il conclut donc à tort qu'aucune marche n'a eu lieu, puis le message disparaît une fois le chargement fini.

## Correctif
- Afficher le bandeau uniquement une fois les données du jardin réellement chargées (ni pendant le chargement, ni en cas d'erreur).
- Garder le message pour les jardins qui n'ont vraiment aucune marche, ou dont la dernière marche remonte à plus de 12 mois.

## Détails techniques
- `ProprieteEspace.tsx` : récupérer `isSuccess` de `usePropertyBiodiversity(proprieteId)` et ne rendre `NudgeMarcheBanner` que si `isSuccess && bio`.
