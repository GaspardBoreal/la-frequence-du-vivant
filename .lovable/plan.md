
# Pourquoi 73 persiste alors que la Carte affiche 81

Mon précédent changement (faire dériver `stats.total` de `allSpeciesAsBiodiversity`) est en place, mais **le pool fusionné lui-même vaut 73**, pas 81. Deux causes :

## Cause #1 (bloquante) — Jointure `!inner` trop stricte

Dans `src/components/community/EventBiodiversityTab.tsx` l.179 :

```ts
exploration_marcheurs!inner(prenom, nom)
```

Filtre toutes les `marcheur_observations` non rattachées à une ligne `exploration_marcheurs` (backfill iNat, marcheurs supprimés, etc.). Ce sont précisément les ~8 espèces qui font la différence 73 → 81.

La Carte (`useExplorationBiodiversitySummary` l.163-166) lit `marcheur_observations` **sans aucune jointure** → voit tout → 81.

## Cause #2 (risque futur) — Dédup sensible à la casse

Snapshots : clé = `sp.scientificName` (casse préservée).
Marcheur obs : clé = `o.species_scientific_name`.

Si jamais la casse diffère, mêmes espèces comptées deux fois. La Carte gère déjà via `toLowerCase()`.

---

# Plan

## 1. `EventBiodiversityTab.tsx` — Requête `marcheurObs`

Remplacer la jointure inner par un left join + fallback nom :

```ts
const { data: marcheurObs } = useQuery({
  queryKey: ['event-marcheur-observations', marcheIds],
  queryFn: async () => {
    if (!marcheIds?.length) return [];
    const { data } = await supabase
      .from('marcheur_observations')
      .select(`
        id, marche_id, marcheur_id, species_scientific_name,
        observation_date, photo_url, inaturalist_observation_id,
        latitude, longitude,
        exploration_marcheurs(prenom, nom)
      `)  // ⚠️ pas de !inner
      .in('marche_id', marcheIds)
      .not('species_scientific_name', 'is', null);
    return data || [];
  },
  enabled: !!marcheIds?.length,
});
```

Et dans la boucle l.297 :

```ts
const crew = o.exploration_marcheurs;
const observerName = `${crew?.prenom || ''} ${crew?.nom || ''}`.trim()
  || 'Contributeur iNaturalist';
```

## 2. Dédup case-insensitive du `speciesMap`

Helper normalisé partagé en haut du `useMemo` :

```ts
const normKey = (s: string | null | undefined) =>
  (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
```

- Snapshots l.264 : `const key = normKey(sp.scientificName || sp.commonName || sp.id);`
- marcheurObs l.298 : `const key = normKey(o.species_scientific_name);`

Aligne la dédup sur la stratégie de la Carte → garantit que 73 + obs marcheurs = exactement 81 (pas 81+doublons).

## 3. Vérification

Après edit, recharger l'écran Synthèse :

- Cards : **81 / Faune+Flore+Champi+Autre = 81**.
- Pouls header (onglet Taxons observés) : **81 espèces découvertes** (déjà câblé via `overrideTotalSpecies={stats.total}`).
- Indicateurs (Richesse spécifique) : **56 sur 81 taxons observés** (déjà câblé via `totalSpeciesAllRanks={stats.total}`).
- Carte (bas) : 81 (inchangé).

## Hors-scope (volontairement)

- Aucune modif SQL / RLS.
- Aucune modif des indices écologiques (56 individus-species-level, 80 individus GPS) : ce sont des sous-mesures, clarifiées par la mention "sur 81 taxons observés" déjà en place dans `RichnessTab`.
- Aucune modif de `useExplorationBiodiversitySummary` (Carte) ni de `BiodiversityEvolutionChart` (courbe) : la courbe garde sa série datée snapshots, seul le total affiché en header est forcé à 81.

## Résultat attendu

| Écran | Avant | Après |
|---|---|---|
| Carte bandeau bas | 81 | 81 |
| Synthèse cards | **73** | **81** |
| Pouls header | **73** | **81** |
| Pouls filtre "Toutes" | 81 | 81 |
| Indicateurs Richesse | 56 (sans contexte) | 56 sur **81** taxons observés |

Une seule source de vérité, alignée sur la Carte.
