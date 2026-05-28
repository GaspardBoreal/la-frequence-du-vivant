# Fallback photo iNaturalist pour vignettes espèces sans photo terrain

## Objectif
Quand une espèce identifiée via iNaturalist n'a pas de photo prise par le marcheur, afficher la photo de référence iNaturalist (taxon par défaut) à la place du pictogramme générique, partout dans l'app, avec une pastille discrète « iNat » signalant la source.

## Composant central : `SpeciesThumb`
Nouveau composant `src/components/species/SpeciesThumb.tsx` — utilisé par toutes les vignettes espèce.

Props : `scientificName`, `commonName?`, `kingdom?`, `localPhoto?` (photo terrain prioritaire), `size` (`sm` 40px / `md` 56px / `lg` 80px), `showInatBadge?` (default true), `className?`.

Logique :
1. Si `localPhoto` → l'affiche tel quel, pas de pastille.
2. Sinon → appelle `useSpeciesPhoto(scientificName)` (déjà en place, cache React Query 24h, cache GC 7j).
3. Si photo iNat trouvée → `<img>` + pastille discrète bas-droite : pill `bg-background/80 backdrop-blur border border-border/60 text-[9px] text-muted-foreground px-1 py-0.5 rounded-full` avec libellé `iNat`, tooltip « Photo de référence iNaturalist ».
4. Sinon (pas de photo nulle part) → fallback actuel : `kingdomIcon` colorisé.
5. État loading : skeleton `bg-muted animate-pulse` (pas de spinner).

Performance : un seul hook par vignette, mais React Query déduplique automatiquement par `scientificName`, donc 50 vignettes de la même espèce = 1 seule requête iNat. Pas de prefetch batch (pas nécessaire au volume actuel).

## Points d'intégration

| Vue | Fichier | Action |
|---|---|---|
| Drawer du jour (Évolution) | `src/components/community/exploration/DayDetailDrawer.tsx` | Remplacer le bloc `{obs.photo ? <img/> : <div Icon/>}` (lignes 54-60) par `<SpeciesThumb localPhoto={obs.photo} scientificName={obs.scientificName} commonName={obs.commonName} kingdom={obs.kingdom} size="sm" />` |
| Synthèse → Taxons observés (cartes) | `src/components/biodiversity/SpeciesCardWithPhoto.tsx` (+ tout consommateur direct utilisant son `kingdomIcon`/photo) | Câbler `SpeciesThumb` en `lg` au lieu de l'image existante quand `photos` est vide. Préserver le carrousel marcheur quand des photos terrain existent. |
| Bandeau hero fiche espèce | `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` | Vérifié déjà en place (copie 2 montre bien la photo iNat + badge "Référence · iNaturalist"). Aligner uniquement le libellé du badge sur le nouveau composant si redondant (à confirmer en build, sinon no-op). |
| Toute autre vignette espèce (drawer GPS, liste participants…) | `src/components/community/synthese/indices/SpeciesGpsDrawer.tsx`, `EnhancedSpeciesCard.tsx`, `CuratedSpeciesCard.tsx`, `SpeciesRow` divers | Migration progressive vers `SpeciesThumb` — limiter le scope à `DayDetailDrawer` + grilles `SpeciesCardWithPhoto` dans ce premier lot, et logger un TODO grep `kingdomIcon` pour traiter les vignettes restantes en lot 2 si besoin. |

## Hors scope (à NE PAS toucher)
- `useSpeciesPhoto.ts` : aucune modif (déjà robuste).
- Aucune migration DB, aucun edge function — purement frontend.
- Pas de changement aux fiches détaillées qui ont déjà leur propre carrousel multi-sources.

## Validation
1. Drawer du jour sur exploration `70fcd8d1…` : Pic épeiche, Bergénie, Clytre lustrée doivent montrer une photo iNat + pastille discrète.
2. Cas dégradé (taxon iNat sans `default_photo`) : retombe sur le pictogramme `kingdomIcon` (pas de cadre vide).
3. Espèces avec photo terrain : aucun changement visuel, pas de pastille « iNat ».

## Mémoire à mettre à jour
Ajouter `mem://features/community/species-thumb-inat-fallback-logic` — règle : toute vignette espèce passe par `SpeciesThumb`, fallback iNat automatique + pastille discrète quand pas de photo terrain.
