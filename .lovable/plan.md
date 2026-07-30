## Constat

Dans `src/components/propriete/species/ObservationPopupCard.tsx`, l'image n'est rendue que si `w.photoUrl` existe. Pour une observation citoyenne sans photo terrain (Rouge-gorge familier), la vignette est donc vide : aucun repli iNaturalist n'est tenté, alors que le cache serveur `species_thumb_cache` (`useSpeciesThumb`) contient déjà une photo de référence pour la plupart des espèces.

## Proposition : une « bande photo » à deux registres

Remplacer l'image unique par un petit carrousel horizontal en tête de popup, qui affiche **toujours les deux registres quand ils existent** :

```text
┌───────────────────────────────────┐
│ [ marcheur ] [ marcheur ] [ iNat ]│  ← miniatures 64px, scroll horizontal
│  ● ○ ○                            │
├───────────────────────────────────┤
│ Rouge-gorge familier              │
│ Erithacus rubecula                │
└───────────────────────────────────┘
```

- **Registre 1 — Terrain** : `w.photoUrl` puis les autres photos marcheurs de la même espèce sur la propriété (déjà agrégées côté pool). Pastille discrète « Marcheur ».
- **Registre 2 — Référence** : `photo_url` du cache espèce, pastille « iNat » + attribution en survol. Toujours ajoutée en dernier, même quand des photos terrain existent — c'est ce que demande la demande « afficher les deux ».
- **Aucune des deux** : pictogramme par taxon (même grammaire que `SpeciesThumb`) au lieu du vide actuel.
- Clic sur une miniature terrain → visionneuse plein écran existante (`onZoomPhoto`) ; clic sur la miniature iNat → ouverture de la page iNaturalist source dans un nouvel onglet.

## Mise en œuvre

1. **Nouveau composant** `src/components/propriete/species/ObservationPhotoStrip.tsx` : reçoit `scientificName`, `walkerPhotos: string[]`, `kingdom/iconicTaxon`, gère la sélection, le repli picto et les pastilles de source. Appelle `useSpeciesThumb(scientificName)` pour la photo iNat (batch + cache déjà en place, pas de requête par marqueur en plus).
2. **`ObservationPopupCard.tsx`** : remplace le bloc `{w.photoUrl && …}` par `<ObservationPhotoStrip />`, ajoute une prop optionnelle `walkerPhotos` (défaut : `[w.photoUrl]` filtré).
3. **Alimentation des photos marcheurs multiples** : dans `usePropertySpeciesPool`, exposer une map `photosByScientificName` (les photos terrain sont déjà résolues dans le hook) et la transmettre depuis les trois consommateurs — `LivingLayer.tsx` (Atelier), `RevealMapBlock.tsx` (Carte des révélations), `ExcludedSpeciesMap.tsx` — pour garder une popup identique partout.
4. **Cohérence** : la photo iNat n'est jamais écrite en base ni substituée à la donnée terrain ; c'est un simple affichage de référence, respectant la règle « photos marcheurs prioritaires ».

## Détails techniques

- Miniatures 64×64, `object-fit: cover`, lazy loading, `onError` → passage au registre suivant puis au picto (même logique que `GameCardImage`).
- Largeur mini de la popup portée à ~200px pour loger 3 miniatures sans casser le layout Leaflet.
- Aucun changement de schéma ni d'edge function : `resolve-species-thumb` est déjà déclenché automatiquement pour les noms non résolus.
