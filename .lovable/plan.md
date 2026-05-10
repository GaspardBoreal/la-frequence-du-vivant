# Auto-zoom adaptatif sur la carte d'exploration

## Problème

Dans `ExplorationCarteTab.tsx`, le composant `FitBounds` applique systématiquement :

```ts
map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
```

Quand la marche tient dans ~77 m (cas DEVIAT 11.03.26 — 4 étapes très rapprochées), Leaflet refuse de dépasser le zoom 13 → on voit un seul marker fusionné au centre d'une vue régionale, alors qu'il faudrait un zoom ~18 pour distinguer les étapes (cas copie 2).

À l'inverse, pour des marches étalées sur plusieurs km, le `maxZoom: 13` est juste, et plafonner à 18 dans tous les cas casserait l'autre cas.

## Correctif — `maxZoom` adaptatif

Calculer la **diagonale des bounds en mètres** et choisir un `maxZoom` cohérent :

| Diagonale  | maxZoom |
|------------|---------|
| < 150 m    | 18      |
| < 500 m    | 17      |
| < 2 km     | 16      |
| < 10 km    | 14      |
| ≥ 10 km    | 13      |

Implémentation dans `FitBounds` (lignes 259-268) :

```ts
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));

    // Diagonale en mètres
    const diag = bounds.getNorthWest().distanceTo(bounds.getSouthEast());

    let maxZoom = 13;
    if (diag < 150) maxZoom = 18;
    else if (diag < 500) maxZoom = 17;
    else if (diag < 2000) maxZoom = 16;
    else if (diag < 10000) maxZoom = 14;

    // Cas dégénéré : 1 seul point ou points confondus → distanceTo ≈ 0
    if (positions.length === 1 || diag < 1) {
      map.setView(positions[0], 17, { animate: true });
      return;
    }

    map.fitBounds(bounds, { padding: [40, 40], maxZoom });
  }, [positions, map]);
  return null;
}
```

## Bénéfices

- **Marche serrée (DEVIAT 77 m)** → zoom 18, étapes lisibles individuellement (cas copie 2).
- **Marche moyenne (1-2 km)** → zoom 16, vue tactique avec contexte.
- **Marche étalée (>10 km)** → zoom 13, vue d'ensemble (comportement actuel préservé).
- **Étape unique / points confondus** → centrage à zoom 17.

## Hors scope

- Pas de changement de UI/contrôles.
- Pas de modification des autres `fitBounds` du projet (ils ont leurs propres contextes).
- Pas de migration DB.

## Validation

1. Ouvrir DEVIAT 11.03.26 → carte zoomée serrée, 4 étapes distinctes visibles.
2. Ouvrir une marche étalée (Dordogne complète) → vue régionale conservée.
3. Ouvrir une exploration avec 1 seule étape → centrée, zoom 17.
