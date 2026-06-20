# Compteurs biodiversité dynamiques · Patio ISEG

## Source de données
- Event identifié : **BORDEAUX / Patio végétalisé ISEG** → `exploration_id = 75e1bb5f-030c-4448-97b6-eeffef2e2dc8`
- Hook réutilisé : `useExplorationSpeciesCount(explorationId, { realtime: true })` — RPC `get_exploration_species_count` (fusion snapshots + marcheur_observations, dédoublonnée).
- Renvoie `total` + `by_kingdom { animalia, plantae, fungi, others }` → mapping direct sur Espèces / Faune / Flore / Champignons / Autre.

## Insertion (scope strict : uniquement bas de la section Biodiv)
Nouveau composant inline `PatioBiodivLiveCounters` placé **dans `BiodivSection`** de `src/pages/IsegcomBordeaux.tsx`, juste **après** la grille `Observer / Identifier / Restituer` et **avant** le CTA "Voir l'expérience biodiversité dans l'app". Rien d'autre n'est modifié.

## Direction artistique « hyper wahouhh »
Bloc éditorial encadré, sur fond crème, qui prolonge le hero :

```text
┌────────────────────────────────────────────────────────────┐
│  ● EN DIRECT DU PATIO            mis à jour il y a Xs       │
│                                                            │
│       Le Vivant compte —                                   │
│       et il compte vite.                                   │
│                                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │  22  │ │   2  │ │   8  │ │   0  │ │  12  │              │
│  │Espèces│ │Faune │ │Flore │ │Champ.│ │Autre │              │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                            │
│  Données collectées par la promo via iNaturalist ·         │
│  rafraîchies en temps réel.                                │
└────────────────────────────────────────────────────────────┘
```

- Carte large `rounded-3xl` fond `#0d6b58` (forêt profonde), filet doré `#c9a961/30`, ombre douce — contraste fort avec le crème de la page
- Pastille « EN DIRECT » : point doré pulsant + texte uppercase tracking-wide
- Titre Crimson Pro italique doré + cream
- 5 tuiles `bg-white/5 backdrop-blur border-white/10 rounded-2xl`, chiffres serif XXL en dégradé (émeraude clair pour total, sky/green/amber/purple pour catégories — alignés sur `categoryConfig` existant), pictos Lucide (Layers, Bird, TreePine, Leaf, Bug)
- Compteurs animés via `useAnimatedCounter` (rampe 0→N en 1.2s, déclenchés en entrée viewport via `framer-motion`)
- Skeleton shimmer pendant le chargement RPC
- Si erreur RPC → tuiles affichent `—` (pas de crash, pas d'alerte rouge)
- Realtime ON : si un marcheur ajoute une obs, les chiffres incrémentent en live

## Fichier touché
- `src/pages/IsegcomBordeaux.tsx` — ajout d'un import (`useExplorationSpeciesCount`, `useAnimatedCounter`, `motion`, icônes), définition d'un sous-composant local `PatioBiodivLiveCounters` avec la constante `PATIO_ISEG_EXPLORATION_ID`, et insertion d'une ligne dans `BiodivSection`.

Aucune autre section, aucun autre fichier, aucune migration.
