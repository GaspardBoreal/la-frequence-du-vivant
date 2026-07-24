## Diagnostic confirmé

Le module Propriété affiche bien `SpeciesExplorer`, mais il n’est pas enveloppé par `SpeciesPhotoModeProvider`. Résultat : `SpeciesGalleryCard` tombe sur le fallback no-op du contexte, dont le mode est toujours `inaturalist`, puis recharge les photos de référence via `useSpeciesPhoto`. C’est pourquoi les vignettes restent iNaturalist même si `usePropertySpeciesPool` met déjà des photos marcheurs en priorité dans `species.photos`.

Deuxième point : dans l’univers Propriété, on agrège plusieurs explorations liées à une propriété. Le provider actuel sait charger les photos terrain pour une seule exploration (`explorationId`), pas pour un pool multi-marches/propriété. Il faut donc lui fournir une `fieldPhotosOverride` construite depuis les données déjà agrégées.

## Correctif proposé

1. **Créer une map de photos terrain côté Propriété**
   - Dans `usePropertySpeciesPool`, construire une `Map<scientificNameNormalisé, MarcheurSpeciesPhoto[]>`.
   - Alimenter cette map avec toutes les entrées `marcheur_attrs` issues des RPC de toutes les explorations liées.
   - Trier chaque espèce avec priorité absolue aux photos marcheurs, puis date décroissante.

2. **Brancher le provider photo autour de SpeciesExplorer**
   - Dans `BiodiversityEvidenceBlock`, envelopper `SpeciesExplorer` avec :
     - `SpeciesPhotoModeProvider fieldPhotosOverride={fieldPhotos}`
   - Ainsi `SpeciesGalleryCard`, le toggle `Photos marcheurs / iNaturalist`, et les futures évolutions du module partagé fonctionneront aussi dans l’espace Propriété.

3. **Forcer un fallback local quand une photo marcheur existe déjà dans `species.photos`**
   - Adapter `SpeciesGalleryCard` pour utiliser `species.photos[0]` comme fallback avant de requêter la photo taxon iNaturalist.
   - Cela sécurise le rendu même si le provider n’a pas encore fini d’initialiser son mode.

4. **Préserver le comportement de l’app Marcheurs**
   - Ne pas modifier la logique centrale de `SpeciesExplorer`.
   - Ne pas casser le mode iNaturalist : l’utilisateur pourra toujours basculer vers iNaturalist, mais le défaut en contexte Propriété sera bien “Photos marcheurs” dès qu’il y en a.

## Validation attendue

Sur `/propriete/maison-sous-blossac`, Étape 3 > bloc déplié :
- le toggle “Photos marcheurs” apparaît si des photos terrain existent ;
- il est sélectionné par défaut ;
- les vignettes affichent d’abord les photos réelles des marcheurs ;
- le mode iNaturalist reste disponible en bascule.