## Diagnostic

En vue Cadastre, les parcelles sont rendues comme polygones GeoJSON Leaflet. Par défaut Leaflet **absorbe** les clics sur ces polygones et n'émet pas l'event `click` au niveau de la map — c'est pour ça que `CadastreTapCapture` (qui écoute `useMapEvents({ click })`) ne se déclenche jamais quand on clique pile sur une parcelle. Le clic n'aboutit que sur les zones sans parcelle (tuile de fond visible).

## Proposition

Quand le mode "Ajouter un point" est actif, faire en sorte que **les parcelles laissent passer le clic** jusqu'à la map, sans casser leur fonction normale (popup d'info parcelle quand on n'est pas en mode ajout).

Deux options possibles :

**Option A — Forwarder le clic (recommandée)**  
On garde les parcelles cliquables (popup parcelle conservé visuellement), mais en mode tap on attache un handler `click` sur chaque GeoJSON qui :
- récupère `e.latlng`
- empêche le popup parcelle de s'ouvrir
- appelle `onPick(lat, lng)` exactement comme un clic carte

→ Avantage : 0 changement visuel, le curseur reticule reste, et le clic "atterrit" exactement où l'utilisateur visait, même au centre d'une parcelle.

**Option B — Désactiver l'interactivité des parcelles en mode tap**  
Passer `interactive: false` aux GeoJSON tant que `isCadastreTapMode` est vrai. Plus simple mais on perd temporairement le hover/popup parcelle pendant la création.

Je recommande **A** : plus fluide, l'utilisateur garde le feedback visuel des parcelles.

## Mise en œuvre (Option A)

1. **`CadastreLayer.tsx`** — Ajouter deux props optionnelles :
   - `tapMode?: boolean`
   - `onTapLatLng?: (lat: number, lng: number) => void`
   
   Sur chaque `<GeoJSON>` (parcelles + preview), brancher `eventHandlers={{ click: (e) => { if (tapMode && onTapLatLng) { L.DomEvent.stopPropagation(e); onTapLatLng(e.latlng.lat, e.latlng.lng); } } }}`. Quand `tapMode` est faux, comportement actuel inchangé (popup parcelle).

2. **`ExplorationCarteTab.tsx`** — Passer les deux props à `<CadastreLayer>` :
   ```tsx
   tapMode={isCadastreTapMode && !isCreatingMarche}
   onTapLatLng={handleCadastreTap}
   ```
   `CadastreTapCapture` reste en place pour capturer les clics **hors parcelle**.

3. **Curseur reticule sur les parcelles** — Quand `tapMode` est actif, ajouter `className="cadastre-tap-cursor"` sur les GeoJSON et une règle CSS globale `.cadastre-tap-cursor { cursor: crosshair !important; }` pour que le reticule s'affiche aussi en survolant une parcelle (sinon Leaflet remet `cursor: pointer`).

## Hors scope

- Pas de changement du drawer de création ni du flow de collecte biodiversité.
- Pas de modification du comportement hors mode tap (popup parcelle conservé).
