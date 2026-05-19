# Cohérence du comptage d'espèces — Synthèse ↔ Chatbot

## Diagnostic

Sur l'exploration `DEVIAT / Jardin Monde`, vérifié en base :

| Source | Comptage | Vu par |
|---|---|---|
| `biodiversity_snapshots` seuls | **84** | Chatbot (via RPC `get_admin_entity_context`) |
| `marcheur_observations` (dont 8 exclusives) | 75 | — |
| **Union snapshots ∪ marcheur** | **92** | Onglet Synthèse |

Le chatbot ignore les 8 espèces apportées uniquement par les marcheurs.

## Cause racine

Deux sources de vérité divergentes :
- **Front Synthèse** (`EventBiodiversityTab.tsx` l.367-378) fusionne snapshots + `marcheur_observations` — stratégie correcte, alignée avec la mémoire core *"Fréquence iNat fusion"*.
- **RPC `get_admin_entity_context`** (branches `marche_event` et `exploration`) ne lit que `biodiversity_snapshots`.

## Plan

### 1. Migration SQL — corriger le RPC (source backend unique)

Remplacer la CTE `species_unique` dans les deux branches (`marche_event` et `exploration`) par un **UNION dédoublonné par `lower(scientific_name)`** :

```sql
WITH marche_ids AS (
  SELECT marche_id FROM exploration_marches WHERE exploration_id = <ctx>
),
snap_species AS (
  SELECT lower(coalesce(sp->>'scientificName', sp->>'commonName')) AS key,
         sp->>'kingdom' AS kingdom
  FROM biodiversity_snapshots bs
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(bs.species_data,'[]'::jsonb)) sp
  WHERE bs.marche_id IN (SELECT marche_id FROM marche_ids)
    AND coalesce(sp->>'scientificName', sp->>'commonName') <> ''
),
mo_species AS (
  SELECT lower(species_scientific_name) AS key, NULL::text AS kingdom
  FROM marcheur_observations
  WHERE marche_id IN (SELECT marche_id FROM marche_ids)
    AND species_scientific_name IS NOT NULL
    AND species_scientific_name <> ''
),
species_unique AS (
  SELECT DISTINCT ON (key) key, kingdom
  FROM (
    SELECT key, kingdom FROM snap_species
    UNION ALL
    SELECT key, kingdom FROM mo_species
  ) u
  WHERE key IS NOT NULL
  ORDER BY key, (kingdom IS NULL) ASC  -- privilégie l'entrée qui a un kingdom
)
```

Le tri `(kingdom IS NULL) ASC` garantit qu'une espèce présente à la fois côté snapshots et marcheurs garde son `kingdom` iNat (Faune/Flore correctement ventilée). Les 8 espèces "marcheur-only" sans kingdom retomberont dans `others`.

Appliquer aux branches `marche_event` (l.60-80) et `exploration` (l.135-155). Ajouter aussi un champ `marcheur_only_count` pour traçabilité.

### 2. Snapshot UI — `useChatTabSnapshot('synthese.stats', …)`

Dans `EventBiodiversityTab.tsx`, publier le slice exact affiché à l'écran (juste après le calcul de `stats`) :

```ts
useChatTabSnapshot('synthese.stats', {
  total: stats.total,
  faune: stats.birds,
  flore: stats.plants,
  champignons: stats.fungi,
  autres: stats.others,
  marches_count: marchesCount,
  source: 'snapshots ∪ marcheur_observations',
});
```

Bénéfice : conformément aux règles déjà en place dans `community-chat/index.ts` (l.163), `visibleData` prime sur les agrégats globaux → le chatbot dira toujours **exactement** ce que l'utilisateur voit, même si un filtre catégorie est actif plus tard.

### 3. Vérification

- Recharger l'écran Synthèse de DEVIAT/Jardin Monde, demander au chatbot « combien d'espèces ? » → doit répondre **92** et pouvoir détailler 31 Faune / 51 Flore / 2 Champignons / 8 Autres.
- Tester sur un événement n'ayant que des snapshots (pas d'obs marcheur) → comptage inchangé.

## Fichiers touchés

- `supabase/migrations/<ts>_align_chatbot_species_count.sql` (nouveau) — remplace `get_admin_entity_context`
- `src/components/community/EventBiodiversityTab.tsx` — ajout du `useChatTabSnapshot('synthese.stats', …)`

## Note mémoire

À l'issue, ajouter une mémoire `mem://technical/biodiversity/chatbot-species-count-alignment` rappelant que le RPC doit toujours rester aligné sur la stratégie "snapshots ∪ marcheur_observations" pour ne pas réintroduire la divergence.
