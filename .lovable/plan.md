## Diagnostic (vérifié en base)

Sur Jardin Monde Deviat, la RPC `get_exploration_species_pool` renvoie bien **230 espèces distinctes**. J'ai mesuré la répartition des coordonnées :

| Mesure | Valeur |
| --- | --- |
| Espèces totales du pool | 230 |
| Espèces avec au moins une obs. **marcheur** géolocalisée | **209** |
| Espèces avec au moins une attribution **iNaturalist** géolocalisée | 207 |
| Espèces géolocalisables toutes sources confondues | **230** |

Cause : dans `usePropertySpeciesPool`, le tableau `waypoints` est construit **uniquement** à partir de `marcheur_attrs` (obs. marcheurs avec `latitude`/`longitude`). Les attributions iNaturalist des snapshots (`attributions[][].exactLatitude` / `exactLongitude`), pourtant renvoyées par la RPC, sont ignorées. La carte affiche donc 209 espèces, alors que le bandeau « Empreinte biodiversité » compte les 230 espèces du pool sans condition de géolocalisation.

Aucune espèce n'est réellement « sans position » : les 21 manquantes ont des coordonnées iNat exploitables. Le correctif est purement front, aucune modification SQL nécessaire.

## Correction proposée

**1. `src/hooks/propriete/usePropertySpeciesPool.ts` — enrichir `waypoints`**
- Après la boucle sur `marcheur_attrs`, parcourir `sp.attributions` (structure imbriquée : tableau de tableaux, à aplatir) et créer un waypoint pour chaque entrée ayant `exactLatitude` + `exactLongitude` valides.
- Champs mappés : `photoUrl` depuis la photo de l'attribution si présente, `observationDate` depuis `observedOn`/`observationDate`, `marcheurId: null`, plus un champ `source: 'marcheur' | 'inaturalist'`.
- Dédoublonnage : clé `nom scientifique normalisé + lat/lng arrondis à 5 décimales`, priorité à la source marcheur, pour ne pas dupliquer les obs. iNat déjà rattachées à un marcheur.

**2. `src/components/propriete/identify/blocks/RevealMapBlock.tsx` — affichage**
- Le compteur et les pastilles utilisant déjà `speciesBucket`, ils passeront automatiquement à 230 une fois les waypoints complétés.
- Différencier visuellement les marqueurs iNat (même couleur de règne, contour pointillé ou opacité réduite) et l'indiquer dans la légende.
- Ajouter un filtre simple « Photos marcheurs / iNaturalist / Tout », cohérent avec le mode photo déjà utilisé ailleurs dans l'app.
- Popup : mentionner la source de l'observation.

**3. Garde-fou de cohérence**
- Afficher, sous le compteur, un rappel discret `X / Y espèces localisées` en comparant à `usePropertySpeciesCount(proprieteId)` — le même hook que le bandeau du haut. Si un écart réapparaît un jour (obs. sans coordonnées), il sera visible au lieu d'être silencieux.

## Vérification

- Sur `/propriete/jardin-monde-deviat` : la carte doit afficher **230 espèces**, identique au bandeau « Empreinte biodiversité mesurée ici », et `230 / 230 localisées`.
- Vérifier que les filtres par règne et « bio-indicatrices » restent cohérents, et qu'aucun marqueur n'apparaît en doublon exact.
