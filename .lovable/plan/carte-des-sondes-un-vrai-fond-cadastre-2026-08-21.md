# Carte des sondes : un vrai fond « Cadastre »

## Constat

Sur `Carte des sondes` (Poste de contrôle IoT), le sélecteur de fond propose seulement `Plan` et `Satellite`, et il pose une simple tuile OpenStreetMap brute. Aucun lien avec la vue cadastrale de Mon espace → Carte.

Dans Mon espace, le fond « Cadastre » repose sur trois briques partagées :
- `DynamicTileLayer` (fond OSM + surcouche officielle Etalab cadastre en opacité 55 %, gestion du super-zoom),
- `CadastreLayer` (parcelles réelles chargées autour de points pivots, contour rouge / remplissage ambre, popup parcelle),
- les styles centralisés de `mapStyles` (`geopoetic` / `satellite` / `terrain` / `cadastre`).

La carte des sondes n'utilise aucune de ces briques.

## Ce qui sera fait

Remplacer le fond « Plan » de la carte des sondes par le **même fond « Cadastre »** que Mon espace, avec exactement le même code :

1. Renommer l'option `Plan` en **`Cadastre`** dans le sélecteur de fond (le choix `Satellite` reste inchangé, et bénéficiera au passage de l'ortho IGN + relais Esri comme ailleurs dans l'app).
2. Supprimer la table locale `FONDS` et la balise `TileLayer` codée en dur, au profit de `DynamicTileLayer` piloté par le type partagé `MapStyle`.
3. Afficher les parcelles cadastrales via `CadastreLayer` quand le fond `Cadastre` est actif : les points pivots seront les sondes géolocalisées affichées (après filtres recherche / propriété / état), donc les parcelles se chargent exactement là où sont les sondes.
4. Conserver tout le reste à l'identique : `SafeMapContainer`, `FitAll`, `IotLayer`, fiche sonde, observatoire, bandeau vitalité.

## Détail technique

- Fichier principal : `src/components/iot/SensorsMapTab.tsx`.
- État `fond` typé `'cadastre' | 'satellite'` (sous-ensemble de `MapStyle`), passé à `<DynamicTileLayer mapStyle={fond} maxZoom={22} />`.
- Points pivots cadastre : mapping des sondes placées vers `CadastrePoint` (`{ id, lat, lng, label }`), avec repli sur le centre de la carte si aucune sonde n'est placée — même logique de repli que `RichMap`.
- `CadastreLayer` monte ses propres panes (`cadastre-parcels` z450, `cadastre-popup` z1100), donc les marqueurs de sondes et la fiche latérale (z1000) restent lisibles ; à vérifier visuellement après implémentation.
- Aucune modification de données, de RPC ou de RLS.

## Vérification

Capture Playwright de `/partenaire-iot/brad-technology?tab=carte` en fond Cadastre pour confirmer l'affichage des limites de parcelles et le popup au clic.
