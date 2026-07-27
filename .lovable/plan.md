## Ce que révèle l'analyse (vérifié en base)

Les 3 points en bas à gauche **ne sont pas des bugs d'affichage** : ce sont de vraies observations rattachées à la propriété.

Requête sur les observations des marches liées à Jardin Monde DEVIAT, distance au centre du nuage :


| Espèce                                | Distance  | Source      | Origine GPS |
| ------------------------------------- | --------- | ----------- | ----------- |
| Cardamine pratensis                   | 394 m     | iNaturalist | brut iNat   |
| Aesculus hippocastanum (×2 marcheurs) | 287 m     | iNaturalist | brut iNat   |
| Prunus persica / Arion                | 222–260 m | iNaturalist | brut iNat   |


Trois causes cumulées :

1. **Le rattachement se fait sur un rayon, pas sur le jardin.** `backfill-marcheur-inaturalist` et `sync-biodiversity-snapshot` retiennent toute observation iNat dans un **rayon de 500 m** autour du point de la marche. Une observation faite dans la rue, chez le voisin ou en arrivant est donc « dans la propriété ». Les parcelles cadastrales de la propriété existent pourtant déjà (`usePropertyParcelles`) mais ne sont **jamais** utilisées comme filtre.
2. **Les coordonnées viennent d'iNaturalist telles quelles** : dérive GPS du téléphone, épinglage manuel a posteriori, ou floutage (geoprivacy `obscured`, précision jusqu'à plusieurs km). La précision positionnelle iNat (`positional_accuracy`) n'est **pas stockée** chez nous, donc impossible aujourd'hui de distinguer un point fiable d'un point flouté.
3. **Le repositionnement existant est fragile.** Les RPC `reposition_marcheur_observation_gps` / `..._media_gps` existent (audit `marcheur_media_gps_audit`, rôle `is_gps_curator`), mais le backfill iNat fait un `upsert(..., ignoreDuplicates: false)` sur `(marcheur_id, inaturalist_observation_id)` qui **réécrit latitude/longitude** : toute correction manuelle est effacée à la prochaine synchro. En base, 1 seule observation sur 1004 porte un `gps_source` non nul — l'outil n'est de fait pas utilisé.

De plus, la moitié des points de la carte « Carte des révélations » proviennent des **attributions de snapshots** (`exactLatitude/exactLongitude` dans le JSON), que les RPC de repositionnement ne savent pas modifier du tout.

## Contraintes iNaturalist / Pl@ntNet à respecter

- On ne modifie **jamais** l'observation chez iNaturalist : nos corrections sont des **surcouches éditoriales locales**, la donnée d'origine reste conservée et affichable.
- Les points `obscured` ne doivent pas être « dé-floutés » : on les marque comme imprécis et on les **exclut du diagnostic** plutôt que de les déplacer arbitrairement.
- Pl@ntNet ne fournit pas de GPS : les photos importées via ce canal tirent leur position de l'EXIF ou du parcours — même traitement, même override.

## Le plan

### 1. Socle base de données — override durable

- Table `observation_gps_overrides` (clé : `inaturalist_observation_id` **ou** `target_type/target_id`), colonnes : `lat`, `lon`, `status` (`repositioned` | `excluded` | `validated`), `original_lat/lon`, `reason`, `curated_by`, `curated_at`. GRANTs + RLS (lecture publique des points validés, écriture réservée à `is_gps_curator`).
- Stocker à la synchro les métadonnées de fiabilité iNat : `positional_accuracy`, `geoprivacy`, `obscured` sur `marcheur_observations` et dans les attributions de snapshot.
- Rendre les synchros **non destructrices** : le backfill n'écrase plus lat/lon quand un override existe (`gps_source = 'manual'` protégé).
- Appliquer l'override **au moment de la lecture** dans `get_exploration_species_pool` (et donc aussi côté snapshots), pour que la correction soit visible partout : carte des révélations, Carnet, exports, Pack Vivant.

### 2. Géofence propriété

- Nouveau champ propriété : périmètre = union des parcelles cadastrales sélectionnées, avec **tampon réglable** (0 / 25 / 50 m).
- Chaque waypoint reçoit un statut calculé : `dans le périmètre` · `en limite` · `hors périmètre`.
- Par défaut, le diagnostic (compteurs, cortège, palette) ne retient que « dans le périmètre + limite » ; un interrupteur permet d'afficher les hors-périmètre en grisé.

### 3. Console Admin « Contrôle GPS des observations »

Accessible aux curateurs (admin / ambassadeur / sentinelle), depuis un bouton discret sur la Carte des révélations et depuis l'espace Admin / Outils / Contrôle GPS des observations.

- **Carte plein écran** avec parcelles de la propriété en surbrillance, tampon visible, et tous les points.
- **File d'attente à droite** triée par suspicion : hors parcelle, précision iNat > 50 m, coordonnées floutées, doublons exacts. Chaque ligne : photo, nom français, marcheur, date, distance à la parcelle, badge d'origine.
- **Trois gestes** par point : glisser-déposer pour repositionner (avec aimantation à 25 m et à la parcelle), « Exclure du diagnostic » (conserve la donnée, la retire des comptes), « Valider tel quel » (sort de la file définitivement).
- **Traitement par lot** : sélection multiple → exclure / valider / déplacer d'un même vecteur.
- **Traçabilité** : position d'origine toujours affichée en fantôme, journal des corrections (`marcheur_media_gps_audit` étendu), possibilité d'annuler.
- **Garde-fou** : refus d'un déplacement > 200 m sans motif saisi.

### 4. Restitution côté propriétaire

- Sous le compteur de la Carte des révélations : « 230 espèces · 227 dans le périmètre · 3 écartées », cliquable pour voir lesquelles et pourquoi.
- Mention de la méthode dans les impressions : rayon de collecte, géofence, nombre de points curatés — gage de sérieux vis-à-vis des pros.

## Détails techniques

Fichiers principaux : migration SQL (nouvelle table + mise à jour de `get_exploration_species_pool`), `supabase/functions/backfill-marcheur-inaturalist/index.ts` et `backfill-snapshot-marcheur-attributions/index.ts` (préservation des overrides + capture de `positional_accuracy`), `src/hooks/propriete/usePropertySpeciesPool.ts` (statut géofence par waypoint), `src/components/propriete/identify/blocks/RevealMapBlock.tsx` (filtre périmètre + entrée console), nouveau dossier `src/components/admin/gps/` (console, file d'attente, mutations), réutilisation de `useRepositionMediaGps` / `useIsGpsCurator` / `usePropertyParcelles` / `RichMap`.

## Question avant de coder

ils restent comptés tant qu'un curateur ne les a pas traités