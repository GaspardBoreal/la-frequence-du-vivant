# Correction du backfill iNat — multi-observations par espèce

## Bug identifié

Dans `supabase/functions/backfill-marcheur-inaturalist/index.ts`, lignes **134-135** :

```ts
if (seen.has(sciName)) continue;
seen.add(sciName);
```

→ Le `Set` est indexé sur le **nom scientifique seul**. Pour chaque marche, dès qu'une *Anacamptis pyramidalis* est rencontrée, **toutes les autres observations de la même espèce sont ignorées**. C'est pourquoi seule 1 des 3 observations iNat de Laurence Karki sur DEVIAT a été récupérée (puis dupliquée 4× via le rayon 500 m sur 4 marches voisines).

Aggravation : la clé d'unicité de l'upsert (ligne 161) est `(marcheur_id, marche_id, species_scientific_name)` → **structurellement, le schéma ne peut stocker qu'1 obs par espèce par marche**, donc même en corrigeant le filtre Set, l'upsert écraserait.

## Plan en 2 étapes

### Étape 1 — Schema + dédoublonnage par observation iNat

**1.a Migration DB**
- Ajouter `inaturalist_observation_id BIGINT` à `marcheur_observations` (nullable).
- Index unique partiel : `UNIQUE (marcheur_id, inaturalist_observation_id) WHERE inaturalist_observation_id IS NOT NULL`.
  → garantit l'idempotence du backfill (même obs iNat ne sera jamais ré-insérée pour le même marcheur, même si elle tombe dans le rayon de plusieurs marches).
- L'ancienne contrainte `(marcheur_id, marche_id, species_scientific_name)` est conservée si elle existe pour les obs manuelles (sans `inaturalist_observation_id`), ou allégée si elle bloque. Je vérifierai sa présence avant migration.

**1.b Edge function `backfill-marcheur-inaturalist`**
- Remplacer le `Set<sciName>` par `Set<inaturalist_observation_id>` → on dédoublonne par identifiant iNat unique, pas par espèce.
- Stocker `obs.id` dans le nouveau champ `inaturalist_observation_id`.
- Changer `onConflict` de l'upsert vers `'marcheur_id,inaturalist_observation_id'`.
- **Choix d'attribution multi-marches** : pour éviter la duplication actuelle (1 obs iNat → 4 lignes attachées à 4 marches), attacher chaque observation iNat à **la marche la plus proche** parmi celles dont le rayon couvre l'observation. Implémentation : on accumule d'abord toutes les obs candidates (clé = `obs.id`) avec leur distance à chaque marche, puis on ne garde que la marche minimale par obs. Résultat : 1 obs iNat = 1 ligne BDD (au lieu de 4).

### Étape 2 — Relance du backfill sur l'exploration concernée

- Purge des lignes "iNaturalist backfill" de l'exploration `20dd3be8-…-Jardin Monde` pour repartir propre (uniquement `notes = 'iNaturalist backfill'`, on touche pas aux contributions manuelles).
- Appel manuel de l'edge function `backfill-marcheur-inaturalist` pour le couple `(user_id = 4fc3cf86-…, exploration_id = 20dd3be8-…)`.
- Vérification SQL : on doit voir **3 lignes** *Anacamptis pyramidalis* (IDs iNat `361406617`, `361435682`, `361436414`), chacune attachée à la marche la plus proche, GPS reportable côté UI.

## Détails techniques

**Migration SQL (étape 1.a)** :
```sql
ALTER TABLE public.marcheur_observations
  ADD COLUMN IF NOT EXISTS inaturalist_observation_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS marcheur_observations_marcheur_inat_uniq
  ON public.marcheur_observations (marcheur_id, inaturalist_observation_id)
  WHERE inaturalist_observation_id IS NOT NULL;
```

**Diff edge function (étape 1.b)** : voir lignes 122-143 et 159-161 ; le bloc devient :
```ts
// dédoublonner par obs.id iNat (pas par espèce)
const inatId = obs?.id;
if (!inatId || seen.has(inatId)) continue;
seen.add(inatId);
allInserts.push({
  marche_id: m.id,
  distance_km: haversineKm(...),
  inaturalist_observation_id: inatId,
  species_scientific_name: sciName,
  observation_date: obs?.observed_on || null,
  photo_url: obs?.photos?.[0]?.url?.replace('square', 'medium') || null,
});
```
Puis post-traitement : `Map<inatId, bestRow>` qui garde la `distance_km` minimale.

**Étape 2** : utilise `supabase.functions.invoke('backfill-marcheur-inaturalist', { body: { user_id, exploration_id, source: 'manual_repair' } })` via curl, ou la RPC admin existante `trigger_backfill_marcheur_inat_batch()`.

## Impact

- **Aucune régression UI** : `SpeciesGalleryDetailModal` continuera à dédoublonner par `photo_url` côté front (donc une obs avec 2 photos reste correcte).
- **Backward compat** : les anciennes lignes sans `inaturalist_observation_id` ne sont pas touchées.
- **Effet visible** : sur l'orchidée pyramidale du jour, on passera de 1 photo unique (dupliquée 4×) à **3 photos distinctes** dans le carrousel.

Confirme et je lance la migration puis la correction edge + relance.
