## Diagnostic

L'aperçu affiche **0 espèces / 0 regards** parce que la RPC `get_event_scenography_data` (créée dans la migration initiale de la scénographie) interroge des colonnes qui **n'existent pas** dans le schéma réel :

| Champ RPC | Réalité du schéma |
|---|---|
| `biodiversity_snapshots.event_id` | n'existe pas — la table est liée par `marche_id`, et les espèces sont **dans le JSONB `species_data`** (un snapshot agrège déjà toutes les espèces d'une marche) |
| `marcheur_medias.event_id` / `media_url` / `media_type` / `caption` / `latitude` / `longitude` / `taken_at` | les vrais noms sont `marche_event_id`, `url_fichier`, `type_media`, `description`, et les coords/date sont dans `metadata` JSONB |
| `event_testimonies.content` / `user_id→profiles.display_name` | la colonne s'appelle `quote`, l'auteur est déjà stocké en clair dans `author_name` |

Côté event lui-même : `date_marche`, `lieu`, `latitude`, `longitude` n'existent pas non plus directement sur `marche_events` (vérifié : `marche_events` n'a ni `lieu` ni coords — elles viennent de la marche parente via `exploration_id`).

Résultat : la RPC retourne `{}`, le runtime reçoit `data = {}`, et le template DEVIAT affiche `data.species?.length ?? 0` → 0, idem photos → 0 regards.

## Plan

### 1. Réécrire la RPC `get_event_scenography_data` (migration)

Aligner sur le schéma réel et la même logique de fusion que le reste de l'app (memo `unified-species-count-rpc`) :

- **Event** : ne renvoyer que les colonnes existantes (`id`, `title`, `public_slug`, `event_type`, `cover_image_url`, `description`, `scenography_title`). Pour `lieu` / `date` / `latitude` / `longitude`, joindre la première marche de l'exploration parente.
- **Espèces** : pour toutes les marches liées (`marches.exploration_id = event.exploration_id`), prendre le **dernier snapshot non quarantaine** de chaque marche, dé-imbriquer `species_data` (jsonb_array_elements) puis dédoublonner par `scientific_name` avec somme de `observations_count`. Fusionner avec `marcheur_observations` (espèces ajoutées manuellement par les marcheurs) sur les mêmes marches.
- **Photos** : `marcheur_medias` où `marche_event_id = event.id` ET `type_media = 'photo'`, avec mapping `url ← url_fichier`, `caption ← description`, `latitude ← (metadata->>'latitude')::float`, idem longitude, `taken_at ← (metadata->>'taken_at')::timestamptz`, et `author ← profiles.display_name` via `attributed_marcheur_id` ou `user_id`.
- **Waypoints** : inchangé (`exploration_waypoints` par `exploration_id`) — c'est la seule partie qui était correcte.
- **Testimonies** : `event_testimonies` avec mapping `text ← quote`, `author ← author_name`, filtré sur `is_published = true` (sauf admin).
- Conserver le gating `is_public AND (scenography_enabled OR is_admin_user())`.

### 2. Améliorer le runtime preview (frontend)

Dans `ScenographyRuntime.tsx`, quand on est en mode aperçu (`onExit` défini ⇒ contexte admin) et que `data.species` et `data.photos` sont vides, afficher un **bandeau d'info non bloquant** en bas :
> "Aucune observation ni photo collectée pour cet évènement — la scénographie s'animera dès qu'il y aura des données."

C'est de l'info pour l'éditeur (pas un blocage), la scénographie reste rendue normalement (le template DEVIAT a déjà des fallbacks visuels).

### 3. Vérification

- Appeler la RPC corrigée pour l'event DEVIAT (`f6095e8d…`) et vérifier qu'on récupère bien `species[]`, `photos[]`, `waypoints[]`, `testimonies[]`.
- Recharger l'onglet **Scénographie** dans l'admin → l'aperçu doit afficher les vrais compteurs (ou le bandeau d'info si l'event n'a réellement aucune donnée).

## Détails techniques

```text
marche_events (id, exploration_id, …)
   └─ exploration_id ──► marches (id, exploration_id, latitude, longitude, lieu, date_marche)
                           └─ id ──► biodiversity_snapshots (marche_id, species_data jsonb, status)
                           └─ id ──► marcheur_observations (marche_id, scientific_name, common_name)
   └─ id ──► marcheur_medias (marche_event_id, type_media, url_fichier, metadata, attributed_marcheur_id)
   └─ id ──► event_testimonies (event_id, quote, author_name, is_published)
   └─ exploration_id ──► exploration_waypoints (exploration_id, …)
```

Pas de changement côté `useScenography.ts`, `ScenographyEditor.tsx`, template DEVIAT — leur contrat (`ScenographyData`) est conservé, seules les sources sont remises au bon endroit.
