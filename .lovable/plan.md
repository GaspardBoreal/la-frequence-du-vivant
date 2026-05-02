## Diagnostic

La photo affichée est bien rattachée à la marche **DEVIAT Point 10 HAIES** mais la lightbox affiche à tort « Photo partagée sur le mur Convivialité ».

Trois sources de coordonnées GPS coexistent pour un média de marche, par ordre de précision décroissante :

1. **EXIF du média** : `marcheur_medias.metadata.gps.{latitude,longitude}` — coordonnées exactes du déclenchement.
2. **Étape de marche** : `marcheur_medias.marche_id` → `marches.{latitude,longitude}` — point GPS de l'étape (ex. « Point 10 HAIES »).
3. **Événement de marche** : `marche_events.{latitude,longitude}` — souvent NULL (cas du jeu de données actuel).

Notre lightbox actuel utilise uniquement (3), donc tombe en NULL et bascule sur le message Convivialité, alors même que `marcheEventId` est renseigné. Bug logique : `isConv || !originEvent || originPoint == null` confond « pas de marche » et « marche sans GPS d'événement ».

## Solution

### 1. Hook `useExplorationAllMedia`

- Sélectionner aussi `marche_id` et `metadata` sur `marcheur_medias`.
- Charger une fois pour toutes les **étapes de marche** (`marches.id, nom_marche, latitude, longitude`) liées à l'événement via `exploration_marches` filtré sur `exploration_id`.
- Enrichir `MediaItem` avec :
  - `marcheId?: string`
  - `marcheStepName?: string`
  - `gps?: { lat: number; lng: number; source: 'exif' | 'step' | 'event' }` calculé en cascade (EXIF → étape → événement).
- Enrichir `MarcheEventGroup` avec `steps: { id, name, lat, lng }[]` (utilisé pour dessiner toutes les étapes sur la carte).

### 2. `MediaLightbox`

- Nouvelle prop : `eventSteps: Map<eventId, MarcheStep[]>` (ou récupérée depuis le `marcheEvents` enrichi).
- Logique d'affichage :
  - Si `current.source === 'conv'` (vraie photo Convivialité) → bannière actuelle inchangée.
  - Sinon (média d'une marche) :
    - Toujours afficher le **bloc carte**.
    - Marqueurs sur la carte : toutes les **étapes** de la marche-jour (cercles gris, légers), plus l'étape d'origine en évidence (cercle emerald large, label permanent).
    - Si `gps` du média (EXIF) disponible → ajouter un **point « ici »** distinct (icône MapPin colorée) avec halo, et `fitBounds` autour de tous les points.
    - Si aucune coordonnée disponible (ni EXIF, ni étape, ni événement) → remplacer la carte par une bannière douce « Localisation GPS non disponible pour ce média » (et non plus le message Convivialité erroné).
- Méta sous la carte : titre marche-jour + nom de l'étape + lieu + date + indication discrète de la source GPS (« Point GPS issu du déclenchement / de l'étape »).

### 3. `MainCuration` & autres consommateurs

- Aucune modification fonctionnelle ; passer simplement `marcheEvents` (déjà enrichi) au `MediaLightbox`.
- `MediaPickerSheet` : continue à afficher correctement, le `marcheEventId` n'a jamais été montré ici, donc rien à changer côté UI.

### 4. Cosmétique : ne plus afficher l'UUID de fichier comme « titre »

Quand `titre` ressemble à un UUID brut (regex `/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-...{12}$/`), masquer ce sous-titre dans la lightbox — c'est un nom de fichier iPhone, pas une légende. On affiche à la place le nom de l'étape de marche (« DEVIAT Point 10 HAIES »).

## Fichiers touchés

```text
src/hooks/useExplorationAllMedia.ts                              (charger marches/steps + EXIF + cascade GPS)
src/components/community/insights/curation/MediaLightbox.tsx     (logique GPS, étapes, message neutre, masque UUID)
```

Aucune migration DB — toutes les colonnes existent déjà.
