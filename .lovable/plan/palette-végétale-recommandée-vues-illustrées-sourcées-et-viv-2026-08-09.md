# Palette végétale recommandée — vues illustrées, sourcées et vivantes

## Ce qui ne va pas aujourd'hui

Les trois projections (« En harmonie avec le sol », « Le garde-manger », « Le climat de demain ») affichent des lignes de texte grises : pas d'image, pas de fiche espèce, aucune mention des sources scientifiques qui fondent les recommandations. La matière est riche, la présentation ne la sert pas.

## 1. De la ligne à la vignette

Chaque espèce devient une carte illustrée : photo de l'espèce en haut, nom vernaculaire français puis nom scientifique en italique, jauge de pertinence propre à la projection, et une phrase de raison écologique.

Les photos viennent du cache serveur de vignettes déjà en place dans l'application (iNaturalist puis GBIF, avec pictogramme fin par grand groupe en dernier recours). Aucun appel direct à iNaturalist depuis le navigateur : le hook batch existant fait une seule requête pour toute la palette, et déclenche en arrière-plan la résolution des espèces manquantes. Une pastille discrète indique la source de l'image (iNat / GBIF / Manuel) avec l'attribution au survol.

Grille responsive : une colonne en 375 px, deux en tablette, quatre strates côte à côte en desktop large. Skeletons pendant le chargement, dégradé de teinte propre à la strate (sol → canopée) pour donner de la couleur sans jamais sortir des tokens sémantiques.

## 2. Le mode fiche

Un clic sur une vignette ouvre un panneau latéral « Fiche espèce » :

- Photo en grand format et attribution complète.
- Identité : nom vernaculaire, nom scientifique, strate, statut indigène / horticole, filière Végétal local quand elle existe.
- Écologie sur les quatre axes (eau, texture, nutrition, pH) en échelles à 5 crans, cohérentes avec le reste de l'application, superposées au profil mesuré du site : on voit d'un coup où l'espèce colle et où elle force.
- Services rendus (comestible, mellifère, fixateur d'azote, haie, ombre…) en étiquettes.
- Lecture propre à la projection en cours : mois de récolte pour le garde-manger, tenue à l'horizon choisi pour le climat.
- Précaution éditoriale affichée en évidence quand l'espèce en porte une.
- Liens sortants : fiche iNaturalist, fiche Tela Botanica, fiche GBIF, ouverts en nouvel onglet.

## 3. Transparence des sources

Un bloc « D'où vient cette palette », replié par défaut, en pied de section, listant chaque source avec son rôle et son lien :

- CNPF — Flore forestière française, t.1 Plaines et collines (2018) : optima écologiques des ligneux.
- Baseflor / Catminat, Philippe Julve : indices écologiques des herbacées.
- Tela Botanica : nomenclature et fiches espèces.
- Végétal local (OFB) : disponibilité en filière locale.
- iNaturalist et GBIF : photographies et occurrences.
- Méthode Hérody / lecture bio-indicatrice du sol : profil du site issu de « J'analyse » et « J'identifie ».

Et une ligne de méthode assumée : la recommandation croise le sol mesuré du site avec les optima publiés ; elle propose, elle ne prescrit pas.

## Direction artistique

Tokens sémantiques uniquement, rendu vérifié en Papier Crème et en Forêt Émeraude. Micro-animations Motion à l'apparition des vignettes, à l'ouverture de la fiche et au changement de projection. Tout nom d'espèce passe par `<SpeciesName />`. États chargement / vide / erreur traités. Aucune URL publique modifiée.

## Détails techniques

- `SpeciesLine.tsx` devient `SpeciesCard.tsx` (carte illustrée cliquable) ; `StrateColumn.tsx` passe en grille de cartes avec en-tête de strate coloré par profondeur.
- Photos via `useSpeciesThumbs(names[])` (RPC batch `get_species_thumbs` + edge `resolve-species-thumb`) et le composant `<SpeciesThumb />` existant ; appel unique au niveau de `PaletteRecommandee.tsx` pour toute la palette, passé en contexte aux cartes.
- Nouveau `SpeciesFicheDrawer.tsx` (Sheet shadcn), alimenté par `PaletteSpecies` + `ScoredSpecies` + le `SiteProfile`, réutilisant `soilFloraScales` pour les 5 crans. Liens construits depuis le nom scientifique (iNaturalist `/taxa/search`, Tela Botanica `/bdtfx-nn`, GBIF `/species/search`).
- Nouveau `PaletteSources.tsx` (bloc repliable), données dans `src/lib/paletteSources.ts` (liste typée nom / rôle / URL), réutilisable par les impressions plus tard.
- `ProjectionSol/GardeManger/Climat.tsx` adaptés au nouveau rendu carte + ouverture de fiche ; la logique de `paletteProjections.ts` reste inchangée.
- Aucun changement de schéma, aucune nouvelle table.
