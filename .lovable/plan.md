## Ce qui existe aujourd'hui (vérifié dans le code et la migration)

Le repositionnement se fait depuis **J'identifie → Carte des révélations → bouton « Contrôle GPS »** (visible seulement pour admin / ambassadeur / sentinelle). Console plein écran : file de points suspects à droite, carte à gauche, 3 gestes — repositionner (glisser), exclure, valider.

Mais la propagation est **incomplète**, et c'est la source de la confusion :

| Type de point | Ce qui se passe quand on le repositionne | Visible ailleurs ? |
| --- | --- | --- |
| Observation marcheur (`marcheur_observations`) | La RPC `set_observation_gps_override` écrit l'override **et** met à jour lat/lon de la ligne source avec `gps_source='manual'` | Oui : marches, explorations, événements, exports |
| Attribution iNaturalist d'un snapshot (`snapshot_attr`) | Seul l'override est écrit ; le JSON `biodiversity_snapshots` n'est pas touché | **Non** : corrigé uniquement sur la page Propriété |
| Statut « exclu » / « validé » (les deux types) | Écrit dans la table d'override | **Non** : appliqué uniquement par le hook `usePropertySpeciesPool` |

Autrement dit : la RPC `get_exploration_species_pool` renvoie bien l'`id` d'observation nécessaire pour cibler un override, mais **n'applique aucun override**. Toute la logique de correction est côté client, dans la page Propriété.

## Le plan

### 1. Appliquer les corrections à la source unique (base)

Modifier `get_exploration_species_pool` pour joindre `observation_gps_overrides` et, pour chaque point :

- `repositioned` → renvoyer `lat/lon` corrigés (et conserver `original_lat/lon` + `gps_corrected: true` dans la charge utile)
- `excluded` → marquer le point `excluded: true` et **le retirer du filtrage par rayon et des comptes** (la donnée reste consultable)
- `validated` → inchangé, mais marqué comme contrôlé

Clé de jointure : `observation:<uuid>` pour les observations marcheurs, `snapshot_attr:<marche_id>|<scientificName>|<observationId ou lat,lon>` pour les attributions iNat — la même clé que celle déjà construite côté client, pour que les corrections déjà saisies restent valides.

Même traitement pour les autres lectures qui servent les marches/événements : `get_exploration_species_export`, `get_exploration_species_count` et le contexte chatbot, afin que les compteurs restent cohérents partout.

### 2. Rendre les resyncs non destructifs pour les snapshots

`sync-biodiversity-snapshot` et `backfill-snapshot-marcheur-attributions` réécrivent le JSON. Ils devront, avant écriture, ré-appliquer les overrides existants sur les attributions concernées — comme `backfill-marcheur-inaturalist` respecte déjà `gps_source='manual'`.

### 3. Ouvrir la console au-delà de la Propriété

- Nouvelle entrée **Admin → Outils → Contrôle GPS des observations**, avec sélecteur de périmètre : propriété, exploration, marche ou événement.
- Depuis une marche/exploration, la file d'attente se construit sur le rayon de la marche (points > rayon, précision iNat > 50 m, coordonnées floutées) plutôt que sur les parcelles cadastrales.
- Mêmes gestes, même journal (`marcheur_media_gps_audit`), même bouton « Annuler la correction ».

### 4. Rendre le protocole lisible dans l'interface

- Encart d'aide en tête de console : « 1 · repérer · 2 · corriger ou exclure · 3 · la correction s'applique partout ».
- Sur chaque point corrigé, badge « position corrigée » + position d'origine en fantôme sur la carte, dans la Propriété comme dans les vues marche/exploration.
- Sous les compteurs : « 230 espèces · 227 retenues · 3 écartées », cliquable.

## Détails techniques

Migration SQL (jointure overrides dans `get_exploration_species_pool`, `get_exploration_species_export`, `get_exploration_species_count`) ; `supabase/functions/sync-biodiversity-snapshot/index.ts` et `backfill-snapshot-marcheur-attributions/index.ts` (préservation) ; `src/hooks/propriete/usePropertySpeciesPool.ts` (retirer la ré-application client devenue redondante, garder l'annotation géofence) ; `src/components/propriete/gps/GpsControlConsole.tsx` (généralisation périmètre propriété/marche/exploration) ; nouvelle page admin dans `src/pages/AdminOutilsHub.tsx`.
