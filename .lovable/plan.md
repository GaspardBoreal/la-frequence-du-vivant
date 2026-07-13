# Plan — Acte I Vignoble : chiffres, photos et pépites

Scope strict : `src/components/vignoble/VignobleImmersion.tsx` (+ un petit hook photos réutilisant les RPC existantes). Aucun autre acte touché.

## 1 · Corriger le compte d'espèces (208 → 38)

**Cause** : `DomaineChiffres` lit `biodiversity.species_count` (RPC `get_public_event_biodiversity` = 208, inclut tous les snapshots iNat élargis). L'événement admin/exploration affiche 38 via la RPC unifiée `get_exploration_species_count` (mem : *unified-species-count-rpc*, source de vérité).

**Fix** : dans `VignobleImmersion` on récupère `event.exploration_id` et on branche `useExplorationSpeciesCount(explorationId)` (hook déjà existant, même code que l'événement). On passe `unifiedCount = data?.total ?? biodiversity?.species_count` à `DomaineChiffres`.
- « Espèces recensées » → `unifiedCount` (38 attendu)
- « Observations » reste `stats.observations_count`
- Aucun changement backend.

## 2 · Rendu net des pépites (« Ce que vous rencontrerez »)

**Cause** : `PepitesGrid` utilise `aspect-[3/4]` étiré + `object-cover` sur les vignettes iNat 200 px → flou. Le rendu événement (`PublicEventPage`, section Taxons observés) utilise `aspect-square` en grille 4 col.

**Fix** : aligner exactement le rendu événement :
- `aspect-square` au lieu de `3/4`
- garder `object-cover` + `group-hover:scale-105`
- carte plus compacte (padding réduit), typo restant vignoble
- retirer le badge « N° 01 » (bruit) — remplacer par un mince filet or

## 3 · Nouveau bloc « Album du domaine » (photos wahouhh)

Insertion **entre `DomaineChiffres` et `PepitesGrid`** (dans Chapitre I, sans nouveau chapitre).

**Source données** : `usePublicEventMedias(slug)` (déjà présent, RPC `get_public_event_medias`, retourne les photos marcheurs = convivialité + points de marche). Filtrer `type_media === 'photo'`.

**Composant** `AlbumDomaineCarousel` :
- Défilement **par paquets de 4** (4 tuiles visibles simultanément desktop, 2 tablet, 1 mobile, avec `snap-x snap-mandatory`).
- Auto-rotation toutes 4,5 s : slide horizontal en `translateX` avec easing `[0.19,1,0.22,1]` (Framer Motion `AnimatePresence` custom, style KenBurns doux sur chaque tuile).
- Chaque tuile : `aspect-[4/5]` sépia doré au repos, saturation pleine + zoom Ken Burns 1.0→1.08 au hover et pendant sa fenêtre active.
- Cadre : bordure or 1 px + filet supérieur `vignoble-gold-rule`, cartouche italique en bas « — nom auteur · date » sur voile ink/60.
- Contrôles : chevrons or ronds latéraux (opacity 0 → 100 au hover section), pastilles de progression en bas (1 pastille par paquet de 4), respect `prefers-reduced-motion` (fondu simple, pas de zoom).
- Effet « wahouhh » : au changement de paquet, léger flash doré (`radial-gradient` mix-blend screen, 350 ms) inspiré de `KenBurnsCarousel` existant, et parallax subtil (chaque tuile décale de ±4 px selon son index).

## 4 · Supprimer Acte V « La bouteille »

- Retirer `<BouteilleCTA>` + son `<OrnamentalDivider label="V · La Bouteille" />` dans le layout racine.
- Retirer la fonction `BouteilleCTA` et l'entrée V dans `CHAPTERS` (pour que le scroll-spy et la barre de progression restent cohérents).
- Renuméroter « Rejoindre » de Chapitre VI → Chapitre V dans le texte affiché (label seul, `id="rejoindre"` inchangé pour ne pas casser les ancres).

## Livrables techniques

| Fichier | Changement |
|---|---|
| `src/components/vignoble/VignobleImmersion.tsx` | 1) import `useExplorationSpeciesCount`, prop count vers `DomaineChiffres`. 2) `PepitesGrid` aspect-square. 3) Nouveau `AlbumDomaineCarousel` (interne). 4) Suppression `BouteilleCTA` + divider + renum chapitre. |
| `src/hooks/usePublicEvent.ts` | Aucun. `usePublicEventMedias` déjà en place. |

Aucune migration SQL, aucune nouvelle RPC, aucun nouveau bucket.

## Vérification

- Playwright : charger `/m/chateau-boutinet-…`, screenshot Acte I, vérifier `38` sous « Espèces recensées », présence du carrousel avec 4 tuiles nettes, absence totale du bloc bouteille, netteté des pépites.
