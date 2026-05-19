# Chaîne trophique — 92 espèces, 0% curé, 39 non classées

## Diagnostic (racine du bug)

J'ai inspecté `species_data` des snapshots de cette exploration :

```
sci=Corylus avellana   family="49155"     kingdom=Plantae
sci=Trichodes alvearius family="373395"   kingdom=Animalia
```

**Le champ `family` stocké est l'ID taxon iNaturalist (entier), pas le nom de famille.** Le classificateur (`FAMILY_RULES`) attend `"Betulaceae"`, reçoit `"49155"` → **0 famille matchée**. Du coup :
- Plantae → L1 via fallback kingdom ✅
- Fungi → DECOMPOSER ✅
- **Animalia → UNCLASSIFIED** (aucun fallback kingdom, et family inutilisable) → c'est l'origine des 39 non classées
- `curatedRatio` = `kb hits / total`, et notre KB inline ne contient que ~30 espèces emblématiques rarement présentes → **0%**

Les observations `marcheur_observations` arrivent aussi sans family ni kingdom (`kingdom='Other'`) → UNCLASSIFIED garantie.

## Stratégie « frugalité + efficacité »

Trois leviers, du plus rapide au plus structurel, **sans appel API supplémentaire à chaque vue** :

### Levier 1 — Classificateur enrichi (gain immédiat, 0 € de backend)

Étendre `src/lib/trophicClassification.ts` pour exploiter **ce qu'on a déjà** :

- Accepter un nouveau champ optionnel `iconicTaxon` (Aves, Insecta, Arachnida, Mammalia, Reptilia, Amphibia, Mollusca, Fungi, Plantae…) et ajouter des règles fallback robustes : Aves→L3, Insecta→L2, Arachnida→L3, Reptilia→L4, Amphibia→L3, Mammalia→L2 (sauf famille connue prédateur).
- Détection « famille = entier numérique » → ignorer ce champ et passer aux fallbacks au lieu de renvoyer UNCLASSIFIED.
- Élargir `SPECIES_KB` avec ~60 espèces issues du top observations du projet (export rapide depuis snapshots) pour faire monter le ratio curé > 25 % sans surcharger le fichier.

À lui seul ce levier ramène les 39 UNCLASSIFIED à ~5–8.

### Levier 2 — Résolveur taxon ID → famille (one-shot + cache)

Créer une edge function **`resolve-inat-taxa`** + une table cache `inat_taxa_cache` (`taxon_id` PK, `family_name`, `iconic_taxon`, `rank`, `cached_at`) :

- Endpoint iNat `GET /v1/taxa?id=X,Y,Z` accepte **30 IDs par requête**, gratuit, sans clé.
- La fonction lit tous les `family` numériques distincts encore inconnus du cache, les batch-résout, et met à jour `inat_taxa_cache`.
- Un **second edge function `backfill-snapshots-taxonomy`** (one-shot, déclenché 1× par l'admin) parcourt `biodiversity_snapshots`, joint avec le cache, et réécrit chaque `species_data[i].family` (string ID → nom de famille) + ajoute `iconicTaxon`. Pour ~10k snapshots du projet, traitement < 2 min en quelques pages.

### Levier 3 — Normalisation à l'ingestion (durable, zéro coût récurrent)

Modifier la edge function qui alimente déjà `biodiversity_snapshots` depuis iNat (probablement `collect-biodiversity` / `sync-marche-biodiversity` selon la mémoire « Snapshot sync ») pour, **au moment de l'écriture** :

- Extraire de la réponse iNat les champs `taxon.iconic_taxon_name` (gratuit, déjà dans la payload) et la résolution famille via `taxon.ancestors[]` (idem, déjà payload — aucun appel supplémentaire).
- Stocker `family` = nom et `iconicTaxon` = string dans chaque entrée de `species_data`.

À partir de ce moment, **toute nouvelle donnée iNat arrive déjà propre**, le cache `inat_taxa_cache` ne grossit plus, et le backfill du Levier 2 ne se reprouve jamais.

### Bonus créatif — « Sentinelles auto-curées »

Vue admin légère (`unclassified_species_admin`) qui liste les espèces observées ≥ 3× toujours en UNCLASSIFIED après tous les fallbacks. Un clic → ajout au `SPECIES_KB` JSON. Le ratio curé monte organiquement avec l'usage.

## Plan d'implémentation (ordre)

1. **Levier 1** — patch `trophicClassification.ts` (iconicTaxon, détection ID numérique, KB élargie). Effet immédiat dès le prochain render, déjà visible sur l'exploration actuelle dès que les snapshots auront `iconicTaxon` (Levier 3) — **mais on profite déjà tout de suite des règles kingdom Animalia → L2/L3 par défaut**.
2. **Levier 3** — patch edge function de sync iNat pour écrire `family` (nom) + `iconicTaxon` à l'ingestion. Toute nouvelle obs propre.
3. **Levier 2** — migration table `inat_taxa_cache` + edge functions `resolve-inat-taxa` & `backfill-snapshots-taxonomy`. Lancer le backfill une fois → 92/92 espèces classées correctement sur l'historique.
4. **Bonus** — vue admin `unclassified_species_admin` (5 min, optionnel).

## Détails techniques

- Cache `inat_taxa_cache` : `taxon_id BIGINT PK`, `name TEXT`, `rank TEXT`, `family_name TEXT`, `iconic_taxon TEXT`, `cached_at TIMESTAMPTZ`. RLS : lecture publique, écriture service_role uniquement.
- L'ID famille iNat se résout via `ancestors[]` filtrés sur `rank='family'`. Si l'espèce est elle-même au rang famille (cas `Cercis`, `Peonies`), `family_name` = name de l'espèce.
- Edge function `backfill-snapshots-taxonomy` itère par batch de 100 snapshots, met à jour `species_data` via `jsonb_set` en SQL côté serveur pour éviter de retransférer la payload.
- `curatedRatio` reste calculé sur `source==='kb'` exact — Levier 1 le fait monter naturellement via KB élargi.

## Garde-fous

- Aucun rate-limit iNat dépassé : 1 req/sec, 30 IDs/req, cache permanent. Sur ~500 familles distinctes typiques d'un projet → ~17 requêtes au total, une seule fois.
- Pas de breaking change UI : `TrophicChainPanel` reçoit la même prop, seules les classifications s'affinent.
- Mémoire `Snapshot sync on view` respectée : le travail reste côté edge function, jamais bloquant pour l'utilisateur.
