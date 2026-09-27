# Chantier × Emplacements : associer, cadrer, révéler

## Ce qui existe aujourd'hui

- Un chantier ne connaît que des **ouvrages** (liste d'ouvrages cochés, ou « tout le jardin »). Les **emplacements** (A, B, C… tracés dans l'Atelier) n'y sont pas rattachables.
- Le cadrage des espèces d'un chantier se règle en trois crans seulement : strict / lisière 3 m / voisinage 15 m.

## Ce qui va changer

### 1. Associer (ou non) un emplacement à un chantier
- Dans la fenêtre de composition du chantier, une seconde section **« Emplacements »** apparaît sous « Ouvrages » : chaque emplacement est une pastille lettre + nom, à cocher/décocher.
- Même réglage dans l'édition d'un chantier existant (crayon) et dans la fiche d'un emplacement sur la carte : bouton « Rattacher à un chantier… » (liste des chantiers + « Aucun »).
- Un emplacement peut appartenir à plusieurs chantiers ; le décocher ne supprime rien.
- Mobile : sections en accordéon plein écran, pastilles de 44 px minimum, pied fixe « Enregistrer ».

### 2. Voir uniquement les espèces d'un emplacement, avec rayon optionnel
- Nouveau sélecteur **« Rayon d'écoute »** : `Dans le tracé` (défaut) · 5 · 10 · 25 · 50 · 100 · 250 · 500 · 1000 m, mesuré **depuis le bord** du tracé (jamais un disque autour du centre).
- Mobile : curseur à crans aimantés + rangée de puces défilante ; la carte redessine en direct un halo autour de l'emplacement et atténue les points hors portée.
- Disponible à deux endroits : fiche d'un emplacement (Atelier) et vue « Visu » du chantier. Il remplace les trois crans actuels (strict ≈ « Dans le tracé », lisière ≈ 5 m, voisinage ≈ 25 m, conversion automatique).
- L'Herbier du moment peut suivre ce cadrage (« Herbier de l'emplacement B · 25 m »), avec la recherche et le carnet d'observations existants.

### 3. Le « wahou » : sous-menu « Cortège vivant » du chantier
Nouvel onglet dans la barre du chantier (à côté de Visu / Palette / Bilan), pensé téléphone d'abord :

```text
 +-------------------------------+
 | Emplacement B · 25 m    [v]   |  <- choix emplacement + rayon
 |   (anneaux concentriques)     |
 |    o  o   [B]   o     o       |  <- espèces en orbites :
 |  o    o       o    o          |     dedans / lisière / voisinage
 | Flore 42 · Faune 18 · Autres 3|
 | [ Avant ] ---o--- [ Après ]   |  <- glisser = date des travaux
 +-------------------------------+
```

- **Anneaux concentriques** : l'emplacement au centre, les espèces placées sur un anneau selon leur distance au bord ; changer le rayon fait éclore ou se retirer les anneaux extérieurs (animation douce).
- **Curseur temporel Avant / Après** : balayer rejoue l'apparition des espèces dans l'ordre de leurs dates d'observation ; celles apparues après les travaux se signalent par un liseré.
- **Toucher une vignette** → carnet de l'espèce (photos datées de l'herbier) ; appui long → « Situer sur la carte ».
- Filtres Flore / Faune / Autres, compteurs animés, bascule « Liste » sobre pour la lecture rapide.
- Si le chantier n'a aucun emplacement : état vide avec bouton « Rattacher un emplacement ».

## Détails techniques

- Migration : `ALTER TABLE propriete_chantiers ADD COLUMN zone_ids uuid[] NOT NULL DEFAULT '{}'` et `ADD COLUMN radius_m int` (null = dans le tracé). Politiques RLS existantes (`can_access_propriete`) inchangées.
- `useProprieteChantiers` : types + `create`/`patch` avec `zone_ids`, `radius_m`.
- Cadrage : nouvelle fonction dans `src/lib/chantierIcg.ts` `scopeWaypointsByRadius(geometries, waypoints, radiusM)` basée sur `classifyObservations` (tolérance de lisière 0 si « Dans le tracé »). Les géométries du chantier = ouvrages ∪ emplacements (`usePropertyZones`). Le bilan ICG utilise ce même périmètre.
- Constante partagée `CHANTIER_RADIUS_PRESETS = [0,5,10,25,50,100,250,500,1000]`.
- UI : `ChantierLotPicker.tsx` (section Emplacements), `ChantierOverlay.tsx` (sélecteur de rayon, nouvel onglet), nouveau `chantier/CortegeVivantOrbit.tsx` (SVG + framer-motion, virtualisation au-delà de ~150 vignettes, vignettes via `<SpeciesThumb />`, noms via `<SpeciesName />`), `palette/ZoneChipMenu.tsx` (rattacher + rayon), halo carte dans la couche des emplacements.
- Mémoire projet mise à jour (chantier-avant-apres) ; règle d'architecture ajoutée à `AGENTS.md`.
- Vérification : compilation, rendu mobile 375 px sans défilement latéral, contrôle en base d'un rattachement enregistré.
