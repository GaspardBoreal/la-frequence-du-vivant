## Objectif

Étendre la popup « Choisir les médias » (utilisée pour bâtir une pratique éditoriale dans *Ce que nous avons vu → La main*) pour inclure les **enregistrements audio** des marches de l'événement, en plus des photos, vidéos et photos Convivialité déjà présents.

## Source de données

- Table `marcheur_audio` (filtre `is_public = true`, `marche_event_id` ∈ marches de l'exploration).
- Auteur via `community_profiles` (déjà chargé pour les médias visuels — on mutualise).

## Modèle

Étendre `MediaItem` :
- `MediaType` accepte `'audio'` (en plus de `'photo' | 'video'`).
- `MediaSource` accepte `'audio'`.
- Clé composite : `audio:<uuid>` — pleinement compatible avec le stockage `text[]` déjà migré.

`useExplorationAllMedia` charge `marcheur_audio` en parallèle de `marcheur_medias` et fusionne les items dans le groupe `MarcheEventGroup` correspondant, triés par date desc.

## UX picker mobile-first

**Nouveau chip filtre** : *Audios* (icône `Mic`), à côté de *Photos* et *Vidéos*. L'ordre devient : Tous · Photos · Vidéos · Audios · Convivialité.

**Rendu d'un audio** dans la grille (différent d'un thumb carré) :
- Carte rectangulaire `col-span-3 sm:col-span-4 md:col-span-5` (pleine largeur de la grille, 1 par ligne) — plus lisible que de forcer un carré pour un fichier sans visuel.
- Contenu : icône onde/play à gauche dans un disque emerald 10×10, titre (ou « Enregistrement sans titre »), méta `auteur · durée mm:ss`, mini-bouton *Écouter* (toggle un `<audio controls>` inline en dessous, lazy).
- État sélectionné : bordure emerald + check rond emerald en haut à droite (mêmes codes que les thumbs visuels).
- Tap sur la carte (hors bouton Écouter) = sélection/désélection.

Les sections « Tous » mélangent visuels (grille de carrés) puis audios (cartes pleines largeur) à la suite, sous chaque marche, pour conserver le découpage par marche déjà en place.

## Intégration dans `MainCuration`

- `renderThumb` détecte `item.type === 'audio'` :
  - Vignette de pratique : tuile emerald avec icône `Mic` + titre tronqué (au lieu d'une image), conserve l'`aspect-square` ou `aspect-[16/9]` du layout existant.
  - Aperçu éditeur (grille 4 col) : même tuile compacte.
- Aucun changement de logique d'enregistrement — la clé `audio:<uuid>` est persistée dans `media_ids` comme les autres.

## Lightbox

`MediaLightbox` gère déjà vidéo (`<video controls>`). On ajoute une branche `audio` :
- Affiche un grand bloc emerald centré avec icône `Headphones`, titre et `<audio controls>` plein largeur.
- La mini-carte et le bloc auteur restent identiques (audio rattaché à un `marche_event` → point GPS mis en évidence).
- Pas d'image de fond, donc on supprime le `bg-black` au profit de `bg-card` quand `current.type === 'audio'`.

## Fichiers touchés

```text
src/hooks/useExplorationAllMedia.ts                              (charger marcheur_audio + types)
src/components/community/insights/curation/MediaPickerSheet.tsx  (chip Audio + rendu carte audio)
src/components/community/insights/curation/MainCuration.tsx      (renderThumb audio)
src/components/community/insights/curation/MediaLightbox.tsx     (branche audio)
```

## Hors scope

- Pas de migration DB (clé `audio:` est du `text`).
- Pas de waveform — `<audio controls>` natif suffit pour l'écoute, restant sobre et performant.
