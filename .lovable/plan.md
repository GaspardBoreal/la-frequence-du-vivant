## Le problème

Aujourd'hui le bouton « Déplacer ce point (Contrôle GPS) » ouvre `GpsControlConsole`, un overlay plein écran avec **sa propre carte** (`center = point sélectionné`, `zoom = 16` en dur). Conséquences :

1. le zoom fin travaillé par l'utilisateur est perdu (on repart à 16) ;
2. le contexte visuel (emplacement/zone dessinée de l'Atelier, calques, filtres de la Carte des révélations, fond de plan choisi) disparaît, puisque la console recompose une carte neuve.

Vérifié dans le code : `GpsControlConsole.tsx` l.694-703 (`center={selected ? [selected.lat, selected.lng] : center} zoom={16}`), et les 3 appelants (`RevealMapBlock`, `PaletteStudio`, `ExcludedSpeciesMap`) qui ne transmettent ni zoom ni état de vue.

Je suis d'accord avec votre intuition : **la curation doit s'exécuter dans la carte où l'on est**, la console plein écran devenant l'outil de revue en lot, pas le passage obligé pour un point.

## Ce que je propose

### 1. Un mode « Curation sur place » (le cœur)

Nouveau composant partagé `InlineGpsCuration` + hook `useInlineGpsCuration`, utilisables tel quel par les trois cartes.

Déclenchement : le bouton du popup partagé `ObservationPopupCard` devient **« ✥ Déplacer ce point »** et bascule la carte courante en mode curation — aucun changement de vue, aucun remontage de carte, le zoom et l'emplacement restent exactement là où ils sont.

Comportement :
- le marqueur ciblé devient **draggable** (halo doré pulsé, ombre portée « point soulevé ») ;
- une **ligne pointillée dorée** relie en continu la position d'origine à la position provisoire, avec la distance en mètres affichée en direct ;
- clic n'importe où sur la carte = poser le point là (alternative au glisser) ;
- **aimantation 25 m** sur la parcelle, reprise de la logique de géofence existante (`buildGeofence` / `evaluateGeofence`) : le liseré de la parcelle vire au vert quand le point retombe dedans ;
- **barre de confirmation flottante** en bas de la carte (pas une modale) : `Sedum de Palmer · déplacé de 43 m · dans la parcelle` + `Enregistrer` / `Annuler` / `Écarter cette observation` ;
- `Échap` annule, `Entrée` enregistre.

Écriture : réutilise `useSetGpsOverride` — la donnée iNaturalist source n'est jamais réécrite, on empile une correction dans `observation_gps_overrides` avec `original_lat/lon`. Aucune modification de base nécessaire.

Après enregistrement : toast sobre + « Annuler » (rollback via `useClearGpsOverride`), le marqueur se repositionne par mise à jour de cache — la carte ne bouge pas.

### 2. La console plein écran conserve la vue

Elle reste utile (revue en lot, points suspects, lightbox). Elle est désormais accessible via un bouton discret « Console de curation » dans la barre d'outils de chaque carte, plus depuis le popup d'un point.

Deux corrections :
- `GpsControlConsole` accepte `initialZoom` et `initialCenter` ; les appelants transmettent le centre/zoom **réels** de leur carte (capturés par un petit `useMapViewState` sur un `useMapEvents('moveend'|'zoomend')`), au lieu du zoom 16 en dur ;
- à la fermeture, la carte d'origine est restaurée à l'identique (elle n'aura jamais été démontée, l'overlay se superposant).

### 3. Parité stricte des trois vues

`RevealMapBlock` (Carte des révélations), `PaletteStudio → LivingLayer` (Atelier) et `ExcludedSpeciesMap` consomment le même trio : `ObservationPopupCard` + `useWaypointFrenchNames` + `InlineGpsCuration`. Une amélioration future se propage aux trois sans copier-coller.

## Détail technique

- `src/hooks/propriete/useInlineGpsCuration.ts` — état (`targetId`, `draft`, `distance`, `snapped`), aimantation géofence, appels `useSetGpsOverride` / `useClearGpsOverride`, invalidations de cache existantes.
- `src/components/propriete/gps/InlineGpsCuration.tsx` — marqueur draggable + `Polyline` pointillée + `MapClickCapture` (extrait de la console pour être partagé) ; à insérer comme enfant de `RichMap`.
- `src/components/propriete/gps/InlineGpsBar.tsx` — barre de confirmation flottante (overlay DOM au-dessus de la carte, `z-[1200]`).
- `src/components/maps/hooks/useMapViewState.ts` — expose center/zoom courants aux parents.
- `ObservationPopupCard.tsx` — le bouton appelle `onStartInlineMove(w)` ; `onOpenGps` conservé en action secondaire discrète (« Ouvrir la console »).
- `GpsControlConsole.tsx` — nouvelles props `initialZoom`/`initialCenter` ; extraction de `MapClickCapture` vers un module partagé, zéro régression sur `AdminGpsControl`.
- Aucune migration SQL, aucune nouvelle RPC.

## Vérification

Sur `/propriete/jardin-monde-deviat` → Atelier : zoom fin sur le Sedum de Palmer, glisser le point, vérifier que le zoom, l'emplacement dessiné et les calques restent intacts, enregistrer, recharger et confirmer la persistance de la correction. Même test sur « J'identifie → Carte des révélations ».
