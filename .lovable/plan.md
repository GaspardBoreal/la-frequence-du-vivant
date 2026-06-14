# Navigation horizontale au-dessus du Kanban

## Problème
Sur `/admin/crm/pipeline`, la scrollbar native n'apparaît qu'en bas du board (souvent hors écran selon la hauteur). Avec 6+ colonnes, naviguer latéralement est pénible : il faut scroller jusqu'en bas, ou utiliser shift+molette (non découvrable).

## Solution UX proposée — barre de navigation sticky

Une **PipelineNavigator** placée **au-dessus du board**, sticky en haut de la zone scrollable. Elle combine 3 affordances complémentaires :

### 1. Flèches latérales `‹` `›`
Boutons ronds aux extrémités, désactivés en bout de course, qui font scroller d'une largeur de colonne (~320px) avec `scrollBy({ behavior: 'smooth' })`.

### 2. Mini-map de colonnes (cœur du design)
Une rangée compacte de pastilles, une par colonne du pipeline. Chaque pastille affiche :
- le point de couleur du statut (réutilise `KANBAN_COLUMNS[i].color`)
- le nom court ("À contacter", "Relance 1"…)
- un badge avec le compte d'opportunités

Comportements :
- **Clic** → scroll-into-view doux sur la colonne correspondante (centrée).
- **Active state** → la/les colonnes actuellement visibles dans le viewport sont surlignées (détection via `IntersectionObserver` sur chaque `KanbanColumn`).
- **Drag&drop friendly** → en survolant une pastille pendant un drag d'opportunité, on auto-scrolle vers cette colonne (bonus, simple à activer plus tard).

### 3. Indicateur de progression
Fine barre sous la mini-map qui reflète la position de scroll (`scrollLeft / (scrollWidth - clientWidth)`), façon "scroll progress". Donne un repère visuel immédiat.

```text
┌──────────────────────────────────────────────────────────────┐
│ ‹  ● À contacter (0)  ● Relance 1 (0)  ● Relance 2 (0) …  › │
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────────────────────┘
[ À contacter ] [ Relance 1 ] [ Relance 2 ] [ Relance 3 ] …
```

### Bonus low-cost
- **Raccourcis clavier** `←` / `→` quand le board a le focus → scroll d'une colonne.
- **Shift + molette** déjà natif sur le conteneur (rien à faire, juste hint visuel "↔ glisser pour naviguer" la 1re fois via `localStorage`).
- **Masquer la scrollbar du bas** (`scrollbar-thin` ou `scrollbar-hide`) puisque la navigation du haut la remplace avantageusement — ou la garder fine et discrète.

## Implémentation

### Fichiers à créer
- `src/components/crm/PipelineNavigator.tsx` — barre sticky (flèches + mini-map + progress).

### Fichiers à modifier
- `src/components/crm/KanbanBoard.tsx`
  - Extraire le `<div className="flex gap-4 overflow-x-auto…">` dans une `ref` (`scrollRef`).
  - Ajouter au-dessus `<PipelineNavigator scrollRef={scrollRef} columns={KANBAN_COLUMNS} counts={opportunitiesByStatus} />`.
  - Donner un `id={`col-${column.id}`}` à chaque `KanbanColumn` (ou wrapper) pour le scroll-into-view + IntersectionObserver.
  - Handler clavier `←/→` sur le board.
- `src/components/crm/KanbanColumn.tsx` — accepter un `id` HTML pour la cible scroll.

### Détails techniques
- Détection des colonnes visibles : un seul `IntersectionObserver` (root = `scrollRef.current`, threshold ~0.5) → set d'IDs actifs → styling des pastilles.
- Progress bar : `onScroll` du conteneur met à jour un state throttlé (`requestAnimationFrame`).
- Aucune dépendance nouvelle, full Tailwind + design tokens existants (`bg-primary`, `border`, `bg-muted`).
- Responsive : sur mobile la mini-map devient elle-même scrollable horizontalement (overflow-x-auto) avec les flèches qui restent fixes.

## Hors-scope
Pas de changement aux cartes, au DnD, ni à la logique métier — uniquement de la navigation/UX.
