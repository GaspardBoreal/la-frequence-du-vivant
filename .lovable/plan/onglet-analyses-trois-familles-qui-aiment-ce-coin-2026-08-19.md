# Onglet « Analyses » — « Trois familles qui aiment ce coin »

Remplacer la ligne actuelle de 3 espèces par un **triptyque de 3 × 5 espèces**, présent sur **toutes** les sondes — y compris les stations météo, qui aujourd'hui n'affichent rien.

## Le triptyque

Trois colonnes, cinq espèces chacune, lisibles côte à côte sur desktop et en carrousel sur mobile :

1. **Arbres et arbustes nourriciers** — fruitiers rustiques, haie gourmande, petits fruits.
2. **Légumes nourriciers** — le potager possible ici, selon la fraîcheur, la lumière et la saison mesurées.
3. **Ornementaux** — arbres, arbustes et vivaces de structure et de floraison.

Chaque vignette porte :
- une **photo iNaturalist** (chargée en différé, cadre carré, dégradé de repli quand aucune photo n'existe) ;
- le nom français en titre, le latin en italique ;
- une **note d'adéquation** au micro-climat mesuré et une phrase de raison (« aime les sols frais, supporte l'ombre de l'après-midi ») ;
- un **clic** qui ouvre la fiche iNaturalist de l'espèce dans un nouvel onglet ;
- un **badge « Déjà présente »** quand l'espèce est déjà observée ou déjà retenue dans la palette de la propriété — elle reste affichée, mais en second rang visuel, comme une confirmation plutôt qu'une proposition.

## Le cas des stations météo

Une station ne voit pas le sol : elle ne peut pas prononcer un verdict de plantation, mais elle décrit parfaitement le **climat du lieu**. La carte climat gagne donc son propre triptyque, construit sur ce qu'elle mesure vraiment — température de l'air, amplitude jour-nuit, jours de gel et jours ≥ 30 °C, humidité de l'air — croisé avec le registre de sol de la propriété. La carte annonce explicitement cette base : « proposé d'après le climat mesuré et le registre de sol, à confirmer par une sonde de sol ».

## Garde-fous

Aucune espèce inventée : seules celles du référentiel végétal du projet sont proposées, avec la mention des grandeurs manquantes. Quand trop peu de grandeurs sont connues pour trancher, la colonne le dit au lieu de remplir cinq cases au hasard. Les espèces déconseillées (invasives, allergènes majeurs) restent exclues.

## Détails techniques

- **Référentiel** : extension de `src/lib/plantPaletteKb.ts` avec un champ `usages: PaletteUsage[]` (`'nourricier' | 'potager' | 'ornemental'`) et l'ajout d'un bloc de ~25 légumes/aromatiques nourriciers (strate `herbacee`, optima sur la même échelle -3 → +3, plus une fenêtre thermique de semis/plantation). Les taxons existants sont étiquetés sans être modifiés.
- **Moteur** : `src/lib/paletteEngine.ts` gagne `topByUsage(profile, usage, n)` — filtrage par usage puis tri sur le score existant ; pour le potager, pondération supplémentaire par la température de sol/air mesurée (fenêtre de semis) sans nouveau modèle.
- **Profil météo** : nouveau `buildClimateProfile()` dans `src/lib/iot/analyses.ts` (ou module voisin) qui dérive `eau / lumiere` d'un `ClimateSummary` (pluie et amplitude thermique) et complète avec `soilLiteFromState` — même forme `SiteProfile`, `confidence` abaissée et `basis` explicite.
- **Hook** : `usePaletteFit` de `src/hooks/iot/useIotAnalyses.ts` retourne `groups: { nourricier, potager, ornemental }` (5 lignes chacun) en plus de `rows`, et accepte un profil climat quand `analysis.profile.isWeather`.
- **Photos** : réutilisation de `useInatThumbs` (cache 24 h, lot borné) ; lien `https://www.inaturalist.org/taxa/{taxonId}` avec repli sur la recherche par nom.
- **Présence** : nouveau `usePaletteAlreadyOnSite(proprieteId)` croisant `usePropertySpeciesPool` (observations) et `usePropertyPalette` (espèces retenues), avec normalisation via `speciesLatinBase` + NFD, comme ailleurs dans le projet.
- **UI** : nouveau `src/components/iot/analyses/SpeciesTriptych.tsx` + `SpeciesTile.tsx`, monté dans `SimpleVerdictCard.tsx` (remplace le bloc « Trois espèces ») et dans `ClimateCard.tsx`. Couleurs et rayons pris dans les tokens du design system, jamais en dur.
- Aucun changement de schéma, aucune edge function, aucune écriture en base.
