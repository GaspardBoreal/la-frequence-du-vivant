## Diagnostic

**Symptôme** : pour « Les marches du vivant », Marcheurs→Marcheurs affiche **5 espèces** alors que Synthèse→Taxons observés en affiche **9** (même périmètre d'exploration, même contributeur sélectionné).

**Cause racine** : deux stratégies de matching différentes sont utilisées pour identifier les attributions d'un même contributeur.

| Vue | Logique de match | Robuste aux variantes `observerName` ? |
|---|---|---|
| Synthèse (`SpeciesExplorer`) | `buildCitizenIdentityResolver(pool)` — Pass A indexe `normalizeAlias(name) → observerLogin`, Pass B réconcilie toute attribution via son `observerLogin` ou son alias. Match = `resolveIdentity(attr) === target` **OU** `normalizeAlias(observerName) === target`. | ✅ Oui : toutes les obs du compte iNat `les-marches-du-vivant` sont réconciliées même si `observerName` varie (casse, accent, abrégé, vide). |
| Marcheurs (nouveau `useMarcheurAttributedSpecies`) | `normalizeAlias(attr.observerName) ∈ aliasSet` (aliasSet = nom/prénom + `community_profile_science_accounts.username`). | ❌ Non : une attribution avec `observerLogin = les-marches-du-vivant` mais `observerName` = variante non listée dans les aliases est **perdue**. D'où les 4 espèces manquantes. |

**Risque systémique** : ce n'est pas spécifique à LMDV. Tout marcheur lié à un compte iNat dont au moins une obs a un `observerName` non strictement égal aux aliases connus subira la même sous-comptabilisation dans la tuile Contributions, dans `useExplorationCitizenContributors` (filtre `knownAliases`), et dans toute logique qui dérive d'un set d'alias brut.

## Solution

Source unique de vérité pour « est-ce que cette attribution iNat appartient au marcheur X ? » via `buildCitizenIdentityResolver`, partagée par toutes les vues.

### 1. Refactor `useMarcheurAttributedSpecies` (`src/hooks/useMarcheurAttributedSpecies.ts`)

- Charger les snapshots une fois, **construire le resolver sur l'intégralité des attributions iNat** du pool (mêmes données que SpeciesExplorer).
- Construire un set d'**identités canoniques du marcheur** :
  - tous les `aliases` normalisés (existant)
  - tous les `username` des `community_profile_science_accounts` (déjà couverts par aliases)
  - **plus** : indexer dans le pool tout `observerLogin` dont une attribution a `normalizeAlias(observerName) ∈ aliasSet`. Ajouter ces logins canoniques au set.
- Match d'une attribution : `resolveIdentity(attr) ∈ canonicalSet` **OU** `normalizeAlias(observerName) ∈ aliasSet`.
- Conséquence : 100 % parité avec le filtre contributeur de `SpeciesExplorer`. Les 9 espèces apparaîtront dans Contributions comme dans Synthèse.

### 2. Aligner `useExplorationCitizenContributors`

Même resolver est déjà utilisé. Vérifier que l'exclusion `knownAliases.has(canonical)` utilise bien la même définition de « canonical » (résultat du resolver, pas alias brut). Si écart, harmoniser. (Lecture seule, à confirmer ; le hook fait déjà `resolve(a)` puis `knownAliases.has(canonical)` — OK si `knownAliases` inclut aussi les logins canoniques. À étendre côté appelant si besoin.)

### 3. Test de non-régression manuel

Validation sur l'exploration courante (`20dd3be8…`), marcheur « Les marches du vivant » :
- Onglet **Marcheurs → Marcheurs → Contributions** : doit afficher **9 espèces** (parité avec Synthèse).
- Onglet **Synthèse → Taxons observés**, filtre contributeur « Les marches du vivant » : reste à 9.
- Toggle global Photos marcheurs ↔ iNat : se reflète immédiatement dans Contributions.
- Filtre local « Mes photos (N) » : N inchangé, basé sur uploads Supabase storage.
- Tester un second marcheur avec compte iNat pour confirmer le pattern.

## Détails techniques

```text
useMarcheurAttributedSpecies (refactored)
├─ fetch snapshots × marcheIds (une fois)
├─ buildCitizenIdentityResolver(allInatAttrs)     ← identique à SpeciesExplorer
├─ canonicalKeys = Set<string>
│   ├─ ∀ alias ∈ aliases                          → ajouter alias
│   └─ ∀ attr du pool tel que normalizeAlias(attr.observerName) ∈ aliases
│       et attr.observerLogin présent             → ajouter login
├─ pour chaque snapshot/species/attribution :
│   ├─ si resolveIdentity(attr) ∈ canonicalKeys
│   │  OU normalizeAlias(attr.observerName) ∈ aliases
│   │  → upsert species
└─ + marcheur_observations directes (inchangé)
```

Aucun changement DB. Aucun changement UI. Pas de migration. Modif circonscrite à `src/hooks/useMarcheurAttributedSpecies.ts`.

## Hors scope

- Backfill `observerLogin` sur snapshots legacy : déjà documenté (mem `snapshot-attribution-backfill-trigger`), non requis ici car le resolver compense à la lecture.
- Sauvegarder une mémoire : `mem://technical/community/identity-matching-logic` couvre déjà le principe ; ajouter une note rappelant que **tous** les hooks qui filtrent par marcheur doivent passer par le resolver, pas par un alias-set brut.
