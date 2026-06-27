## Diagnostic

Le câblage « tap cadastre » est **incomplet** dans `CadastreLayer.tsx` :

- `tapMode` et `onTapLatLng` sont déclarés dans l'interface mais **jamais destructurés** (ligne 36) → ignorés silencieusement.
- Chaque `<GeoJSON>` parcelle contient un `<ParcelPopup>` qui **bind un popup Leaflet** sur la feature. Au clic, Leaflet ouvre ce popup et **ne propage pas l'event** à la `MapContainer` → le `useMapEvents` de `CadastreTapCapture` ne reçoit jamais rien.
- Aucun `eventHandlers={{ click }}` n'est posé sur les `<GeoJSON>`, donc même si on voulait forwarder, on ne le fait pas.
- Côté `ExplorationCarteTab.tsx`, `tapMode` est bien passé mais `onTapLatLng` n'est **pas branché**.

Résultat observé (copie 3) : le clic sur la parcelle ouvre la fiche cadastre au lieu de poser un point, et le curseur reste en `pointer` (forcé par Leaflet sur les polygones interactifs).

## Plan de résolution

### 1. `src/components/cadastre/CadastreLayer.tsx`
- Destructurer `tapMode` et `onTapLatLng` dans la signature.
- En mode `tapMode` :
  - **Ne pas rendre** `<ParcelPopup>` (sinon Leaflet absorbe le clic).
  - Poser `eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onTapLatLng?.(e.latlng.lat, e.latlng.lng); } }}` sur chaque `<GeoJSON>` (parcelles + preview).
  - Surcharger le style : `fillOpacity` 0.15, `cursor: crosshair` via une `className` Leaflet appliquée au pane.
- Hors `tapMode` : comportement actuel inchangé (popup riche).

### 2. `src/components/community/exploration/ExplorationCarteTab.tsx`
- Passer `onTapLatLng={(lat, lng) => { setIsCadastreTapMode(false); setCreatingMarcheLatLng({ lat, lng }); setIsCreatingMarche(true); }}` à `<CadastreLayer>` (réutiliser la même logique que `CadastreTapCapture`, factorisée dans un handler unique `handleTapAddPoint`).
- Garder `CadastreTapCapture` pour les clics **hors parcelle** (zones grises de la carte). Les deux chemins convergent vers `handleTapAddPoint`.

### 3. `src/index.css`
- Étendre `.cadastre-tap-cursor` au pane `cadastre-parcels` (`.leaflet-pane.cadastre-tap-cursor path { cursor: crosshair !important; }`) pour neutraliser le `pointer` que Leaflet force sur les SVG interactifs.

### Détails techniques

- `L.DomEvent.stopPropagation` évite un double déclenchement (parcelle + map). Sans popup attaché, l'event arrive proprement sur le handler React.
- Le re-render conditionnel du `<ParcelPopup>` (présent / absent selon `tapMode`) force Leaflet à dé-binder le popup → plus d'absorption de clic.
- Le zoom reste préservé grâce au `FitBounds` déjà durci (signature de contenu + respect interaction utilisateur) — aucun changement nécessaire.

### Validation
- Cadastre + zoom manuel → clic « Ajouter un point » → curseur réticule sur parcelle ET hors parcelle → clic dépose le marqueur et ouvre le drawer, sans afficher la fiche cadastre.
- Hors mode tap : la fiche cadastre s'ouvre normalement au clic.
