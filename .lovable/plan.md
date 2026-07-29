## Ce qui se passe (vérifié en base)

Le « Pêcher » n'est pas dupliqué en base : c'est **une seule observation réelle**, mais elle arrive dans la carte par **deux canaux** :

1. `marcheur_observations` id `11d0b1a3…` — *Prunus persica*, source `walker_upload`, `inaturalist_observation_id = 386330553`
2. l'attribution du snapshot iNaturalist `e619085e…` — même espèce, `originalUrl = .../observations/386330553`, coordonnées `45.4140026 / 0.0090043`

Jusqu'ici les deux points se superposaient exactement, donc la déduplication de `buildWaypoints` (clé = `nom scientifique | lat.toFixed(5) | lng.toFixed(5)`) les fusionnait en un seul marqueur.

Le repositionnement a cassé cette clé :
- la RPC a écrit la nouvelle position **sur la ligne `marcheur_observations`** (`45.4139753 / 0.0088647`) et créé un override `target_kind = observation`, `target_key = 11d0b1a3…` ;
- l'attribution du snapshot, elle, est ciblée par une **autre clé** (`snapshot_attr` + URL iNat) : aucun override ne la concerne, elle reste à l'ancienne position.

Résultat : deux clés de dédup différentes → deux marqueurs « Pêcher », l'ancien à droite, le corrigé à gauche.

En prime, la base contient de vrais doublons hérités : plusieurs `marcheur_observations` partagent le même `inaturalist_observation_id` (ex. `344136514`, `346193300`) rattachés à deux marches différentes — invisibles aujourd'hui car superposés, mais ils produiront le même symptôme au prochain repositionnement.

## Correction proposée

### 1. Dédupliquer par identité, plus par coordonnées (cause racine)

Dans `src/hooks/propriete/usePropertySpeciesPool.ts` (`buildWaypoints`) :
- calculer une **clé d'identité** prioritaire : `inat:<id>` — issue de `marcheur_attrs.inaturalist_id` côté marcheur, et de l'id extrait de `originalUrl` côté attribution snapshot ;
- conserver la clé espèce+coordonnées **d'origine** (jamais la position corrigée) uniquement en secours, quand aucun id iNat n'existe ;
- garder la priorité actuelle marcheur > snapshot : une attribution dont l'id iNat est déjà porté par une observation marcheur est ignorée.

La dédup devient ainsi insensible à tout repositionnement futur.

### 2. Propager la correction GPS aux deux représentations

Un même point ne doit plus avoir deux « adresses » de curation :
- indexer les overrides également par id iNat (dans `useGpsOverrides`), en plus de `kind|target_key` ;
- à la lecture, si aucun override direct n'est trouvé pour un waypoint, chercher par id iNat — un déplacement sur l'observation marcheur s'applique alors à son jumeau snapshot, et inversement.

Même logique appliquée au filtrage cadastral et au comptage (`timeRows` / `allRows`), pour que carte, listes, compteurs et impressions restent strictement alignés.

### 3. Nettoyage des doublons hérités en base

Migration de dédoublonnage sur `marcheur_observations` : pour un même `inaturalist_observation_id`, conserver une seule ligne (la plus ancienne, ou celle rattachée à la marche de la propriété), supprimer les autres, puis ajouter un index unique partiel sur `inaturalist_observation_id` (hors NULL) pour empêcher la réapparition. À valider avec vous avant exécution car cela touche des données existantes.

### 4. Vérification

- Recharger `/propriete/jardin-monde-deviat` filtre « Aujourd'hui » : un seul marqueur Pêcher, à la position corrigée à gauche.
- Contrôler que le compteur « 3 obs. » reste cohérent entre bandeau, carte et registre.
- Contrôler qu'un nouveau repositionnement ne recrée pas de jumeau.

## Détails techniques

Fichiers concernés : `src/hooks/propriete/usePropertySpeciesPool.ts` (dédup + géofiltrage), le hook `useGpsOverrides` (index secondaire par id iNat), éventuellement `src/hooks/useRepositionMediaGps.ts` (invalidation du pool propriété après mutation). Étape 3 = migration SQL séparée, soumise à votre approbation.
