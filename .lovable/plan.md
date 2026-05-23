## Diagnostic confirmé

Sur Panorpa germanica (DEVIAT, marche `bf50566d`) :
- 3 snapshots le 22/05 sur la marche ; **un seul** contient l'espèce
- Le hook `useSpeciesMarches` ne garde que le snapshot le plus récent → tombe sur un sans Panorpa → "Aucune marche trouvée"
- Le hook `useSpeciesMarcheurPhotos` fait pareil → carrousel terrain vide
- Aucune ligne `marcheur_observations` n'existe : l'attribution iNat `observerName: "Gaspard Boréal"` (qui est pourtant un marcheur éditorial) n'a jamais été matérialisée → pas de GPS exact, badge "citoyen" au lieu de "marcheur"

C'est **le même pattern de bug** que celui qu'on vient de corriger pour le compteur d'espèces (latest-only filter contre données snapshot delta).

## Solution (3 axes)

### Axe 1 — Fix hooks frontend (fusion all-snapshots)

**`src/hooks/useSpeciesMarches.ts`**
- Supprimer le filtre "latest snapshot per marche" (l.95-103)
- Itérer sur **tous** les snapshots, dédupliquer par `(marche_id, inaturalist_observation_id || url_photo)`
- Compter les observations distinctes par marche (pas la somme des `observations` du JSON)
- Conserver `observationDate = max(snapshot_date)` par marche
- Capturer aussi `exactLatitude/exactLongitude` des attributions → renseigner `observationPoints[]` même sans `marcheur_observations`

**`src/hooks/useSpeciesMarcheurPhotos.ts`**
- Même refactor : enlever `latestByMarche`, parcourir tous snapshots, dédup URL globale (`seenCitizenUrls`)
- Conserver tri date desc

### Axe 2 — Backfill iNat → marcheur_observations auto

**Nouvelle edge function `backfill-snapshot-marcheur-attributions`**
- Input : `{ marche_id }` (ou `snapshot_id`)
- Parcourt `snapshot.species_data[].attributions[]` filtré `source = 'inaturalist'`
- Pour chaque attribution :
  1. Cherche un alias dans `marcheur_inaturalist_aliases` (table existante via `useMarcheurAliases`) → priorité haute
  2. Sinon, matche `observerName` contre `exploration_marcheurs.prenom + ' ' + nom` via la règle **NFD + lower + trim** (memory `identity-matching-logic`)
  3. Si match : `upsert` dans `marcheur_observations` avec `ON CONFLICT (inaturalist_observation_id) DO NOTHING` :
     - `marcheur_id`, `marche_id`, `species_scientific_name`, `latitude/longitude` (depuis `exactLatitude/Longitude`), `photo_url` (depuis `sp.photos[i]`), `observation_date`, `inaturalist_observation_id`
- Idempotent (contrainte UNIQUE sur `inaturalist_observation_id` à ajouter si absente)

**Déclenchement automatique** — trigger PG sur `biodiversity_snapshots` AFTER INSERT OR UPDATE :
- `pg_notify` ou appel HTTP via `net.http_post` vers l'edge function (pattern déjà utilisé par d'autres triggers du projet)
- Invalide les query keys `species-marches` / `species-field-photos` côté client via Realtime (déjà branché dans `useExplorationSpeciesCount`)

**Migration SQL** :
```sql
-- Idempotence sur inaturalist_observation_id
ALTER TABLE marcheur_observations
  ADD CONSTRAINT marcheur_observations_inat_uniq
  UNIQUE (inaturalist_observation_id) DEFERRABLE INITIALLY DEFERRED;

-- Trigger qui appelle l'edge function
CREATE OR REPLACE FUNCTION trigger_backfill_snapshot_attributions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/backfill-snapshot-marcheur-attributions',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || current_setting('app.service_role_key', true)),
    body := jsonb_build_object('snapshot_id', NEW.id, 'marche_id', NEW.marche_id)
  );
  RETURN NEW;
END $$;

CREATE TRIGGER snapshots_backfill_marcheurs
AFTER INSERT OR UPDATE OF species_data ON biodiversity_snapshots
FOR EACH ROW EXECUTE FUNCTION trigger_backfill_snapshot_attributions();
```

**Backfill historique** — endpoint `?mode=full&exploration_id=...` qui rejoue sur tous les snapshots existants (pour rattraper Panorpa et le reste).

### Axe 3 — Drawer carte : point GPS exact iNat

**`src/components/biodiversity/species-modal/SpeciesMiniMap.tsx`**
- Quand `observationPoints[]` contient des points d'origine "iNat-attribution" (pas encore matérialisés en `marcheur_observations`), les afficher en **cercle cyan** (badge "Observation citoyenne")
- Points marcheur (issus de `marcheur_observations`) → **cercle vert** (badge "Photo marcheur")
- `FitBounds` étend ses bounds à ces nouveaux points
- Tooltip : `observerName + date + lien iNat`

**`src/hooks/useSpeciesMarches.ts`** retourne déjà `observationPoints` — il suffit d'ajouter un champ `source: 'marcheur' | 'citizen'` par point pour la coloration.

## Validation

1. Sur le drawer Panorpa germanica (avant backfill async) : la marche "Route de Brossac" apparaît, le mini-map montre 1 point cyan à `45.4136, 0.0093`, le carrousel inclut la photo iNat avec badge "Observation citoyenne · Gaspard Boréal"
2. Après que le backfill s'exécute (~5 s) : Realtime invalide les caches, le point devient vert "Photo marcheur · Gaspard Boréal", la photo bascule en badge marcheur, et apparaît dans le portfolio Gaspard + le Mur des marcheurs
3. Compteur Carnet / Carte / Synthèse restent strictement alignés (la RPC `get_exploration_species_count` fusionne déjà snapshots + marcheur_observations)
4. Idempotence : si on relance le backfill, 0 doublon (clé unique `inaturalist_observation_id`)

## Mémoires à mettre à jour

- Étendre `marcheur-inaturalist-backfill-logic` avec le nouveau trigger sur `biodiversity_snapshots`
- Nouvelle mémoire `species-drawer-all-snapshots-fusion-logic` : explique que les hooks drawer doivent suivre le même pattern "all snapshots" que la RPC unifiée, sinon dérive immédiate

## Hors scope (explicite)

- Pas de refactor du libellé "marcheur" du badge `useSpeciesObservers` (déjà tracé dans le code comme intentionnel : observateurs citoyens)
- Pas de changement de la RPC `get_exploration_species_count` (déjà correcte)
- Pas de modification de la curation "L'Œil" (séparée)
