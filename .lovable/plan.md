## Objectif

Permettre à l'utilisateur de masquer ou afficher les points intermédiaires de la carte d'exploration depuis le panneau « Options carte », avec un état **caché par défaut** pour épurer la lecture du tracé.

## Comportement UX

- Section **Afficher** : ajout d'une nouvelle ligne « **Points intermédiaires** » placée juste sous **Boucle fermée** (logique : ce sont deux options structurelles du tracé, avant les couches contextuelles météo / cadastre / espèces).
- État par défaut : **OFF** (les points intermédiaires sont masqués au premier chargement).
- L'état est mémorisé par exploration via `localStorage` (cohérent avec les autres couches).
- Sous-titre dynamique : 
  - OFF → « Tracé épuré (points masqués) »
  - ON → « X points affichés sur la carte » (compteur live)
- Le toggle masque à la fois :
  - Les **marqueurs étoilés ambrés** des waypoints
  - Leur **prise en compte dans le tracé de la polyline** (la ligne redevient un trait direct entre points de marche numérotés)
- Le **badge de compteur** du bouton « Options carte » prend en compte cette nouvelle couche quand elle est active.

## Design (cohérent avec l'existant)

- Icône : `Sparkles` (Lucide) — même symbole que pour la création d'un point intermédiaire (cohérence visuelle entre « créer » et « afficher »).
- Couleur : palette **ambre** (`bg-amber-500/15 border-amber-400/30 text-amber-200`) pour signaler que c'est l'écho visuel des points intermédiaires (qui sont déjà ambrés sur la carte).
- Réutilisation du composant `LayerRow` existant — zéro duplication, transitions et hover déjà gérés.
- Toast léger « Points intermédiaires affichés / masqués » au changement (optionnel, en utilisant `sonner` déjà importé) pour confirmer l'action sans interrompre.

## Fichiers à modifier

```text
src/hooks/useMapLayers.ts
  - Ajout de `showWaypoints: boolean` dans MapLayersState
  - DEFAULTS.showWaypoints = false
  - migrate() : valeur par défaut false si absente
  - activeCount inclut +1 si showWaypoints

src/components/community/exploration/MapOptionsMenu.tsx
  - Nouvelle prop optionnelle `waypointsCount?: number`
  - Nouveau LayerRow « Points intermédiaires » (icône Sparkles ambrée)
    inséré juste après « Boucle fermée »

src/components/community/exploration/ExplorationCarteTab.tsx
  - Remplacer `useState(true)` du `showWaypoints` local
    par la valeur dérivée de `mapLayers.showWaypoints`
  - Passer `waypointsCount={waypoints.length}` au menu
  - Brancher onToggle sur toggleMapLayer('showWaypoints')
  - Mettre à jour le calcul du badge count
```

## Notes techniques

- Le state local actuel `showWaypoints` (ligne 626) est supprimé au profit du store persistant `useMapLayers` — un seul source of truth.
- La migration `migrate()` garantit que les utilisateurs existants ayant déjà un `mapLayers` en localStorage récupèrent `showWaypoints: false` automatiquement.
- Aucun changement backend, purement UI/state local.
