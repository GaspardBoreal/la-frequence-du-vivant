# Carte des sondes — option « Cadastre »

Aujourd'hui la carte des sondes utilise ses propres fonds de carte maison (`Plan` = tuiles OSM brutes, `Satellite` = Esri) via un simple `TileLayer`. Le fond « Plan » n'affiche donc aucune parcelle cadastrale, contrairement à Mon espace → Carte.

## Ce qui change

- Le bouton « Plan » est renommé **« Cadastre »**.
- Il affiche exactement le même rendu que Mon espace → Carte : fond OSM + surcouche des tuiles cadastrales Etalab + tracé des parcelles cadastrales autour des sondes (contours, numéros, surfaces).
- Le fond « Satellite » garde son comportement, mais bénéficie au passage du relais IGN/Esri anti-écran-noir et du super zoom (jusqu'à z22) déjà utilisés ailleurs.
- Les parcelles se chargent autour des positions réelles des sondes affichées (filtres inclus), pas seulement au centre de la carte.

## Détails techniques

Dans `src/components/iot/SensorsMapTab.tsx` :

- Supprimer la constante `FONDS` et le `<TileLayer>` en dur ; l'état `fond` passe de `'plan' | 'satellite'` à `MapStyle` (`'cadastre' | 'satellite'`) de `src/components/maps/mapStyles.ts`.
- Rendre `<DynamicTileLayer mapStyle={fond} maxZoom={22} />` (gère fond + surcouche cadastre + relais satellite).
- Ajouter `<CadastreLayer points={...} enabled />` quand `fond === 'cadastre'`, avec `points` = sondes géolocalisées affichées (`id`, `lat`, `lng`, `label = nom`), repli sur le centre de la carte si aucune sonde placée.
- Conserver les deux boutons de fond existants (style et position inchangés), en changeant simplement le libellé et la clé ; pas de passage au `MapStyleToggle` global pour ne pas casser l'habillage mobile de cet onglet.

Aucun changement de données, de RLS ni de logique métier des sondes.
