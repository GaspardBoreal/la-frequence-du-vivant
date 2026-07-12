## Deux corrections sur la vue Timeline

### 1. Tri par date (asc ↔ desc, défaut = décroissante)

Dans `src/components/carte-mdv/views/TimelineView.tsx` :
- Ajouter un état local `sortOrder: 'desc' | 'asc'` (défaut `'desc'`, non persisté — c'est un choix d'affichage local, pas un filtre URL).
- Trier `sorted` selon `sortOrder`.
- Ajouter en haut à droite de la vue un petit sélecteur segmenté sobre (2 boutons "Plus récentes d'abord" / "Plus anciennes d'abord") avec `<ToggleGroup>` shadcn ou 2 `<Button variant="ghost">` selon convention du fichier voisin. Icônes `ArrowDownWideNarrow` / `ArrowUpWideNarrow` de lucide.

### 2. Badge « dans N j » aligné à droite du type de marche

Aujourd'hui, dans `TimelineView.tsx` le badge est en `position:absolute -top-2 left-3` : il flotte hors de la carte et **chevauche** le badge « Éco tourisme » (visible copie d'écran).

Cible : les deux badges sur la **même ligne horizontale** à l'intérieur de la carte, type à gauche, compteur "dans N j" à droite.

Approche : ajouter une prop optionnelle `rightBadge?: React.ReactNode` sur `EventCard`. Dans `EventCard.tsx`, envelopper le badge de type dans un `<div className="flex items-center justify-between gap-2">` :
- gauche : `<Badge>{type}</Badge>` (existant)
- droite : `{rightBadge}` s'il est fourni

Le badge de type est rendu à 2 endroits :
- ligne 62-67 (cas sans cover image) → wrapper flex
- ligne 46-51 (cas avec cover image, badge en overlay `absolute left-2 top-2`) → dans ce cas, positionner `rightBadge` en overlay symétrique `absolute right-2 top-2` (déjà utilisé pour "N espèces" — on cumule verticalement avec `top-9` si `species_count > 0`, sinon `top-2`)

Dans `TimelineView.tsx` :
- Retirer le `<div className="absolute -top-2 left-3 …">`
- Passer le badge en prop : `<EventCard event={e} rightBadge={daysAway >= 0 && daysAway <= 90 ? <Badge>…</Badge> : null} />`
- Style du badge : compact, cohérent avec les autres (`rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5` + icône `Clock` optionnelle)

### Fichiers modifiés
- `src/components/carte-mdv/views/TimelineView.tsx` — tri + toggle + passage prop
- `src/components/carte-mdv/EventCard.tsx` — prop `rightBadge` + réagencement du wrap du badge de type

Aucun backend, aucun autre écran impacté (la prop est optionnelle).
