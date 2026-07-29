# Atelier de conception — « Emplacements de la palette » devient un studio

Transformer la carte plein écran de l'Étape 5 en **Atelier du jardin nourricier** : un espace de conception (concepteurs & chargés d'affaire) où l'on dessine des emplacements, on empile des calques, on pose des objets d'aménagement paysager, et on lit le vivant réellement observé sur le site.

## 1. Emplacements (zones) — CRUD complet

Aujourd'hui : créer / sélectionner / supprimer. Ajouts :
- **Renommer** en ligne (double-clic sur la pastille ou champ dans le panneau latéral).
- **Couleur** : choix parmi la palette du site + opacité de remplissage.
- **Afficher / cacher** par emplacement (œil sur chaque pastille) + « tout afficher / tout masquer ».
- **Modifier le tracé** : mode « redessiner » (remplace la géométrie) et poignées de sommets déplaçables pour l'ajustement fin.
- **Dupliquer** un emplacement (utile pour bandes répétées).
- **Surface calculée** (m²) affichée sur chaque zone et dans la légende — indispensable pour le chiffrage.
- Verrouillage d'un emplacement (empêche déplacement accidentel).

## 2. Calques (nouveau)

Un panneau **Calques** rétractable à droite, façon Figma/QGIS :
- Créer / renommer / supprimer / réordonner (drag) / afficher-cacher / opacité par calque / verrouiller.
- Calques par défaut proposés à la création d'une propriété : `Existant`, `Sol & eau`, `Structures`, `Plantations`, `Circulations`, `Annotations`.
- Chaque **objet d'aménagement** appartient à un calque ; masquer le calque masque ses objets.
- Les couches système (parcelles cadastre, emplacements, observations vivantes) apparaissent aussi dans le panneau avec leur interrupteur, pour une pile de vues unique.

## 3. Palette d'outils paysagers (objets posés sur les calques)

Boîte à outils latérale, regroupée en familles, chaque outil = géométrie (point / ligne / polygone) + icône + couleur + métadonnées (nom, note, quantité, coût indicatif).

- **Eau & GIEP (contemporain)** : noue, jardin de pluie, mare/bassin tampon, tranchée d'infiltration, baissière (swale), citerne, surface désimperméabilisée.
- **Sol vivant / MSV** : planche permanente, butte, paillage/couverture permanente, apport BRF/compost, zone de non-travail du sol, lasagne.
- **Nourricier** : verger, haie fruitière, forêt-jardin, potager, serre, aromatique, treille/pergola productive.
- **Structures historiques** : mur en pierre sèche, terrasse/restanque, clôture plessée, haie bocagère, allée cavalière, charmille, potager en carrés à la française, bassin d'agrément, cabane/abri.
- **Biodiversité** : hôtel à insectes, tas de bois mort, pierrier, prairie fleurie, mare pédagogique, nichoir, corridor.
- **Circulation & usage** : cheminement stabilisé, pas japonais, terrasse, aire de jeu, point d'assise, accès engins.
- **Annotation** : flèche, cote (mesure de distance), texte libre, punaise photo.

Chaque objet : sélection, déplacement, rotation/redimensionnement (pour les polygones : édition de sommets), suppression, duplication, et fiche latérale avec note + rattachement à un emplacement.

## 4. Filtres du vivant (couche observations)

Barre de filtres au-dessus de la carte, appliquée aux observations affichées :
- **Catégorie végétale** : Herbacées · Arbustes · Lianes/Grimpantes/Rampantes · Arbres.
- **Type** : Flore · Faune · Champignons · Autres · *Bio-indicatrices seulement*.
- **Source** : Marcheurs · iNaturalist.
- Compteur d'espèces (dédupliquées par nom scientifique, cohérent avec le reste de l'app) + noms affichés en français via le résolveur existant.

## 5. Bibliothèque d'aménagements inspirants

Tiroir « Inspirations » : fiches d'aménagements (photo, typologie, ancienneté du projet, contexte sol/eau, mots-clés) reprenant la logique « Observatoire des paysages vivants » et « Portraits d'aménagements » de la formation. Filtrage par typologie / enjeu / ancienneté. Bouton **« Poser sur le plan »** : crée un objet d'aménagement pré-rempli sur le calque courant. Amorçage avec un jeu de fiches internes ; extension ultérieure possible depuis les marches.

## 6. Deux idées supplémentaires (tenir les promesses de la formation)

**a) Chiffrage & argumentaire vivant.** Chaque objet et emplacement porte surface/linéaire/quantité ; un panneau « Bilan du plan » agrège : m² désimperméabilisés, volume d'eau retenu estimé (surface × pluie de projet), m² nourriciers, ml de haies, m² de couverture permanente — puis un comparatif coût conventionnel vs sol vivant sur 10 ans. Exportable dans le cahier d'impression : c'est le *deck d'arguments économiques* de l'OAD.

**b) Scénarios temporels (An 0 / An 3 / An 10).** Un curseur de temps qui fait grandir les objets plantés (rayon de couronne d'arbre, densité de haie) et change le rendu du sol. Permet de « vendre le temps long et la poésie sauvage ». Chaque scénario est sauvegardable et comparable côte-à-côte (avant/après en volet glissant sur la vue satellite).

*(bonus léger si le temps le permet : export du plan en image haute définition avec légende automatique, intégré à l'impression du cahier.)*

## Détails techniques

- **Base de données** (une migration) :
  - `propriete_zones` : ajouter `visible boolean`, `verrouille boolean`, `opacite numeric`, `surface_m2` (calculée côté client puis stockée).
  - `propriete_calques` : `id, propriete_id, nom, ordre, visible, opacite, verrouille, timestamps` + GRANTs + RLS calquée sur `propriete_zones` (`can_access_propriete`).
  - `propriete_objets` : `id, propriete_id, calque_id, zone_id (nullable), outil_key, nom, geometry jsonb, style jsonb, meta jsonb (quantité, coût, notes), timestamps` + GRANTs + RLS identique.
  - RPCs `SECURITY DEFINER` `list/upsert/delete_propriete_calque` et `..._objet`, sur le modèle de `list_propriete_zones`.
- **Front** :
  - `src/lib/paysageTools.ts` — registre déclaratif des outils (clé, label, famille, géométrie, icône Lucide, couleur, unités).
  - `src/hooks/propriete/usePropertyCalques.ts`, `usePropertyObjets.ts` (React Query, mêmes patterns que `usePropertyZones`).
  - `src/components/propriete/palette/studio/` : `PaletteStudio.tsx` (shell plein écran), `LayersPanel.tsx`, `ToolPalette.tsx`, `ObjectInspector.tsx`, `LivingFilterBar.tsx`, `InspirationDrawer.tsx`, `PlanBalanceSheet.tsx`, `TimeScenarioSlider.tsx`.
  - Couches Leaflet : `ObjectsLayer.tsx` (rendu par calque, tri par `ordre`), édition de sommets réutilisant la logique pointer de `FreehandLayer`.
  - `ZonesMapBlock.tsx` conserve la vue compacte (aperçu + bouton « Ouvrir l'atelier ») et délègue le plein écran à `PaletteStudio`.
  - Réutilisation de `RichMap` (styles Géo/Sat/Relief/Cadastre déjà en place, `maxZoom` 22) et du résolveur de noms français existant.
- Aucun changement aux calculs de palette existants ; les impressions reçoivent le plan et le bilan en lecture seule.

## Séquencement proposé

1. Migration + hooks + registre d'outils.
2. Shell `PaletteStudio` : emplacements CRUD complet + panneau calques.
3. Palette d'outils + objets + inspecteur.
4. Filtres du vivant + bibliothèque d'inspirations.
5. Bilan chiffré + scénarios temporels + intégration impression.
