# Vue « Place trophique » plein écran — refonte

## Objectif
Remplacer le `Sheet` bottom 92vh par un vrai modal plein écran centré, ajouter une sidebar droite rétractable pour accueillir les futures fonctionnalités (détails espèce, qui mange / mangé par, chatbot), et harmoniser le clic Constellation avec Spirale/Réseau.

## Périmètre fichier
- `src/components/biodiversity/species-modal/SpeciesTrophicPosition.tsx` — refonte du bloc « Fullscreen overlay »
- 3 nouveaux composants dans `src/components/biodiversity/species-modal/trophic-fullscreen/`
  - `TrophicFullscreenModal.tsx` — shell modal (Dialog) + layout
  - `TrophicSidebar.tsx` — sidebar droite rétractable avec onglets
  - `TrophicSpeciesDetailPanel.tsx` — fiche de l'espèce sélectionnée (placeholder extensible)

## Architecture cible

```text
+----------------------------------------------------------+
| Header : PLACE TROPHIQUE — Étourneau sansonnet [L3] [X] |
+--------------------------------------------+-------------+
|  Tabs : Constellation | Spirale | Réseau   | ▶ (toggle) |
+--------------------------------------------+-------------+
|                                            |  Sidebar    |
|         Canvas trophique                   |  (320 px)   |
|         (vue active, plein espace)         |  Onglets :  |
|                                            |  • Détails  |
|                                            |  • Mange    |
|                                            |  • Mangé par|
|                                            |  • Chat     |
+--------------------------------------------+-------------+
```

- Sidebar rétractable via bouton flèche, état persistant en `useState` (par défaut ouverte sur ≥1280 px, fermée en dessous).
- Canvas occupe `flex-1`, sidebar `w-[320px]` quand ouverte, `w-0` (ou bouton flottant) quand fermée — transition `300ms`.
- Au-dessous de `md`, la sidebar bascule en drawer bas (Sheet) pour préserver l'espace canvas mobile.

## 1. Modal plein écran
- Remplacer `Sheet side="bottom" h-[92vh]` par un `Dialog` (shadcn) avec `DialogContent` custom :
  - `fixed inset-0 w-screen h-screen max-w-none rounded-none p-0`
  - Fond `bg-background/98 backdrop-blur-xl`
  - Animation entrée : `animate-scale-in` + `animate-fade-in` (combiné `enter`)
- Conserver `VisuallyHidden` `DialogTitle` pour l'accessibilité.
- Fermeture : croix actuelle (déjà bien stylée) en haut à droite + touche Échap (gérée par Dialog).

## 2. Clic espèce Constellation (drawer espèce)
Aujourd'hui les 3 vues utilisent un `selected` interne qui affiche un panneau **sous** le canvas — invisible quand le canvas remplit l'écran.

Solution :
- Ajouter une prop optionnelle `onSpeciesSelect?: (s) => void` aux 3 tabs (`ConstellationTab`, `SpiraleTab`, `ReseauTab`).
- Dans le modal plein écran, intercepter la sélection et la pousser dans la sidebar (onglet **Détails** activé automatiquement, focus visuel sur l'espèce).
- Conserver le comportement actuel (panneau interne) quand `onSpeciesSelect` n'est pas fourni → aucune régression dans la vue compacte.
- Effet visuel commun aux 3 vues : halo pulsant sur l'espèce sélectionnée (déjà présent pour `highlightScientificName`, on étend au `selected`).

## 3. Sidebar — contenu initial
Onglets (Tabs shadcn) :
1. **Détails** — fiche compacte (nom, niveau trophique chip, rationale, mini-carrousel photo si dispo). Réutilise `<SpeciesName />` et tokens trophiques.
2. **Mange** — placeholder « Bientôt » + liste dérivée de `probablePreyGroups` (déjà dans `trophicClassification.ts`) filtrée sur `speciesPool`.
3. **Mangé par** — symétrique : espèces du pool dont la proie probable inclut l'espèce.
4. **Chat** — placeholder avec bouton « Ouvrir le chat » qui dispatche le `CustomEvent` existant (cf. mémoire `species-card-carousel-and-chat-logic`) avec contexte trophique.

Le panneau « Pourquoi ce niveau ? » (actuellement en bas du scroll) migre dans l'onglet **Détails**.

## 4. Effets visuels (niveau 3 — équilibré)
- Transition d'ouverture : fade + scale 0.96 → 1 (250 ms)
- Bascule entre vues : `AnimatePresence` existant, conservé
- Sidebar : slide-in-right / slide-out-right au toggle
- Halo pulsant sur l'espèce sélectionnée dans Constellation (existant pour highlight, étendu)
- Pas de particules ni parallax — on reste dans la Sobriété Informationnelle

## 5. Responsive
- ≥1280 px : sidebar ouverte par défaut
- 768–1279 px : sidebar fermée par défaut, bouton flottant pour l'ouvrir
- <768 px : sidebar en Sheet bottom (l'expérience mobile reste 1 vue à la fois)

## Détails techniques
- État `selectedSpecies` remonte de tab → modal (lift state up via prop `onSpeciesSelect`).
- État `sidebarOpen` local au modal, initialisé via `useMediaQuery('(min-width: 1280px)')` (hook simple inline).
- Aucun changement de logique trophique (`useTrophicChain`, `trophicClassification.ts`) — uniquement présentation.
- Composants nouveaux pèsent ~120 lignes chacun, on évite de gonfler `SpeciesTrophicPosition.tsx`.
- Z-index : modal `z-50`, sidebar interne au modal (pas de conflit).

## Hors-scope (itérations suivantes)
- Implémentation réelle du chatbot trophique (placeholder cliquable pour démarrer)
- Données enrichies « régime alimentaire » au-delà de `probablePreyGroups` (nécessiterait une KB séparée)
- Persistance de la préférence sidebar ouverte/fermée (localStorage)
