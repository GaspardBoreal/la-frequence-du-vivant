---
name: Curation GPS sur place
description: Repositionnement d'une observation directement dans la carte courante (zoom/emplacements conservés), partagé Carte des révélations + Atelier
type: feature
---
Bouton « ✥ Déplacer ce point ici » dans `ObservationPopupCard` → mode curation **in-place** :
marqueur doré draggable + clic carte, ligne pointillée vers la position d'origine, aimantation
25 m sur la parcelle (`nearestPointOnGeofence`), bandeau flottant `InlineGpsBar`
(Enregistrer / Écarter / Annuler, Échap + Entrée), toast avec action Annuler.

Jamais de changement de vue : le zoom, les calques et les emplacements dessinés restent en place.
La console plein écran `GpsControlConsole` reste réservée à la revue en lot et hérite désormais
du zoom courant via `initialZoom` (`MapViewReporter` / `useMapViewState`).

Fichiers : `useInlineGpsCuration.ts`, `InlineGpsCurationLayer.tsx`, `InlineGpsBar.tsx`,
branchés dans `RevealMapBlock` et `PaletteStudio`/`LivingLayer`.
La donnée source iNaturalist n'est jamais réécrite (`observation_gps_overrides`).
