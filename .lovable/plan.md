# Atelier : déplacer et pivoter un emplacement sélectionné, fiche lisible sur « Sat »

## 1. Déplacer et pivoter sans passer par « Transformer »
Aujourd'hui, la forme ne bouge qu'en entrant dans « Transformer », qui affiche aussi les poignées de redimensionnement.

Ajouts :
- **Glisser pour déplacer** : un emplacement sélectionné (et non verrouillé) se déplace directement en le faisant glisser sur la carte. Sa forme et sa surface ne changent pas. Le curseur devient une main pour l'indiquer.
- **Pivoter** : une petite barre flottante apparaît au-dessus de l'emplacement sélectionné avec :
  - ↺ pivoter dans le sens trigonométrique (antihoraire), ↻ pivoter dans le sens horaire, par pas de 15° (Maj = 1°) ;
  - l'angle cumulé affiché (ex. « +30° ») ;
  - ↶ Annuler le dernier geste.
- Raccourcis clavier quand l'emplacement est sélectionné : flèches = petit déplacement, Q / E = pivoter à gauche / à droite.
- Enregistrement automatique à la fin de chaque geste (relâchement ou clic), avec annulation possible ; l'emplacement verrouillé reste immobile.
- « Transformer » reste disponible pour l'échelle, le lissage et les miroirs ; ses boutons de rotation gagnent aussi ↺ / ↻.

## 2. Fiche de modification lisible sur la vue « Sat »
Sur la photo satellite, la fiche est trop transparente : le titre, « Couleur », « Opacité » et les boutons se perdent dans l'image.

Correctifs :
- Fond de fiche opaque (crème plein, flou supprimé) quand le fond « Sat » est actif ; liseré et ombre plus marqués.
- Boutons « Transformer », « Redessiner », « Masquer sur le plan », « Dupliquer et composer » : fond plein, texte foncé contrasté, contour net ; « Supprimer » en rouge lisible.
- Titres de rubrique et champs plus contrastés, cibles tactiles d'au moins 40 px sur mobile.
- Même rendu appliqué à la fiche des ouvrages sur « Sat ». Les vues Géo, Relief, Cadastre ne changent pas.

## Détails techniques
- Nouveau calque léger `ZoneQuickMoveLayer` (pane des emplacements) : pointerdown sur le polygone sélectionné → translation via les helpers existants de `geomTransform`, `map.dragging` désactivé pendant le geste, `onPatchZone({ geometry })` au relâchement ; pile d'annulation locale.
- Rotation : `rotateRing` autour du centroïde, ±15° / ±1°, même persistance.
- `ZoneTransformBar` : boutons ↺/↻ en plus du 90°.
- `ZoneInspector` / `ObjectInspector` : prop `basemap` transmise depuis `PaletteStudio` ; variante « sat » avec fond opaque et boutons à fond plein via tokens existants.
- Aucune migration, aucune donnée modifiée hors géométrie des emplacements déplacés.

## Vérifications
- Glisser un emplacement : il bouge, sa surface reste identique, la position est conservée à la réouverture.
- ↺ / ↻ pivotent dans le bon sens ; Annuler revient en arrière ; verrouillé = immobile.
- Fiche sur « Sat » : tous les boutons lisibles, desktop et mobile.
