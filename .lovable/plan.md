# Bulles toujours visibles sur la carte du Pipeline

## Problème observé

Sur `/admin/crm/pipeline?view=map`, la vignette (~260×210 px) survolée sur un point proche d'un bord de la carte est **tronquée** (haut, droite, gauche…). Cas reproductible : un seul point filtré près du bord supérieur.

Causes dans `CrmCompaniesMap.tsx` :

1. `Tooltip direction="top"` est **figé** — Leaflet ne bascule pas vers le bas/côté quand il manque de place.
2. `fitBounds(..., padding: [40, 40])` ne réserve pas assez de marge pour la taille réelle de la vignette pipeline.
3. Aucun **auto-pan** : ni au survol, ni au clic — donc même avec un flip, une vignette de 260 px peut déborder.

## Solution (3 couches, complémentaires et robustes)

### 1. Tooltip auto-flip (Leaflet natif)

Remplacer `direction="top"` par `direction="auto"` sur le `<Tooltip>` de `CrmCompaniesMap`. Leaflet choisit alors top/bottom/left/right selon la place disponible dans le conteneur. Ajuster `offset` pour rester joli quel que soit le sens (offset symétrique `[0, -16]` + recalage CSS sur `.leaflet-tooltip-top/bottom/left/right`).

### 2. Padding `fitBounds` calibré sur la taille de la vignette

Exposer une nouvelle prop `fitPadding?: [number, number]` sur `CrmCompaniesMap` (défaut `[40, 40]`). `PipelineMapView` passera `[140, 80]` (≈ hauteur/largeur max d'une vignette pipeline + marge). Garantit qu'aucun pin filtré ne se retrouve collé au bord après auto-zoom.

### 3. Auto-pan au survol (filet de sécurité)

Ajouter dans `CrmCompaniesMap` un handler `mouseover` sur chaque `Marker` qui :

- calcule la `containerPoint` du marker,
- vérifie si un rectangle vignette (260×210, marge 12 px) tient autour selon la direction choisie,
- si non : `map.panBy([dx, dy], { animate: true, duration: 0.25 })` pour rapatrier juste ce qu'il faut.

C'est l'équivalent de l'`autoPan` des Popup, appliqué aux tooltips. Aucune dépendance ajoutée, calcul ~10 lignes via `map.getSize()` + `latLngToContainerPoint`.

### Bonus cohérence

- Même traitement appliqué à la **sélection** (clic) : `FlyToSelected` reçoit aussi un `tooltipSize` pour décaler la destination si nécessaire (déjà partiellement fait via `flyOffsetX`, on étend en Y).
- Pas de changement visuel/UX sur l'annuaire qui utilise déjà ce composant — comportements activés via props optionnelles avec defaults rétro-compatibles.

## Vérifications

- 1 point isolé en haut/bas/gauche/droite de la carte : vignette toujours intégralement visible après survol.
- 2 points filtrés (cas de la copie d'écran) : `fitPadding` réserve la place ; vignette flip vers le bas si pin trop haut.
- Vue annuaire (`CrmCompanies`) inchangée car props optionnelles avec fallback ancien comportement.

## Fichiers à modifier

- `src/components/crm/CrmCompaniesMap.tsx` — `direction="auto"`, prop `fitPadding`, handler `mouseover` auto-pan, CSS tooltip pour les 4 directions.
- `src/components/crm/pipeline/PipelineMapView.tsx` — passe `fitPadding={[140, 80]}` à `<CrmCompaniesMap>`.