

## Ajouter un onglet "Carte" à l'admin des marches

### Résumé

Ajouter un 8ème onglet "Carte" dans la barre d'onglets de `/admin/marches` qui affiche une carte Leaflet interactive des marches correspondant aux filtres actifs.

### Modifications

**1. Nouveau composant : `src/components/admin/MarcheMapView.tsx`**

Carte Leaflet interactive recevant `marches: MarcheTechnoSensible[]` en props :
- Filtrer les marches ayant des coordonnées valides (lat/lng ≠ 0)
- Auto-zoom via `fitBounds()` sur l'ensemble des points affichés
- Boutons zoom +/- natifs de Leaflet (zoomControl activé)
- Marqueurs personnalisés (icône verte thématique, cohérente avec le design dark existant)
- Popup sur chaque marqueur contenant :
  - Nom de la marche (ou ville si pas de nom)
  - Ville
  - 3 liens : Google Maps, Google Earth, OpenStreetMap (icônes + liens `target="_blank"`)
- Message informatif si aucune marche n'a de coordonnées GPS

**2. Fichier modifié : `src/pages/MarcheAdmin.tsx`**

- Import du nouveau composant `MarcheMapView`
- `TabsList` passe de `grid-cols-7` à `grid-cols-8`
- Ajout d'un `TabsTrigger value="map"` avec libellé "Carte"
- Ajout d'un `TabsContent value="map"` passant `filteredMarches` au composant

### Détails techniques

- Réutilise `leaflet` + `react-leaflet` déjà installés (cf. `InteractiveStationMap.tsx`)
- `fitBounds` avec `padding: [50, 50]` et `maxZoom: 15` pour un cadrage intelligent
- Liens popup :
  - Google Maps : `https://www.google.com/maps?q={lat},{lng}`
  - Google Earth : `https://earth.google.com/web/@{lat},{lng},500a,1000d,35y,0h,0t,0r`
  - OpenStreetMap : `https://www.openstreetmap.org/?mlat={lat}&mlon={lng}#map=15/{lat}/{lng}`
- Hauteur de la carte : `h-[600px]` pour une visualisation confortable
- Design cohérent : fond du popup sobre, texte lisible, liens avec icônes `ExternalLink`

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Créer | `src/components/admin/MarcheMapView.tsx` |
| Modifier | `src/pages/MarcheAdmin.tsx` |

