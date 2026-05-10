## Diagnostic

La capture d'écran montre clairement 12 cartes (Sphinx fuciforme, Tircis, Coenagrionidae, Mélitée, Bourdon…). Le chatbot, lui, répond : « *les `visibleCards` sont vides dans mon flux de données actuel* » puis **invente** des exemples génériques (« Buse variable », « Mésange bleue », « Chardonneret »…). Deux bugs cumulés :

### 1. La modale Marche est invisible pour l'observer DOM
- `ChatViewportObserver` est monté dans `ExplorationMarcheurPage` avec `[data-chat-viewport]` comme racine.
- La fiche d'un marche s'ouvre via `MarcheDetailModal` → `Dialog` (Radix) → **portail React monté dans `<body>`**, donc **hors** du `data-chat-viewport`.
- Conséquence : `cards.length = 0`, `visibleCards = []`. L'IA ne « voit » rien de la fiche en cours.

### 2. Les cartes espèces n'ont aucun marqueur `data-chat-*`
`EnhancedSpeciesCard` ne pose ni `data-chat-card`, ni `data-chat-title`, ni `data-chat-subtitle`. Même si l'observer scannait la modale, l'extraction par marqueurs explicites (la plus fiable) échouerait et retomberait sur des heuristiques fragiles (`h3, h4, .font-semibold`) qui ne s'appliquent pas à cette carte.

### 3. Le prompt autorise implicitement la fabulation
Le prompt actuel dit « si rien dans visibleData, dis-le honnêtement ». Le modèle l'a fait… puis a quand même inventé des **noms d'espèces fictifs** comme exemples illustratifs (« Buse variable », « Goldfinch → Chardonneret », « Mésange bleue / Blue Tit »). Aucune de ces espèces n'est dans la fiche. C'est de la pollution informationnelle pour un Ambassadeur.

---

## Plan

### Étape 1 — Faire voir les portails (Dialog/Sheet/Drawer) à l'observer

Modifier `src/components/chatbot/ChatViewportObserver.tsx` :
- Scanner **deux** racines à chaque capture : `[data-chat-viewport]` (la page) **et** tous les overlays Radix actifs (`[role="dialog"][data-state="open"]`, `[data-radix-portal]`, `[data-vaul-drawer][data-state="open"]`).
- Fusionner les snapshots : chips/headings/cartes du portail s'ajoutent à ceux de la page (le portail prime quand il est ouvert).
- Ajouter au `MutationObserver` une seconde observation sur `document.body` (filtre `data-state`, `data-radix-portal`) pour déclencher une re-capture à l'ouverture/fermeture d'une modale.

### Étape 2 — Marquer les cartes espèces et l'onglet actif

`src/components/audio/EnhancedSpeciesCard.tsx` : sur le `<Card>` racine ajouter
- `data-chat-card`
- `data-chat-title={displayName /* FR via translation */}`
- `data-chat-subtitle={species.scientificName}`
- `data-chat-badges={[species.source, hasAudio ? 'audio' : null, hasPhoto ? 'photo' : null].filter(Boolean).join(',')}`

`src/components/biodiversity/SpeciesExplorer.tsx` :
- Sur les `TabsTrigger` de catégorie (`all/faune/plants/fungi/others`) → ajouter `data-chat-chip` ; le `data-state="active"` de Radix Tabs sera capté par les heuristiques `aria-selected` existantes (déjà couvert par l'observer).
- Sur la racine du composant : ajouter `data-chat-section="species-explorer"` + un compteur visible `data-chat-count={filteredSpecies.length}` (informatif).

### Étape 3 — Marquer la modale Marche

`src/components/community/MarcheDetailModal.tsx` : sur le `DialogContent`, ajouter
- `data-chat-context="marche-detail"`
- `data-chat-title={titre du point de marche}`
- `data-chat-subtitle={date + référence cadastrale visibles}`

Cela donne au snapshot un libellé clair (« DEVIAT Point 00 une maison pour vivre (C 362) »).

### Étape 4 — Durcir le prompt pour interdire les exemples inventés

Dans `supabase/functions/community-chat/index.ts`, compléter `BASE_SYSTEM_PROMPT` par une règle anti-hallucination :

> **INTERDICTION ABSOLUE** : ne **jamais** citer un nom d'espèce (français, latin ou anglais) qui n'apparaît pas littéralement dans `visibleData` ou dans le `entityContext` ci-dessous. Pas de « *si vous voyez Buse variable…* », pas d'exemples illustratifs nominatifs, pas de spéculations sur les confusions possibles avec *Goldfinch* / *Blue Tit*. Si la liste n'est pas fournie, dis « *Je ne vois pas la liste détaillée affichée à ton écran ; rouvre la fiche ou demande l'extrait* » et arrête-toi.

Et une règle de **cohérence des compteurs** : ne pas faire d'arithmétique entre slices issues de filtres différents (12 visibles vs 15 globaux) sans avoir explicité le filtre actif (catégorie / source / contributeur).

### Étape 5 — Validation

1. Ouvrir l'exploration → cliquer sur le marche → onglet Marches → catégorie Faune.
2. Demander au chatbot : « *Que vois-tu actuellement à l'écran ?* »
3. Attendu : il liste les 12 espèces réellement affichées (Sphinx fuciforme, Tircis, Mélitée…), avec le filtre `Faune (12)` et les sources iNaturalist/Photo, sans inventer de nom.
4. Tester aussi onglet Flore (22) et le passage Marches → Carte pour vérifier le re-snapshot.

---

## Fichiers modifiés

- `src/components/chatbot/ChatViewportObserver.tsx` *(scan multi-racines + body)*
- `src/components/audio/EnhancedSpeciesCard.tsx` *(marqueurs `data-chat-*`)*
- `src/components/biodiversity/SpeciesExplorer.tsx` *(marqueurs onglets + section)*
- `src/components/community/MarcheDetailModal.tsx` *(contexte modale)*
- `supabase/functions/community-chat/index.ts` *(durcissement prompt)*

Aucune migration DB. Aucune rupture d'API publique.
