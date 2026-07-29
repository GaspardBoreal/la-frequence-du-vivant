## Constat

Dans l'Atelier du jardin nourricier, la couche « Vivant » (`src/components/propriete/palette/studio/LivingLayer.tsx`) n'affiche qu'un **tooltip au survol** avec `w.commonName` brut — d'où « great stinging nettle » au lieu de « Grande ortie ». Le composant accepte déjà une prop `frenchName` et une prop `onSelect`, mais `PaletteStudio.tsx` (ligne ~428) ne les passe pas. Aucune photo, aucun clic, aucun agrandissement, aucun bouton Contrôle GPS.

À l'inverse, `identify/blocks/RevealMapBlock.tsx` fait tout cela : résolution FR via `useFrenchSpeciesNamesAuto`, popup avec vignette photo cliquable, date, source, statut géofence/curation, bouton « ✥ Déplacer ce point (Contrôle GPS) », lightbox plein écran (`RevealPhotoLightbox`).

## Objectif

Une seule et même fiche espèce, partout : Carte des révélations, Atelier (couche Vivant), carte des espèces écartées.

## Ce qu'on construit

**1. Composant partagé de fiche observation**
Nouveau `src/components/propriete/species/ObservationPopupCard.tsx` : extraction fidèle du contenu de popup de `RevealMapBlock` (vignette + « 🔍 Cliquer pour agrandir », nom FR en gras, latin en italique, source/observateur, date, alerte hors périmètre, mention « position corrigée », bouton Contrôle GPS conditionné à `canCurate`). Props : `waypoint`, `displayName`, `canCurate`, `onZoomPhoto`, `onOpenGps`.

**2. Hook partagé de noms FR**
Nouveau `src/hooks/propriete/useWaypointFrenchNames.ts` : encapsule la construction de l'entrée dédupliquée + `useFrenchSpeciesNamesAuto` et retourne un `displayNameFor(waypoint)`. Utilisé par les trois cartes → un seul comportement, un seul cache.

**3. LivingLayer devient cliquable**
- Tooltip survol : nom FR (via `displayNameFor`) + latin.
- Ajout d'un `<Popup>` rendant `ObservationPopupCard`.
- Le marqueur reste un `CircleMarker` (rendu léger du nuage), le popup s'ouvre au clic.

**4. Câblage dans PaletteStudio**
- Appel du hook FR sur `waypoints`, passage de `frenchName` et des handlers à `LivingLayer`.
- État `lightboxId` + rendu de `RevealPhotoLightbox` (déplacé/réexporté depuis `propriete/species/`) au-dessus de l'atelier plein écran (z-index supérieur à l'overlay de l'Atelier).
- État `gpsConsole` + `GpsControlConsole`, avec le contexte = observations actuellement visibles selon les filtres Vivant (même logique de contexte que `openGpsFromPoint` dans RevealMapBlock). Bouton visible uniquement si `useCanCurateParcelles` est vrai.
- Enrichissement géofence : réutilisation de `buildGeofence`/`evaluateGeofence` sur les parcelles déjà chargées par l'Atelier, pour que la fiche affiche le même statut « hors périmètre » que dans J'identifie.

**5. Mise en cohérence des deux autres cartes**
- `RevealMapBlock` : remplacement de son popup inline par `ObservationPopupCard` et de son bloc FR par le hook (aucun changement visuel attendu).
- `ExcludedSpeciesMap` : même carte de fiche, avec la vignette rendue cliquable/agrandissable (aujourd'hui image non cliquable).

## Détails techniques

- `RevealPhotoLightbox` et `useRevealIndex` restent inchangés ; seule la lightbox est réutilisée, déplacée sous `src/components/propriete/species/` avec réexport depuis l'ancien chemin pour ne rien casser.
- Pas de changement de base de données, pas de nouvelle requête réseau : `usePropertySpeciesPool` est déjà appelé par l'Atelier.
- Les popups Leaflet dans l'overlay plein écran de l'Atelier héritent du z-index de la carte ; la lightbox sera rendue via `createPortal` en `z-[2100]` pour passer au-dessus.

## Points à confirmer (je peux partir sur les valeurs par défaut proposées)

1. Dans l'Atelier, faut-il aussi le **bandeau latéral liste des observations** (`RevealObservationList`, recherche/tri/tags) ? Par défaut : non — l'Atelier a déjà son panneau latéral Calques/Outils/Vivant/Bilan, on se limite aux fiches cliquables.
2. Bouton « Contrôle GPS » dans l'Atelier : par défaut oui, réservé aux curateurs, comme dans J'identifie.
