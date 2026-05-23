# Découvertes interactives de la biodiversité — couches "services écologiques" + storytelling dynamique

## Constat actuel

Le projet a déjà 2 systèmes solides :

- **6 catégories de curation** (`indigene`, `bioindicatrice`, `auxiliaire`, `ravageur`, `eee`, `patrimoniale`) — `curationCategories.ts`
- **5 niveaux trophiques + décomposeurs** (`L1…L5`, `DECOMPOSER`) — `trophicClassification.ts`

Ce qui **manque** pour ton objectif "remarquable pour la biodiversité, fertilité des sols, arbres/plantes mellifères" : ce sont des **fonctions écologiques** (services rendus), orthogonales aux catégories et aux niveaux trophiques. Une même espèce peut cumuler plusieurs fonctions (un tilleul = arbre + mellifère + ombrage + carbone).

## Proposition — Couche "Tags fonctionnels" (multi-étiquettes)

Référentiel de **12 tags écosystémiques** classés en 4 familles narratives, pour générer des parcours "Partons à la découverte de…".

### 🌳 Architecture vivante (structure du paysage)

- `arbre` — Arbres et arbustes >2 m (canopée, refuge, mémoire longue)
- `haie_bocage` — Espèces du maillage bocager
- `vieil_arbre` — Arbres remarquables / cavités (microhabitats)

### 🐝 Pollinisation & nourrissage

- `mellifere` — Plantes ressources pour abeilles/bourdons (Apidae + Syrphidae)
- `pollinisateur` — Insectes pollinisateurs (déjà partiellement dans `auxiliaire`)
- `nourricier_oiseaux` — Plantes à baies/graines pour avifaune
- `plante_hote_papillons` — Plantes-hôtes pour chenilles

### 🌱 Fertilité & sol vivant

- `fixateur_azote` — Légumineuses, aulnes, etc.
- `ameliorant_sol` — Couvre-sol, racines profondes, mycorhizes
- `decomposeur` — Recyclage matière (existe déjà comme niveau trophique)

### 💧 Régulation & résilience

- `phytoremediation` — Dépolluantes (eau, sol)
- `refuge_faune` — Espèces fournissant gîte (creux, ronciers, friches)

> Multi-étiquettes : chaque espèce porte 0..N tags. Indépendant des catégories existantes (qui restent : indigène/EEE/patrimoniale…).

## Comment c'est calculé (et **recalculé dynamiquement**)

3 sources fusionnées, dans cet ordre de priorité :

1. **KB enrichie** (`src/data/species-knowledge-base.json`) — ajout d'un champ `functions: string[]` par espèce/genre/famille. Curé à la main pour ~200 espèces canoniques.
2. **Règles par famille/genre** (extension de `FAMILY_RULES`) — ex. `Fabaceae → fixateur_azote`, `Tilia/Salix/Robinia → mellifere`, `Rosaceae arbustifs → nourricier_oiseaux`.
3. **Curation éditoriale** (`exploration_curations`, `sense='oeil'`) — un curateur peut ajouter/retirer un tag, qui prime.

À chaque nouvelle observation (snapshot iNat, contribution marcheur), un hook React Query (`useEcologicalFunctions(explorationId)`) recalcule en mémoire les buckets — **aucune migration nécessaire**, c'est dérivé. Invalidation déjà gérée via les realtime existants (`marcheur_observations`, snapshots).

## Expériences "hyperwahouhh" générées

Chaque tag = un **parcours narratif autogénéré** sur la fiche d'une marche/exploration et sur la page publique `/m/:slug`.

### 1. **Carrousel "Partons à la découverte de…"** (header de l'onglet Biodiversité)

Pour chaque famille de tags active sur la marche, une vignette animée :

> 🌳 "Partons à la découverte des **12 arbres remarquables**"
> 🐝 "Partons à la découverte des **27 plantes mellifères**"
> 🌱 "Partons à la découverte des **5 fixateurs d'azote**"

Compteurs animés (`useAnimatedCounter` déjà présent), apparition au scroll, photo héros tirée d'une espèce représentative.

### 2. **Constellation interactive par tag** (clic sur vignette)

Drawer plein écran avec :

- **Halo central** = nom du tag + définition + service rendu
- **Orbites** = les espèces (taille = nb d'observations, couleur = catégorie de curation)
- **Animation d'apparition** une à une, narration courte ("Le tilleul nourrit l'abeille noire qui pollinise le pommier…")
- Au clic sur une espèce → ouvre la fiche espèce existante (déjà connectée via CustomEvent)

### 3. **"Indice de fertilité du lieu"** (jauge dynamique)

Score 0–100 calculé à la volée :

```
(fixateurs × 3 + décomposeurs × 2 + couvre_sol × 1 + mellifères × 1) / surface
```

Affiché en mode "fréquence", recalculé à chaque snapshot. Storytelling associé : "Ce lieu fertilise lui-même son sol grâce à 5 espèces."

### 4. **Bande-annonce d'arrivée** (page publique `/m/:slug`, sobriété ON)

3 cartes plein écran swipables, générées dynamiquement selon les tags les plus présents :

- *"Ici, **34 espèces** nourrissent les pollinisateurs."*
- *"**4 arbres** ont plus de 80 ans."*
- *"Le sol abrite **6 décomposeurs** identifiés."*
Animation type "Impact Stories" (modèle `marcheur-impact-stories-logic` déjà en mémoire).

### 5. **Recalcul en temps réel — feedback visuel**

Quand une nouvelle obs entre :

- Le compteur de la vignette concernée pulse (animation `pulse`)
- Toast discret : *"+1 plante mellifère ✨ — Trifolium pratense"*
- Le score de fertilité se réincrémente avec micro-animation

## Plan technique

### Fichiers à créer

- `src/lib/ecologicalFunctions.ts` — référentiel des 12 tags + métadonnées (label, icône, gradient, narration template, formule de score si applicable)
- `src/lib/ecologicalFunctionsClassification.ts` — `classifyFunctions(input): EcoFunction[]` (KB + famille + iconic)
- `src/data/species-knowledge-base.json` — ajout champ `functions: string[]` (incrémental, démarre avec ~150 entrées canoniques)
- `src/hooks/useEcologicalFunctions.ts` — fusion KB + curations + obs, retourne buckets `{tag → species[]}` + counts
- `src/components/biodiversity/EcologicalJourneyCarousel.tsx` — carrousel "Partons à la découverte de…"
- `src/components/biodiversity/EcologicalConstellationDrawer.tsx` — constellation interactive par tag
- `src/components/biodiversity/FertilityIndexGauge.tsx` — jauge fertilité animée
- `src/components/public/EcologicalStoryCards.tsx` — bande-annonce swipable page publique

### Migration DB (optionnelle, phase 2)

- Étendre `exploration_curations` pour stocker `functions: text[]` (à côté de `category`) — permet à un curateur d'ajouter/retirer un tag par espèce.

### Pas de bouleversement

- Aucune modification des catégories existantes ni des niveaux trophiques.
- Couche **additive**, désactivable par section/marche si besoin.
- Compatible avec sobriété informationnelle (carrousel = 1 ligne, sous-vues à la demande).

## Phasage suggéré

**Phase A — Socle (1 session)** : référentiel + classificateur + hook + carrousel sur fiche exploration (compteurs cliquables, drawer simple).
**Phase B — Constellation + score** : drawer animé + jauge fertilité.
**Phase C — Public storytelling** : cards swipables sur `/m/:slug` + animations realtime.
**Phase D — Curation** : UI L'œil pour éditer les tags par espèce + migration DB.

## Questions ouvertes avant de partir

1. **Périmètre des tags** : OK avec les 12 proposés
2. **Formule "Indice de fertilité"** : tu valides l'approche pondérée simple + formule plus poussée (intégrant diversité Shannon, surface couverte, etc.) ?
3. **Phase à attaquer en premier** : je propose Phase A pour avoir un premier rendu visible rapidement et itérer : OUI