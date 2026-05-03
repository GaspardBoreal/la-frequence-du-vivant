## Problèmes constatés

Après clic sur **Soumettre** dans la fenêtre « REPOSITIONNEMENT — APERÇU LOCAL » :

1. La popup Leaflet du point de marche reste ouverte et masque la carte.
2. Le nouveau pourtour cadastral n'est pas (ou mal) dessiné : `GpsEditOverlay` se contente de l'éventuel `_raw.cadastre.shape` renvoyé par LEXICON au point cliqué, qui est souvent absent. Aucun appel à `cadastre-proxy` n'est fait pour récupérer la vraie géométrie de la parcelle correspondant au nouveau lat/lng.

## Correctifs proposés

### 1. Fermer la popup à la soumission (`ExplorationCarteTab.tsx`)

- Conserver une `Map<string, L.Marker>` via `ref` callback sur chaque `<Marker>` des étapes (clé = `marche.id`).
- Au moment où `setGpsEditPointId(marche.id)` est déclenché par le bouton « Repositionner », fermer immédiatement la popup associée : `markerRefs.current.get(id)?.closePopup()`.
- En complément, dans `GpsEditOverlay`, après une soumission réussie (preview prêt), appeler `map.closePopup()` via un `useMap()` interne pour garantir qu'aucune popup résiduelle ne reste ouverte sur la carte.

### 2. Dessiner robustement le pourtour preview

Mettre à niveau `GpsEditOverlay.tsx` pour utiliser exactement la même chaîne de résolution que `CadastreLayer` :

```text
LEXICON (lat,lng) ──► parcel_id ──► cadastre-proxy ──► Polygon GeoJSON
                              └──► fallback _raw.geolocation.shape
                              └──► fallback _raw.cadastre.shape
                              └──► fallback geometry brute
```

Concrètement :

- Ajouter un nouveau hook `useLexiconParcelWithGeometryAt(lat, lng, enabled)` dans `useLexiconParcels.ts` qui :
  - exécute `useLexiconParcelAt`
  - puis un second `useQuery` `['cadastre-geometry', parcelId]` (réutilise `fetchParcelGeometryById`) avec `retry: 2` et throw-on-null (cohérent avec `useLexiconParcelsWithGeometry`).
  - retourne `{ lexicon, geometry, isFetching, isError }`.
- Dans `GpsEditOverlay` :
  - remplacer l'appel actuel par ce nouveau hook.
  - dans le `useEffect`, calculer `geometry = realGeom || _raw.geolocation.shape || _raw.cadastre.shape || geometry` avant `onPreview(...)`.
  - garder le bouton « Soumettre » dans l'état chargement tant que la géométrie n'est pas résolue (afficher `Loader2` jusqu'à preview non null ou erreur).
  - en cas d'échec définitif (`isError` après retries), afficher un message « Aucune parcelle cadastrale trouvée à cet emplacement » au lieu de fermer.

### 3. Centrage sur la nouvelle géométrie (UX)

Une fois la preview reçue, dans `GpsEditOverlay` (qui a accès à `useMap()`), appeler `map.fitBounds(L.geoJSON(geometry).getBounds(), { maxZoom: 18, padding: [40,40] })` pour que le nouveau contour bleu pointillé soit immédiatement visible.

### 4. Robustesse & nettoyage

- Annuler la preview (`onPreview(null)`) si l'utilisateur déplace à nouveau le marqueur après soumission (effet sur `lat/lng` qui réinitialise `submitted`).
- Pas de modification du `CadastreLayer` (déjà capable d'afficher `previewGeometry` au-dessus).

## Fichiers modifiés

- `src/components/cadastre/GpsEditOverlay.tsx` — hook étendu, fermeture popup, fitBounds, états de chargement.
- `src/components/cadastre/useLexiconParcels.ts` — ajout `useLexiconParcelWithGeometryAt`.
- `src/components/community/exploration/ExplorationCarteTab.tsx` — `markerRefs` + fermeture popup au clic sur « Repositionner ».

## Hors scope

- Persistance en base du nouveau lat/lng (toujours preview local uniquement, conformément à l'overlay actuel).
