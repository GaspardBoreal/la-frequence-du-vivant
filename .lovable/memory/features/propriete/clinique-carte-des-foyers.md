---
name: Carte des foyers (Clinique dans l'Atelier)
description: Vue de fond « État sanitaire » de l'Atelier du jardin — foyers GPS, halos de propagation, chaînes de contagion, tournée de soin
type: feature
---
Vue de fond **« État sanitaire »** dans l'Atelier du jardin (`PaletteStudio`), au même rang que
Prélèvements de sol : les consultations de la Clinique deviennent des foyers posés sur le plan.

- Pastille vivante : couleur = statut, taille = étendue (/5), anneau = gestes réalisés,
  pulsation tant qu'un geste reste à faire, badge du nombre de gestes en attente.
- Halo de propagation `spreadRadiusM(kind, severity)` : champignon 12 m, bactérie 6 m,
  insecte 25 m (base), modulé par l'étendue. Ordre de grandeur de terrain, jamais une prédiction.
- Chaînes de contagion : foyers actifs du **même pathogène** dont les halos se touchent,
  reliés en pointillé rouge (union-find, `buildContagionChains`).
- Voisins exposés : observations du vivant tombant dans le halo, listées dans la bulle.
- Tournée de soin (`buildCareRound`) : départ sur le foyer le plus grave, puis plus proche
  voisin ; polyline pointillée + arrêts numérotés.
- Pose et correction : dock « À situer » (consultations actives sans GPS) → clic sur le plan ;
  pastille glissable ensuite. Écriture chirurgicale `lat`/`lng` seule (`useMoveConsultation`,
  optimiste), le dossier clinique n'est jamais réécrit.
- Depuis la bulle : « Geste fait ✓ » (`useMarkActionDone`) et ouverture du `ConsultationDrawer`.
- Sous-options du panneau : halos, tournée, mémoire (afficher les foyers rétablis).

Fichiers : `src/lib/gardenSpread.ts`, `src/components/propriete/clinique/map/{CliniqueLayer,CareRoundLayer,CliniqueDock}.tsx`,
hooks `useCliniqueMapData` / `useMoveConsultation` / `useMarkActionDone` dans `useGardenClinique.ts`.
Toute écriture invalide aussi `['clinique-map']` et `['clinique-overview']`.
