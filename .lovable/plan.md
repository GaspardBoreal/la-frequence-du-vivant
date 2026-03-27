

# Widget "Fréquence du jour" : Citation vivante + onde bioacoustique

## Concept

Transformer le widget vide en une expérience poétique quotidienne : une citation inspirante (biodiversité, bioacoustique, géopoétique) qui pulse avec l'onde sonore animée, changeant chaque jour automatiquement.

## Design

```text
┌─────────────────────────────────────┐
│  « Le chant du merle noir dessine   │
│    la carte d'un territoire         │
│    invisible. »                     │
│         — Rachel Carson             │
│                                     │
│  ▎▍▌▋█▊▉█▋▌▍▎▏▎▍▌▋█▊▉█▋▌▍▎      │
│                                     │
│  Ma Fréquence du jour       ★ 9    │
└─────────────────────────────────────┘
```

- Citation en italique, police Crimson, fondu enchaîné élégant
- L'onde animée reste en dessous, plus haute (h-20 au lieu de h-16) pour plus d'impact
- Rotation quotidienne basée sur `dayOfYear % nbCitations`
- ~30 citations couvrant les 3 piliers : biodiversité, bioacoustique, géopoétique

## Exemples de citations

- *"Le chant du merle noir dessine la carte d'un territoire invisible."* — Rachel Carson
- *"Écouter la forêt, c'est lire un livre dont chaque page est un son."* — Bernie Krause
- *"La terre a une peau, et cette peau a des maladies. L'une de ces maladies s'appelle l'homme."* — Nietzsche
- *"Chaque promenade dans la nature est une prière."* — John Muir
- *"Le silence de la nature est sa plus belle conversation."* — Bashō

## Modifications

| Fichier | Changement |
|---------|-----------|
| `src/components/community/FrequenceWave.tsx` | Ajouter un tableau de ~30 citations avec auteur et pilier, sélection par jour, affichage animé au-dessus de l'onde, augmenter la hauteur des barres |

## Détails techniques

- Sélection déterministe : `new Date().getFullYear() * 366 + dayOfYear` modulo nombre de citations
- Animation Framer Motion : `AnimatePresence` avec fondu sur la citation
- Citation en `font-crimson italic text-white/90 text-sm text-center`
- Auteur en `text-white/50 text-xs`
- Pas de dépendance externe ni de requête réseau

