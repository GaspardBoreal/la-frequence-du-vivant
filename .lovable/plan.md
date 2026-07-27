## Constat

Dans `RevealMapBlock` (J'identifie → Carte des révélations), le clic sur un point n'ouvre qu'un `<Popup>` Leaflet avec une vignette 100 px non cliquable. Contrairement à la console GPS (`GpsControlConsole`), il n'y a ni bandeau latéral d'observations, ni visionneuse plein écran. Vérifié : le fichier ne contient aucun état `lightbox`/`selected`, et aucune liste latérale.

## Ce qu'on ajoute

1. **Vignette cliquable dans la popup** — curseur zoom + icône loupe ; le clic ouvre la visionneuse.

2. **Visionneuse plein écran (lightbox)** — même ergonomie que la console GPS :
   - photo grand format centrée, fond sombre
   - légende : nom FR (via `displayNameFor`), nom scientifique en italique, source (marcheur / observation citoyenne + observateur), date, statut géofence si « hors périmètre », mention « position corrigée » le cas échéant
   - navigation ← → au clavier et par flèches à l'écran entre les observations **filtrées** (même ordre que la liste)
   - Échap pour fermer, verrouillage du scroll
   - lien « Voir sur iNaturalist » quand la source le permet

3. **Bandeau latéral en mode plein écran** — colonne gauche (masquée sous `md`, repliable) listant les observations filtrées : vignette, nom FR, nom scientifique, date, pastille couleur règne.
   - clic sur une ligne → centre la carte sur le point et ouvre sa popup
   - clic sur la vignette de la ligne → ouvre la visionneuse
   - synchronisation inverse : clic sur un marqueur → la liste défile jusqu'à la ligne et la surligne (anneau doré), comme dans la console GPS

4. **Hors plein écran** — pas de bandeau (place limitée), mais la vignette de popup reste cliquable et ouvre la même visionneuse.

## Détails techniques

- Fichier modifié : `src/components/propriete/identify/blocks/RevealMapBlock.tsx`. Extraction des deux nouveaux morceaux en sous-composants locaux (`RevealPhotoLightbox`, `RevealObservationList`) dans `src/components/propriete/identify/blocks/` pour garder le fichier lisible.
- États ajoutés : `lightboxId: string | null`, `selectedId: string | null`, `rowRefs` (Map d'éléments pour `scrollIntoView`).
- Navigation lightbox = index dans `filtered` (déjà calculé), on saute les entrées sans `photoUrl`.
- La popup Leaflet reste en place ; la synchronisation carte→liste passe par `eventHandlers={{ click }}` sur chaque `<Marker>` (pas de refacto de `RichMap`).
- Réutilisation des styles/tokens design existants (`--ds-cream`, `--ds-forest`, etc.), aucune couleur en dur hors des styles inline Leaflet déjà présents.
- Aucun changement de données, de RPC ou de logique de comptage : compteurs espèces/observations inchangés.
