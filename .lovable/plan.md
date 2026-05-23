## Objectif

Transformer le tile actuel "🌼 des XX plantes mellifères" en un parcours fusionné **"🌼 Partons à la découverte des XX arbres et plantes mellifères"**, dont l'ouverture révèle 3 sous-parcours narratifs empilés (Arbres / Arbustes / Plantes herbacées), chacun avec son compteur, sa phrase de service écologique et la grille d'espèces correspondante. 100% recalculé à chaque nouvelle observation marcheur ou snapshot iNat — aucune saisie manuelle requise.

## Architecture

### 1. Nouvelle notion : `PlantStrate`

Ajout d'une dimension orthogonale au tag `mellifere` : la **strate végétale** (`arbre` | `arbuste` | `herbacee`). Une espèce mellifère est classée dans exactement une strate.

Source de vérité, dans l'ordre de priorité :
1. **KB éditoriale** (`src/data/species-knowledge-base.json`) — champ optionnel `strate` par espèce ou genre (override de cas limites comme *Buddleja*, *Sambucus*, *Ficus carica*…)
2. **Règles par genre** (table dédiée `GENUS_STRATE` dans le nouveau module)
3. **Règles par famille** (`Salicaceae` → arbre par défaut, `Lamiaceae` → herbacée…)
4. **Fallback** : `herbacee` si l'espèce est mellifère et qu'on n'a aucun indice arbre/arbuste

Pour la liste fournie par l'utilisateur :
- **Arbres** : Corylus avellana, Prunus persica, Aesculus hippocastanum, Cercis siliquastrum, Prunus avium, Ficus carica
- **Arbustes** : Salix integra, Sambucus nigra, Buddleja davidii, Prunus laurocerasus, Prunus spinosa, Weigela florida, Parthenocissus inserta
- **Herbacées** : Anacamptis pyramidalis, Nigella damascena, Papaver rhoeas, Symphytum × uplandicum, Borago officinalis, Trifolium pratense, Lotus corniculatus, Taraxacum officinale, Centranthus ruber, Muscari, Primula veris, Salvia rosmarinus, Malva olbia

Particularités à coder en KB explicite :
- *Prunus persica*, *Prunus avium* → **arbre** (alors que `Prunus` générique = arbuste de haie)
- *Prunus laurocerasus*, *Prunus spinosa* → **arbuste**
- *Salvia rosmarinus* → **arbuste** botaniquement, mais culturellement traité comme **herbacée aromatique** : on le classe **herbacée** pour rester fidèle à l'usage jardin (à confirmer)
- *Ficus carica* → **arbre** (KB)
- *Sambucus nigra* → **arbuste** (override de la règle Sambucus actuelle qui est neutre)
- *Parthenocissus inserta* → **arbuste** (liane ligneuse, KB)

### 2. Fusion du tile carrousel

Le tag `mellifere` reste dans `ECO_FUNCTIONS` mais son `journeyLabel` devient dynamique côté UI : si le bucket contient au moins 1 arbre OU 1 arbuste, on affiche **"arbres et plantes mellifères"** ; sinon on garde **"plantes mellifères"**. Le compteur reste le total fusionné.

Aucune nouvelle entrée tag n'est créée — on garde un seul tile, le drawer fait la séparation.

### 3. Drawer à 3 sections empilées

Refonte du drawer mellifère uniquement (les autres tags conservent la grille simple actuelle). Pour chaque strate non vide :

```text
┌─────────────────────────────────────────────┐
│ 🌳 6 arbres mellifères                      │
│ Floraisons précoces, ressources massives    │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐                    │
│ └──┘└──┘└──┘└──┘└──┘└──┘                    │
├─────────────────────────────────────────────┤
│ 🌿 7 arbustes mellifères                    │
│ Floraisons étalées en haie et lisière       │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐                │
│ └──┘└──┘└──┘└──┘└──┘└──┘└──┘                │
├─────────────────────────────────────────────┤
│ 🌼 13 plantes mellifères                    │
│ Nectar de proximité pour petits insectes    │
│ … grille …                                  │
└─────────────────────────────────────────────┘
```

Apparition séquentielle des sections (Framer Motion stagger), grille espèces identique à l'actuelle (image + SpeciesName + scientifique).

### 4. Recalcul dynamique

Aucun changement nécessaire : le hook `useEcologicalFunctions` est déjà réactif aux invalidations de `useExplorationSpeciesPool`. On ajoute simplement un découpage par strate dans la valeur retournée :

```ts
buckets.mellifere // total (inchangé)
mellifereByStrate: {
  arbre: SpeciesWithFunctions[],
  arbuste: SpeciesWithFunctions[],
  herbacee: SpeciesWithFunctions[],
}
```

## Détails techniques

### Fichiers à créer

- **`src/lib/plantStrate.ts`**
  - Types `PlantStrate = 'arbre' | 'arbuste' | 'herbacee'`
  - Tables `GENUS_STRATE`, `FAMILY_STRATE`
  - Fonction `classifyStrate({ scientificName, family }): PlantStrate | null`
  - Lecture optionnelle du champ `strate` de la KB

- **Section narrative par strate** : objet `STRATE_META` (emoji, label pluriel, phrase service) localisé dans `plantStrate.ts`.

### Fichiers à modifier

- **`src/data/species-knowledge-base.json`**
  - Ajout du champ optionnel `strate` sur ~10 entrées pour les overrides de la liste DEVIAT (Ficus carica, Sambucus nigra, Buddleja davidii, Prunus persica, Prunus avium, Prunus laurocerasus, Prunus spinosa, Salvia rosmarinus, Parthenocissus inserta, Weigela florida). On ne touche pas aux autres champs existants.

- **`src/hooks/useEcologicalFunctions.ts`**
  - Ajoute `mellifereByStrate` au retour, calculé par `classifyStrate` sur chaque espèce du bucket `mellifere`.

- **`src/components/biodiversity/EcologicalJourneyCarousel.tsx`**
  - Label du tile mellifère dynamique : `"des X arbres et plantes mellifères"` si `mellifereByStrate.arbre.length + mellifereByStrate.arbuste.length > 0`, sinon label actuel.
  - Drawer : si `openTag === 'mellifere'`, rendre `<MellifereStrateDrawer />` (nouveau composant interne ou inline) à 3 sections empilées. Sinon, drawer actuel.

### Aucune modification DB / migration

Tout reste côté client. Le recalcul est gratuit (mémoïsé) et déclenché par React Query à chaque nouvelle obs.

## Points de vigilance

- **Pertinence des classifications** : la table `GENUS_STRATE` couvrira les genres récurrents (Quercus, Tilia, Salix, Acer, Prunus, Crataegus, Sambucus, Lavandula, Thymus, Trifolium…). Les cas où plusieurs espèces du même genre ont des strates différentes (*Prunus*, *Salix*) sont gérés par override KB au niveau espèce.
- **SpeciesName** : toujours utilisé pour le rendu, donc noms français garantis et cohérents avec le reste de l'app.
- **Pas de régression** : aucun autre tag du carrousel ni aucune autre vue n'est touché. Tests visuels sur l'expé DEVIAT pour vérifier les 6 / 7 / 13 attendus.

## Hors scope (volontairement)

- Pas de tile séparé "arbres tout court" — réservé à une éventuelle Phase B.
- Pas d'override admin via `exploration_curations.strate` — option 2 du sondage non retenue.
- Pas d'animation "constellation" ni jauge fertilité — reste planifié pour Phase B.
