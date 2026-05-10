## Diagnostic — Cas Laurence Karki

- Participation créée aujourd'hui sur l'événement `DEVIAT / Jardin Monde` (exploration `20dd3be8…`), méthode `admin_retroactif`.
- Aucune ligne `exploration_marcheurs` créée pour cette exploration → sa fiche n'apparaît pas.
- Ses 3 observations existantes restent rattachées à l'autre exploration (`70fcd8d1 — DEVIAT Marcher sur un sol qui respire`).
- Son compte iNaturalist (`laurencekarki`) est bien lié dans `community_profile_science_accounts` → la matière première est exploitable.

**Cause racine** : la création d'une `marche_participations` n'a aucun effet de bord. Pas de trigger, pas d'insertion dans `exploration_marcheurs`, pas de scan iNaturalist pour rattacher les observations dans le rayon GPS des marches de l'événement.

## Objectif

Quand on ajoute (manuellement ou par QR) un marcheur à un événement **après** qu'il a déjà observé sur iNaturalist dans la zone des marches, sa fiche Marcheur doit se construire toute seule, de manière idempotente et auditée.

## Architecture proposée

```text
INSERT marche_participations (user_id, marche_event_id)
        │
        ▼
TRIGGER AFTER INSERT  ─── ensure_exploration_marcheur()
        │                      └─ upsert exploration_marcheurs (FROM community_profiles)
        │
        ▼
pg_net.http_post  ──►  Edge Function: backfill-marcheur-inaturalist
                                │
                                ├─ lit science_accounts (network='inaturalist')
                                ├─ pour chaque marche de l'exploration :
                                │     fetch iNat /observations?user_id=…&lat=…&lng=…&radius=…
                                ├─ filtre Haversine + dédup par scientificName
                                ├─ INSERT marcheur_observations (ON CONFLICT DO NOTHING)
                                └─ logge un rapport (backfill_log)
```

## Étapes d'implémentation

### 1. Migration DB

- **Trigger `trg_participation_backfill_marcheur`** sur `marche_participations` AFTER INSERT.
- **Fonction `ensure_exploration_marcheur(p_user_id, p_marche_event_id)`** (SECURITY DEFINER) :
  - résout l'`exploration_id` via `marche_events`,
  - upsert dans `exploration_marcheurs` (prenom/nom/avatar depuis `community_profiles`, role=`marcheur`, ordre=9999, couleur défaut),
  - retourne le `crew_id`.
- **Fonction `request_inaturalist_backfill(p_user_id, p_exploration_id)`** : déclenche `net.http_post` vers l'Edge Function (asynchrone, non bloquant).
- **Table `marcheur_backfill_log`** (run_id, user_id, exploration_id, source, observations_inserted, error, created_at) pour traçabilité.
- Réutilise l'unique index `marcheur_observations_unique_triplet` → idempotence garantie.

### 2. Edge Function `backfill-marcheur-inaturalist`

- Entrée : `{ user_id, exploration_id, marche_event_id?, source: 'trigger'|'manual' }`.
- Vérifie JWT (service role pour l'écriture).
- Lit `community_profile_science_accounts` (network=`inaturalist`) → username.
- Charge toutes les `marches` de l'exploration via `exploration_marches` (lat/lng + rayon de collecte = 500 m, cohérent avec `sync-biodiversity-snapshot`).
- Pour chaque marche, appelle `https://api.inaturalist.org/v1/observations?user_login=…&lat=…&lng=…&radius=0.5&per_page=200` (paginé).
- Filtre Haversine côté serveur (sécurité), normalise les `scientificName`.
- INSERT dans `marcheur_observations (marcheur_id, marche_id, species_scientific_name, observation_date, notes='iNaturalist backfill', photo_url)` avec `ON CONFLICT DO NOTHING`.
- Insère un résumé dans `marcheur_backfill_log`.
- Optionnel : déclenche `sync-biodiversity-snapshot` pour chaque marche touchée.

### 3. UX Admin — bouton de re-synchronisation manuelle

- Dans `MarcheurObservationsManager` (fiche marcheur côté admin/L'Œil) : bouton **« Re-synchroniser depuis iNaturalist »**.
- Affiche le dernier `marcheur_backfill_log` (date, nb d'obs ajoutées, statut).
- Désactivé si pas de compte iNaturalist lié → CTA « Lier un compte iNaturalist ».

### 4. Couverture des cas connexes

- **Modification d'un événement** (changement de `exploration_id` ou ajout d'une marche dans l'exploration) : trigger AFTER UPDATE/INSERT sur `exploration_marches` → re-déclenche le backfill pour tous les marcheurs déjà présents dans l'exploration.
- **Lien tardif d'un compte iNaturalist** : trigger AFTER INSERT sur `community_profile_science_accounts` (network=`inaturalist`) → backfill pour toutes les explorations où l'utilisateur a une participation validée.

## Garde-fous

- **Idempotence** : unique triplet `(marcheur_id, marche_id, scientificName)`.
- **Asynchrone** : `pg_net` ne bloque jamais l'INSERT de la participation (toast UI immédiat ; obs apparaissent quelques secondes après).
- **Audit** : `marcheur_backfill_log` permet de diagnostiquer un cas comme Laurence en 1 clic.
- **Scope** : limité aux marches de l'exploration de l'événement, rayon 500 m (constante partagée avec `sync-biodiversity-snapshot`).
- **Sécurité** : Edge Function en service role, jamais exposée au client sans JWT vérifié.
- **Dégradé gracieux** : si pas d'iNat lié → log « no_account », pas d'erreur ; bouton manuel disponible.

## Hors-scope

- Pas de modification du flux de curation `attribute_species_to_marcheurs` (L'Œil reste prioritaire et compatible).
- Pas de récupération automatique des observations hors iNaturalist (eBird / GBIF / PlantNet) dans cette première itération — la même mécanique pourra être étendue ensuite.
- Pas de changement UI de la fiche marcheur publique (les obs apparaîtront naturellement via les hooks existants `useExplorationMarcheurs` / `useExplorationParticipants`).

## Validation post-déploiement

1. Re-créer la participation de Laurence (ou cliquer le nouveau bouton « Re-synchroniser ») → vérifier qu'une ligne `exploration_marcheurs` apparaît dans exploration `20dd3be8…` et que ses obs iNat dans le rayon des 4 marches DEVIAT sont insérées.
2. Vérifier `marcheur_backfill_log` (1 ligne, observations_inserted > 0).
3. Vérifier que la fiche Marcheur s'affiche dans la vue Vivant de l'exploration.
