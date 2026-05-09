## Diagnostic

L'indice de Sentinelle de Laurence Karki affiche **1 bio + 1 aux + 0 EEE** alors qu'elle n'a détecté qu'**une seule espèce auxiliaire** (Carabus coriaceus). Le Carabe est compté dans 2 buckets simultanément.

**Cause racine** : deux problèmes superposés.

1. **Source de vérité incorrecte.** `useMarcheurSensibleSpecies` lit `species-knowledge-base.json` (statique, multi-catégories : `primary` + `secondary[]`). Or l'écran "L'œil" (curation éditoriale via `exploration_curations`) classe chaque espèce avec **une seule catégorie primaire** (`category`) — c'est cette catégorie qui s'affiche en pastille (Auxiliaire pour Carabe). Le KB n'est qu'un fallback ; la curation éditoriale doit primer.

2. **Entrée KB du genre `Carabus` sur-classifiée.** Ajoutée précédemment avec `secondary: ["indigene", "bioindicatrice"]`. Même corrigée, elle reste en double-comptage tant que le bucketing utilise primary + secondary.

## Plan

### 1. Source de vérité = curation éditoriale (L'œil)

Refactor `useMarcheurSensibleSpecies(speciesObserved, explorationId?)` :
- Lire `exploration_curations` (sense=`oeil`, entity_type=`species`) pour cette exploration.
- Construire une map `scientificName → category` (la **catégorie primaire uniquement**, comme dans L'œil).
- Pour chaque observation du marcheur : si curation existe, ranger dans le bucket de `category`. Sinon → fallback KB (primary uniquement, plus de secondary).
- Garantit qu'une espèce ne tombe jamais dans 2 buckets.

Propager `explorationId` dans :
- `MarcheurImpactPanel.tsx` (et `ImpactStoriesViewer` qui reçoit `sensible`).
- `useExplorationParticipants` ou hooks parents qui exposent déjà l'exploration courante.

### 2. Nettoyer l'entrée KB Carabus (fallback)

Dans `species-knowledge-base.json`, retirer `bioindicatrice` du `secondary` de `Carabus`. Garder `primary: "auxiliaire"`, `secondary: ["indigene"]`.

### 3. Bucketing strict (plus de secondary)

Modifier `bucketSensibleSpecies` (et `classifySpecies` côté fallback) pour ne retenir **que** la catégorie primaire. Aligne le comportement sur la pastille unique affichée dans L'œil et empêche tout futur double-comptage par d'autres entrées KB (par ex. les nombreuses espèces avec `bioindicatrice` + `auxiliaire` en secondary).

### Vérification attendue après application

Pour Laurence Karki (1 obs : Carabus coriaceus) :
- `sensible: { bioIndicateurs: [], auxiliaires: ['Carabus coriaceus'], eee: [], patrimoniales: [] }`
- Bandeau "Détections précieuses" : **0 bio · 1 aux · 0 EEE**
- Pondération sensibles : `0×1.5 + 1×1.0 + 0×2.0 = 1` → +2.7 pts (au lieu de gonflage actuel)
- Plus de divergence entre L'œil (Auxiliaire) et l'empreinte vivante.

## Fichiers impactés

```text
src/hooks/useMarcheurSensibleSpecies.ts      (signature + lecture curation)
src/lib/speciesClassification.ts             (bucketing primary-only)
src/data/species-knowledge-base.json         (Carabus: retirer bioindicatrice)
src/components/community/exploration/impact/MarcheurImpactPanel.tsx  (passer explorationId)
```

Aucune migration SQL nécessaire — `exploration_curations` existe déjà.