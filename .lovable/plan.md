## Problème

En mode "Choisir les 2 points sur la carte", cliquer sur l'étape 8 ouvre son popup ("DEVIAT Point 07…") au lieu d'enregistrer le 1ᵉʳ point voisin. Le bandeau "Cliquez sur le 1ᵉʳ point voisin…" reste donc bloqué.

**Cause racine** : les `CircleMarker` cyan du mode pick (lignes 1049-1082) sont rendus **avant** les `Marker` numérotés des étapes (lignes 1100+) et avant les `WaypointMarker`. Leaflet empile les couches dans l'ordre de création — les marqueurs numérotés captent donc le clic en premier et déclenchent leur popup. Le `handlePickEndpoint` n'est jamais appelé.

## Solution proposée

**1. Forcer la priorité des halos cyan en mode pick**

Déplacer le bloc des `CircleMarker` cyan (`pickMode && pendingWaypoint && …`) **après** le rendu des marqueurs numérotés et des `WaypointMarker`, et leur attribuer un `pane` Leaflet dédié avec un `zIndex` élevé (ex. créer un pane `pick-overlay` à `zIndex: 650` dans un `useEffect` au montage de la carte).

**2. Neutraliser les popups pendant le pick**

Quand `pickMode` est actif :
- Passer une prop `disablePopup` aux marqueurs numérotés (étapes) et à `WaypointMarker` qui empêche l'ouverture du popup et propage le clic vers le halo (`L.DomEvent.stopPropagation` désactivé, ou simplement `eventHandlers.click` qui appelle `handlePickEndpoint` avec les coordonnées du marqueur sous-jacent).
- Alternative plus simple et plus robuste : **router le clic du marqueur lui-même** vers `handlePickEndpoint` quand `pickMode` est actif, au lieu de s'appuyer sur les `CircleMarker` cyan. Les halos cyan ne servent alors qu'au feedback visuel (`interactive: false` sur leur `pathOptions`).

**3. Feedback amélioré**

- Dès que `pickedA` est défini, le bandeau passe à "Cliquez sur le 2ᵈ point voisin" (déjà fait) + ajout d'un toast court "Point 1 sélectionné : étape 8".
- Bouton "Annuler" reste accessible.
- Si le 2ᵈ point cliqué est identique au 1ᵉʳ → toast d'erreur "Choisissez un point différent".
- Si aucune candidate ne correspond aux 2 IDs → toast "Ces 2 points ne sont pas adjacents dans le tracé proposé".

## Fichiers à modifier

- `src/components/community/exploration/ExplorationCarteTab.tsx`
  - Créer pane `pick-overlay` (zIndex 650).
  - Réordonner le bloc pick après les marqueurs numérotés/waypoints, ou router le clic des marqueurs vers `handlePickEndpoint` en mode pick.
  - Ajouter toasts de feedback.
- `src/components/community/exploration/WaypointMarker.tsx` : prop `pickMode?: { onPick: () => void }` qui remplace le comportement par défaut du clic.
- Marqueurs étape numérotés : même traitement (intercepter `click` quand `pickMode` actif).

## Approche recommandée

L'option **"router le clic du marqueur vers handlePickEndpoint"** (point 2 alt.) est la plus fiable : pas de dépendance au z-order Leaflet, pas de pane custom, comportement déterministe sur mobile et desktop. Les halos cyan deviennent purement décoratifs (`interactive: false`).