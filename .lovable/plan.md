## Diagnostic

L'edge function `analyze-exploration-species` et le hook `useExplorationSpeciesPool` lisent la **mauvaise table** :

- ❌ Lecture actuelle : `marche_events` (1 seule ligne sans GPS pour cette exploration)
- ✅ Source réelle : `exploration_marches` → `marches` (**13 marches géolocalisées**) avec **11 snapshots biodiversité** déjà collectés

Vérifié en base :
```
exploration_marches × marches → 13 lignes, toutes avec lat/lng
biodiversity_snapshots         → 11 snapshots, ~73 observations d'espèces
```

C'est la même source que celle qu'utilise déjà `collect-event-biodiversity`. Le pool d'espèces est donc en réalité bien rempli — il faut juste lire au bon endroit.

## Correction

### 1. Edge function `analyze-exploration-species`

Remplacer la requête `marche_events` par la jointure correcte :

```ts
const { data: em } = await admin
  .from('exploration_marches')
  .select('marche_id, marches(id, latitude, longitude)')
  .eq('exploration_id', explorationId);

const marches = (em || []).map(x => x.marches).filter(Boolean);
const marcheIds = marches.map(m => m.id);
const marchesTotal = marches.length;
const marchesWithGps = marches.filter(m => m.latitude != null && m.longitude != null).length;
```

Puis lire `biodiversity_snapshots` via `marche_id IN (marcheIds)` — le reste du pipeline (agrégation, IA, upsert curations) est inchangé.

### 2. Hook `useExplorationSpeciesPool.ts`

Même correction côté front : interroger `exploration_marches` + `marches` au lieu de `marche_events`. Cela alimente la grille « Pool observé » qui est aujourd'hui vide pour la même raison.

### 3. Hook `useExplorationMarchesGpsStatus.ts` (créé tout à l'heure)

Même correction : compter via `exploration_marches` + `marches`, pour que le bandeau diagnostic dise la vérité.

### 4. Garde-fou

Garder le diagnostic structuré (`status: no_marches | no_gps | no_snapshots | empty_pool`) introduit précédemment — il reste utile pour les explorations qui n'ont effectivement rien.

## Fichiers touchés

- `supabase/functions/analyze-exploration-species/index.ts`
- `src/hooks/useExplorationSpeciesPool.ts`
- `src/hooks/useExplorationMarchesGpsStatus.ts`

## Hors scope

- Migrer définitivement `marche_events` vers `marches` : sujet d'architecture qui mérite son propre ticket. Pour l'instant on aligne la lecture sur la source de vérité déjà utilisée par les pipelines de collecte.
- Aucune migration DB.

## Résultat attendu

Sur l'exploration `70fcd8d1…` :
- Pool observé : ~73 espèces (au lieu de 0)
- Bandeau : « Données disponibles sur 11/13 marches »
- Bouton « Lancer l'analyse IA » : déclenche l'analyse Gemini qui scorera + catégorisera les espèces et pré-épinglera le top 3 par catégorie.
