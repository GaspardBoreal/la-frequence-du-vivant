# Palette végétale — nouvelle section 2 « Palette végétale recommandée »

## Ce qui change

La section 2 actuelle, « Emplacements & ouvrages » (carte de tracé + registre des ouvrages), disparaît de l'étape Palette végétale. Elle fait doublon avec la nouvelle entrée de navigation « Atelier du jardin », qui reste le seul endroit où l'on trace des zones et dessine des ouvrages.

À sa place : une section 2 « Palette végétale recommandée », organisée en quatre strates — Herbacées, Arbustes, Lianes, Arbres — et lisible sous trois projections.

## Les trois projections

Un sélecteur en tête de section, trois onglets, transition douce entre les vues. Les strates restent les mêmes ; c'est le tri, le filtrage et la mise en scène qui changent.

**En harmonie avec le sol** — la projection par défaut. Le verdict des quatre curseurs (eau, texture, nutrition, pH) filtre les candidates : ne remontent que les espèces dont l'écologie recoupe la lecture du site. Chaque espèce porte une jauge fine de concordance. Quatre bandes-strates empilées en coupe verticale, du sol vers la canopée. Ambiance sobre, papier, scientifique.

**Le garde-manger** — priorité aux comestibles, mellifères et fixatrices d'azote. Le verger-forêt en strate arbres, les grimpantes fruitières en lianes, les vivaces pérennes en herbacées. Pièce maîtresse : un calendrier de récolte circulaire sur douze mois où chaque espèce retenue allume ses mois de production — les creux de l'année sautent aux yeux. Survol d'un mois : les espèces concernées se détachent.

**Le climat de demain** — un curseur d'horizon (aujourd'hui → 2050) filtre sécheresse, canicule et gel tardif. Les espèces fragiles se grisent progressivement, des analogues méridionaux compatibles avec le sol remontent. Chaque espèce est posée sur un axe fraîcheur → aridité, traversé par une bande « zone de confort » qui glisse avec le curseur.

## Direction artistique

Uniquement les tokens sémantiques du design system, rendu vérifié en Papier Crème et en Forêt Émeraude, mobile 375 px et desktop. Micro-animations Motion sur le changement de projection, les jauges et le curseur climat. Tout nom d'espèce passe par `<SpeciesName />`. Skeletons au chargement, état vide explicite (« pas encore assez d'Observations pour composer la palette »), affichage des erreurs.

## Détails techniques

- `src/components/propriete/tabs/TabPalette.tsx` : suppression de `emplacementsWidget` (`ZonesMapBlock` + `OuvragesRegister`) et de ses dépendances devenues inutiles (zones actives, focus ouvrage, handlers de création/suppression de zone) uniquement si elles ne servent plus ailleurs dans le fichier ; insertion du nouveau bloc en position 2. Les fichiers `ZonesMapBlock.tsx` / `OuvragesRegister.tsx` restent en place, ils servent à l'Atelier.
- Nouveaux composants sous `src/components/propriete/palette/recommandee/` : `PaletteRecommandee.tsx` (conteneur + sélecteur de projection), `StrateColumn.tsx`, `ProjectionSol.tsx`, `ProjectionGardeManger.tsx` (calendrier circulaire SVG), `ProjectionClimat.tsx` (axe + curseur).
- Logique de tri dans `src/lib/paletteProjections.ts`, alimentée par `paletteEngine.ts` (`STRATE_ORDER`, candidates existantes) et par `soilLiteFromState` pour la concordance sol. Aucun changement de schéma : les critères comestible / mellifère / fixateur d'azote proviennent des tags de fonctions écologiques existants, les critères climat sont dérivés des indices D.S. déjà présents.
- Les liens d'ancrage `#palette-block-zones` et l'édition par bloc sont recâblés vers le nouveau bloc pour ne casser ni les impressions ni la navigation par sommaire.
- Aucune URL publique modifiée.

## Point ouvert

Si un critère climat ou comestible manque pour une espèce, elle est affichée en retrait avec la mention « donnée manquante » plutôt que masquée, pour éviter de faire disparaître silencieusement des espèces observées.
