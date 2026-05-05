
# Faire voir réellement l'écran au Compagnon du Vivant

## Diagnostic

Sur la copie d'écran, l'utilisateur est dans **Apprendre › L'œil › Sélection finale**, filtre catégorie = **Auxiliaire** (4 cartes affichées). Pourtant l'IA répond qu'elle "n'a pas de liste nominative filtrée".

Cause racine vérifiée dans le code :
- `OeilCuration.tsx` (l'écran réellement affiché) **ne publie rien** dans `chatPageContext.visibleData`. Seul `MainCuration` le fait (instrumentation manuelle, ajoutée au loop précédent).
- Le filtre `categoryFilter='auxiliaire'`, l'onglet `view`, la recherche `search` et **la liste des cartes effectivement visibles** ne sont jamais transmis.
- Côté edge function `community-chat`, la règle "priorité absolue" sur `visibleData` est déjà en place — elle ne voit simplement rien à prioriser.

Le pattern actuel (un `useChatTabSnapshot` par sous-composant) ne passera jamais à l'échelle des dizaines d'onglets de Mon Espace : oublis garantis, dette qui grossit à chaque nouvelle vue.

## Stratégie : double couche, générique d'abord, ciblée ensuite

### Couche 1 — Capture DOM générique (zéro effort par page)

Un seul composant `<ChatViewportObserver>` monté **à la racine de Mon Espace**. Il observe le viewport principal et, à chaque changement (route, scroll arrêté, mutation DOM, switch d'onglet), il extrait un snapshot textuel léger de ce que l'utilisateur voit. Il publie sous la clé `screen.dom` dans `visibleData`.

Mécanique :
- Sélecteur racine : `<main>` ou `[data-chat-viewport]` posé une seule fois sur le wrapper de page Mon Espace.
- Pour chaque élément interactif/structurant `data-chat-*` ou éléments standards (`button[aria-pressed=true]`, onglets actifs, chips sélectionnés, headings `h1-h3`, cartes avec `data-chat-card`), on collecte :
  - rôle (tab/chip/card/heading/badge)
  - libellé textuel court (max 80 chars)
  - état (actif/sélectionné/épinglé)
- Throttle à 400ms via `MutationObserver` + `IntersectionObserver` pour ne capter que ce qui est réellement dans le viewport.
- Snapshot final = `{ activeChips: [...], visibleCards: [{ title, subtitle, badges }], headings: [...] }` plafonné à ~60 entrées / 6 KB.

Avantage : **toutes** les pages de Mon Espace deviennent immédiatement "vues" par l'IA, sans toucher à chaque composant.

### Couche 2 — Marqueurs sémantiques minimaux

Les composants riches (cartes d'espèces, médias, pratiques) reçoivent juste **un attribut HTML** :

```tsx
<div data-chat-card data-chat-title="Fusain d'Europe" data-chat-badges="Auxiliaire,4 obs.">
```

Aucun hook, aucune logique — juste de la donnée structurée que la couche 1 lit. C'est ce qui rend le snapshot lisible par l'IA (titre, catégorie, compteur).

À ajouter en priorité (les plus consultés) :
- `CuratedSpeciesCard` (Œil)
- `MainCuration` PracticeCard
- `OreilleCuration` SoundCard
- `MediaCard` (Voir / Convivialité)
- Chips de filtres : `data-chat-chip` + `data-chat-active`

### Couche 3 — Filtres explicites publiés dans `filters`

Là où il existe des filtres décisifs (catégorie d'espèce, recherche, sous-onglet `view`), un petit `useEffect` pousse la valeur dans `chatPageContext.setPageState({ filters: ... })`. Concrètement pour `OeilCuration` :

```ts
useEffect(() => {
  chatPageContext.setPageState({
    filters: {
      oeilView: view,                  // 'selection' | 'pool' | 'suggestions' | 'review' | 'terrain'
      oeilCategory: categoryFilter,    // 'auxiliaire', 'indigene', etc.
      oeilSearch: search || undefined,
      oeilVisibleCount: visibleItems.length,
    },
  });
}, [view, categoryFilter, search, visibleItems.length]);
```

Et la **liste précise** des espèces visibles après filtrage (max 30, champs minimaux) :

```ts
useChatTabSnapshot('apprendre.oeil.especes', visibleItems.slice(0, 30).map(x => ({
  nom_fr: displayName(x),
  nom_sci: x.species.scientificName,
  categorie: x.curation?.category,
  observations: x.species.count,
})));
```

À répliquer pour Oreille, Palais, Cœur, Voir/Marches, EventBiodiversity (top espèces visibles).

### Couche 4 — Renforcement du prompt edge function

Dans `community-chat`, ajouter une règle :

> Quand un filtre est actif (`filters.oeilCategory`, `filters.search`, etc.), tu DOIS répondre uniquement à partir de `visibleData` ou `screen.dom`. Tu ne dois JAMAIS dire "je n'ai pas la liste filtrée" si `visibleData` contient une slice non vide. Si la slice est plafonnée (`...30`), précise-le.

Et logguer côté edge function la taille de `visibleData` reçue (pour debug futur).

## Détails techniques

**Nouveau fichier** : `src/components/chatbot/ChatViewportObserver.tsx`
- Monté dans `MarchesDuVivantMonEspace.tsx` (wrapper de toutes les sous-routes /mon-espace).
- `MutationObserver` + `IntersectionObserver` sur `[data-chat-viewport]`.
- Throttle 400ms, snapshot dans `chatPageContext.setVisibleSlice('screen.dom', snapshot)`.
- Auto-cleanup au démontage.

**Wrapper** : ajouter `data-chat-viewport` sur le `<div className="min-h-screen ...">` racine de `ExplorationMarcheurPage` et des autres pages Mon Espace.

**Modifs ciblées** :
- `OeilCuration.tsx` : ajout `data-chat-card` + `data-chat-*` sur `CuratedSpeciesCard`, publication `filters` + snapshot `apprendre.oeil.especes`.
- `OreilleCuration.tsx` / `PalaisCuration.tsx` : même pattern allégé.
- `EventBiodiversityTab.tsx` : snapshot des top espèces et catégorie sélectionnée.
- `community-chat/index.ts` : règle prompt renforcée + log `visibleDataKeys`.

**Plafonds (anti-explosion payload)** :
- snapshot DOM ≤ 6 KB
- chaque slice métier ≤ 30 items
- payload total `visibleData` ≤ 16 KB (truncation avec marqueur `...truncated`).

## Résultat attendu

Sur la même question ("regarde les espèces identifiées comme auxiliaires ?"), l'IA recevra :

```json
{
  "filters": { "oeilView": "selection", "oeilCategory": "auxiliaire", "oeilVisibleCount": 4 },
  "visibleData": {
    "apprendre.oeil.especes": [
      { "nom_fr": "Fusain d'Europe", "nom_sci": "Euonymus europaeus", "categorie": "auxiliaire", "observations": 4 },
      { "nom_fr": "Cerisier sauvage", "nom_sci": "Prunus avium", "categorie": "auxiliaire", "observations": 4 },
      ...
    ],
    "screen.dom": { "activeChips": ["Auxiliaire (4)"], "visibleCards": [...] }
  }
}
```

Et pourra répondre précisément "Oui, 4 espèces sont actuellement classées Auxiliaire à l'écran : …".

## Étapes d'implémentation

1. Créer `ChatViewportObserver` + helper `extractDomSnapshot`.
2. Le monter dans `MarchesDuVivantMonEspace.tsx`, ajouter `data-chat-viewport` sur les pages.
3. Instrumenter `OeilCuration` (filtres + snapshot espèces visibles + `data-chat-*` sur cards).
4. Étendre à `OreilleCuration`, `PalaisCuration`, `EventBiodiversityTab`, `MediaCard`.
5. Renforcer le prompt + ajouter log dans `community-chat/index.ts`.
6. Tester sur 3 cas : Œil/Auxiliaire (cas signalé), Oreille filtré, Synthèse onglet espèces.
