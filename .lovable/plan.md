# Note de valorisation : compte association + Top 10 marcheurs

## 1. Lignes « — dont signées Les marches du Vivant »
Le compte générique existe bien : profil « Les marches du Vivant » (iNaturalist `@les-marches-du-vivant`).

Une ligne est ajoutée sous chacune de ces familles, à côté des lignes G. Boréal :
- Observations marcheurs, Médias marcheurs : comptées par compte utilisateur, comme pour G. Boréal.
- Snapshots biodiversité : compte des espèces des relevés dont l'observateur iNaturalist est `les-marches-du-vivant` (et `gaspard-boreal` pour la ligne G. Boréal si l'identifiant est présent).
- Photos de marches, Audios de marches : ces tables ne mémorisent pas l'auteur. Elles sont publiées par l'équipe des Marches du Vivant ; la ligne affichera le total avec la mention « contenu éditorial MdV (auteur non enregistré) », plutôt qu'un chiffre inventé.

Le total attribuable et le ratio de 99,85 % ne changent pas : ces lignes détaillent, sans double compter.

## 2. Synthèse graphique « Top 10 marcheurs »
- Nouvelle section « 2. Contribution des 10 premiers marcheurs », en barres horizontales triées : nom, barre, pourcentage du total des données des marcheurs, avec le nombre entre parenthèses.
- Une barre « Autres marcheurs » complète à 100 %.
- G. Boréal et le compte association mis en couleur distincte ; grands libellés lisibles, sans légende à décoder.
- Base de calcul : observations + médias + textes + audios marcheurs par personne (les mesures IoT sont exclues, sinon le graphique serait écrasé à 100 %). La base est écrite sous le graphique.
- Noms affichés « Prénom N. » (page réservée à l'administrateur).

## 3. Export PDF
Les nouvelles lignes et le graphique figurent dans l'export, les barres restent en couleur à l'impression et le graphique ne se coupe pas entre deux pages.

## Détails techniques
- Migration : `get_data_asset_stats()` enrichie (profil association `8d334e8f…`, user `d4930883…`) avec `dont_*_association` et un tableau `top_marcheurs [{nom, total, pct}]` agrégé par user_id ; toujours SECURITY DEFINER, admin uniquement.
- Snapshots : comptage dans `species_data` jsonb selon le champ observateur ; vérifier d'abord le nom du champ sur les données réelles.
- `AdminNoteDonnees.tsx` : LABELS/ORDER, composant de barres CSS, `print-color-adjust: exact`, `break-inside: avoid`.
