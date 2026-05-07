# Refonte UX/UI — Menu unifié "Options carte"

## Contexte

Aujourd'hui, 3 boutons empilés en bas-gauche (`+ point de marche`, `point intermédiaire`, `boucle : OFF/ON`) occupent ~150px de hauteur en permanence et masquent la carte. Avec l'ajout d'options de couches (stations météo, et bientôt d'autres : cadastre détaillé, courbes de niveau, espèces visibles, etc.), cette colonne va exploser. Sur mobile (375px de large), c'est intenable.

## Diagnostic UX

Deux familles d'options se mélangent visuellement aujourd'hui, alors qu'elles relèvent de logiques différentes :

| Famille | Nature | Exemples | Permission |
|---|---|---|---|
| **Actions de création** (édition) | momentanées, modales (mode "je place un point") | + point de marche, + point intermédiaire | Ambassadeur+ |
| **Couches d'affichage** (lecture) | persistantes, toggle on/off | boucle, stations météo, cadastre, espèces… | Tout le monde |

Les regrouper dans un seul menu fourre-tout serait une faute. La proposition les sépare proprement tout en gardant une seule porte d'entrée discrète.

## Proposition — un FAB unique "Options" qui ouvre un panneau contextuel

### Au repos (état par défaut)

Un seul bouton circulaire en bas-gauche, symétrique du chatbot en bas-droite :

```text
        ┌──────────────────── carte ────────────────────┐
        │                                                │
        │                                                │
        │                                          [+]   │  ← zoom
        │                                          [-]   │
        │                                                │
        │  (⚙)                              (📷) (◎)    │  ← FAB Options + photo + géoloc
        │                                                │
        │  ━━━ 13 étapes ━━ 8.1 km ━━ 38 espèces ━━━━━  │
        └────────────────────────────────────────────────┘
```

- Bouton `(⚙)` rond 44×44 (cible tactile WCAG), même style glassmorphism que les autres FAB existants (`bg-black/60 backdrop-blur-xl border-white/15`)
- Pastille (badge) discrète en haut-droite **uniquement** si une couche non-défaut est active (ex. `boucle ON` ou `stations météo` cochée) → indique silencieusement qu'il y a un état à voir
- Icône : `SlidersHorizontal` (lucide) — sémantique "réglages d'affichage"

### Au tap (ouvert) — Bottom sheet sur mobile, popover sur desktop

**Mobile (< 768px) — Bottom sheet** qui glisse depuis le bas, hauteur `auto` max 70vh, drag-handle en haut, fermeture par swipe-down ou tap à l'extérieur. Ne masque jamais le bandeau de stats du bas.

**Desktop (≥ 768px) — Popover** ancré au FAB, largeur 280px, ouvre vers le haut-droite, fermeture au clic extérieur.

Contenu commun, structuré en 2 sections claires :

```text
┌─ Options carte ──────────────────── ✕ ┐
│                                        │
│  AJOUTER                               │ ← visible seulement si userCanCreate
│  ┌──────────────────────────────────┐ │
│  │ ⊕  Point de marche          ›    │ │ ← lance le mode création
│  │ ✦  Point intermédiaire      ›    │ │
│  └──────────────────────────────────┘ │
│                                        │
│  AFFICHER                              │
│  ┌──────────────────────────────────┐ │
│  │ ⟳  Boucle fermée         [●  ]  │ │ ← Switch (shadcn)
│  │ 🌤 Stations météo         [  ●]  │ │
│  │ 📐 Cadastre détaillé      [  ●]  │ │ ← futur, prêt à brancher
│  │ 🦋 Espèces récentes       [  ●]  │ │ ← futur
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

- **AJOUTER** : items cliquables (rows), pas des switches — déclenche une action puis ferme le sheet automatiquement (l'utilisateur revient à la carte pour placer le point). Le hint "Cliquez sur la carte…" s'affiche en haut de la carte sous forme de bandeau temporaire (pattern déjà existant dans le code).
- **AFFICHER** : `Switch` shadcn alignés à droite, label clair à gauche, icône à gauche. Toggle immédiat, pas de validation.
- Les sections vides (ex. lecteur sans droits de création) sont masquées → pas de header "AJOUTER" orphelin.
- L'item `Stations météo` apparaît dans toutes les vues carte (Géo/Sat/Relief/Cadastre).

### Micro-interactions

- Ouverture : `motion` spring `damping: 24, stiffness: 300` (cohérent avec le reste de l'app)
- Le FAB se transforme légèrement (rotation 90° de l'icône) quand le sheet est ouvert pour signaler l'état
- Haptic léger sur mobile (`navigator.vibrate(10)`) au toggle d'un switch
- Auto-close du sheet 250ms après le tap sur un item d'action (`AJOUTER`)
- Le badge sur le FAB compte le nombre de couches actives non-défaut (`2` si boucle ON + météo ON)

### Accessibilité

- `aria-expanded`, `aria-controls` sur le FAB
- Focus trap dans le sheet ouvert, `Escape` ferme
- `role="switch"` natif via shadcn Switch
- Labels explicites : "Afficher les stations météo proches"

## Implémentation technique

### Nouveau composant
`src/components/community/exploration/MapOptionsMenu.tsx`
- Props : `userCanCreate: boolean`, `marcheEventId?: string`, `explorationId: string`, `isLoop: boolean`, `onToggleLoop`, `onStartCreateMarche`, `onStartCreateWaypoint`, `layers: { weatherStations: boolean }`, `onToggleLayer(key)`
- Détection mobile via `useIsMobile()` → choix Sheet (shadcn) vs Popover (shadcn)
- Compte les couches actives pour le badge

### État des couches
- Nouveau hook léger `useMapLayers()` (zustand-like local ou simple `useState` levé dans `ExplorationCarteTab`) avec persistance `localStorage` par exploration : `mapLayers:{explorationId}` → `{ weatherStations: false, ... }`
- Pré-câblage pour futures couches (cadastre, espèces) sans refactor.

### Refacto `ExplorationCarteTab.tsx` (lignes 1418-1477)
- Supprimer la pile de 3 boutons en bas-gauche
- Remplacer par `<MapOptionsMenu …/>` au même emplacement
- Le bandeau-hint "Cliquez sur la carte…" pour la création reste (déjà présent), juste déplacé en haut centre

### Couche stations météo (préparation seulement, branchement réel hors-scope)
- Ajouter un layer Leaflet conditionnel `{layers.weatherStations && <WeatherStationsLayer marcheEventId={…} />}` — composant à créer dans une étape ultérieure quand le data-source sera décidé. Pour cette itération, on câble juste le toggle qui ne fait rien visuellement (ou affiche un toast "Bientôt disponible").

## Hors scope

- Implémentation réelle de la couche stations météo (data + markers Leaflet) → tâche suivante
- Couches cadastre détaillé / espèces récentes (juste prévues dans la structure)
- Refonte des autres FAB (photo GPS, géoloc) — restent en bas-droite

## Fichiers touchés

- ➕ `src/components/community/exploration/MapOptionsMenu.tsx` (nouveau)
- ➕ `src/hooks/useMapLayers.ts` (nouveau, léger)
- ✏️ `src/components/community/exploration/ExplorationCarteTab.tsx` (lignes 1418-1477 + injection du layer)
