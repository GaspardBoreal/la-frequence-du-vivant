
# Evolution "WAHOU" de la Page d'Accueil

## Vision Creatrice

Transformer les trois vignettes statiques (Bioacoustique, Territoires, Poesie) en **Portails Vivants** - des cartes interactives qui respirent, reagissent et invitent a l'immersion dans l'univers de La Frequence du Vivant.

---

## Concept : Les Trois Portails du Vivant

Chaque vignette devient un **micro-ecosysteme anime** avec sa propre signature visuelle et comportementale :

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐             │
│   │ ♪ ♫ ♪ ♫ ♪ ♫ ♪   │   │    ·  ·  ·     │   │   ~ ~ ~ ~ ~     │             │
│   │   ▃▅▇▅▃▅▇▅▃     │   │   /  \  /  \   │   │  ✦ haiku ✦      │             │
│   │   ▃▅▇▅▃▅▇▅▃     │   │  ·    ·    ·   │   │   flottant      │             │
│   │ BIOACOUSTIQUE   │   │  TERRITOIRES   │   │    POESIE       │             │
│   │  Frequences     │   │  Cartographie  │   │   Fragments     │             │
│   │  organiques     │   │  floue         │   │   ephemeres     │             │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘             │
│                                                                                │
│   ← Hover : Zoom + Glow                       Click : Transition fluide →     │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Les Trois Portails

### 1. BIOACOUSTIQUE - "L'Onde Vivante"

**Signature visuelle** : Visualiseur audio ambient permanent

- **Animation** : Barres verticales qui oscillent en continu (simulation de frequences)
- **Couleur** : Gradient cyan-emeraude (couleurs de l'eau)
- **Hover** : Les barres s'intensifient, glow cyan pulse
- **Element unique** : Cercles concentriques qui emanent du centre (comme des ondes sonores)

```text
┌─────────────────────────────────────┐
│                                     │
│        ◌   ◌   ◌   ◌   ◌           │  ← Cercles concentriques animees
│      ◌                   ◌          │
│    ◌    ▃ ▅ ▇ █ ▇ ▅ ▃    ◌        │  ← Visualiseur audio
│      ◌                   ◌          │
│        ◌   ◌   ◌   ◌   ◌           │
│                                     │
│   ✧ BIOACOUSTIQUE ✧                │
│   Ecouter les frequences            │
│   du monde vivant                   │
│                                     │
│   ─────────────────────             │  ← Ligne de progression animee
└─────────────────────────────────────┘
```

### 2. TERRITOIRES - "La Carte Floue"

**Signature visuelle** : Reseau de points interconnectes (comme une constellation ou une carte neuronale)

- **Animation** : Points qui flottent lentement, lignes de connexion qui apparaissent/disparaissent
- **Couleur** : Gradient ambre-dore (couleurs de la terre)
- **Hover** : Les connexions se densifient, revele une "carte cachee"
- **Element unique** : Petit curseur qui "marche" le long des chemins

```text
┌─────────────────────────────────────┐
│                                     │
│       ·━━━·         ·               │
│      ╱    ╲       ╱ │               │
│     ·      ·━━━━·   ·               │  ← Reseau de points connectes
│      ╲    ╱       ╲                 │
│       ·━━·━━━━━━━━·                 │
│           ↑                         │  ← Marcheur anime
│                                     │
│   ✧ TERRITOIRES ✧                  │
│   Marcher les cartes                │
│   sensibles                         │
│                                     │
└─────────────────────────────────────┘
```

### 3. POESIE - "Le Fragment Ephemere"

**Signature visuelle** : Haikus flottants avec effet de machine a ecrire

- **Animation** : Vers qui apparaissent/disparaissent en fondu, rotation lente de fragments poetiques
- **Couleur** : Gradient rose-violet (couleurs de l'aube)
- **Hover** : Le texte actuel se "cristallise" (devient plus net), nouveaux vers emergent
- **Element unique** : Plumes/feuilles qui tombent doucement en arriere-plan

```text
┌─────────────────────────────────────┐
│                                     │
│     🍂        ✧        🍂          │  ← Feuilles qui tombent
│                                     │
│    « La riviere murmure            │
│      des mots que seuls            │  ← Haiku en apparition
│      les arbres entendent »         │
│                                     │
│           ─ ─ ─ ─ ─                 │  ← Tirets typographiques animes
│                                     │
│   ✧ POESIE ✧                       │
│   Fragments du vivant               │
│                                     │
└─────────────────────────────────────┘
```

---

## Architecture Technique

### Nouveaux composants a creer

| Composant | Description |
|-----------|-------------|
| `src/components/home/PortalCard.tsx` | Wrapper commun avec hover/glow/transitions |
| `src/components/home/BioacousticPortal.tsx` | Portail avec visualiseur audio anime |
| `src/components/home/TerritoryPortal.tsx` | Portail avec reseau de points connectes |
| `src/components/home/PoetryPortal.tsx` | Portail avec haikus flottants |
| `src/components/home/SoundWaveVisualizer.tsx` | Visualiseur de frequences ambient |
| `src/components/home/ConstellationNetwork.tsx` | Reseau de points anime |
| `src/components/home/FloatingHaiku.tsx` | Fragment poetique avec machine a ecrire |

### Fichier modifie

| Fichier | Modifications |
|---------|---------------|
| `src/pages/Index.tsx` | Remplacer les cartes statiques par les 3 portails |

---

## Details Techniques

### 1. `PortalCard.tsx` - Conteneur Magique

Base commune pour les trois portails :
- Glassmorphism avec `backdrop-blur-xl`
- Bordure animee avec gradient rotatif (border glow)
- Transition `scale(1.03)` et `shadow-2xl` au hover
- Ring lumineux pulse au hover
- Cursor personalise (pointer avec glow)

```text
Structure :
┌────────────────────────────────────────┐
│  ↻ Gradient border rotatif             │
│  ┌──────────────────────────────────┐  │
│  │  Contenu anime (enfant)          │  │
│  │                                  │  │
│  │  ─────────────────               │  │
│  │  Titre + Description             │  │
│  │                                  │  │
│  │  [Indicateur hover: → Entrer]    │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### 2. `SoundWaveVisualizer.tsx` - Frequences Vivantes

Inspire du `EcoAudioVisualizer.tsx` existant mais en mode "ambient" (toujours anime) :

- 24 barres verticales avec hauteurs aleatoires
- Animation continue avec `setInterval` (200ms)
- Vitesse douce, amplitude moderee (pas agressif)
- Gradient vertical : base emeraude → pointe cyan
- Au hover : amplitude x1.5, couleurs plus vives

### 3. `ConstellationNetwork.tsx` - Carte Vivante

Reseau de points connectes anime en canvas ou SVG :

- 12-15 points positionnes aleatoirement
- Lignes de connexion entre points proches (<150px)
- Points qui derivent lentement (dx, dy aleatoires)
- Au hover : nouvelles connexions apparaissent (seuil de distance augmente)
- Un "marcheur" (point plus gros) qui se deplace de noeud en noeud

### 4. `FloatingHaiku.tsx` - Poesie Ephemere

Rotation de fragments poetiques :

- Pool de 5-6 haikus/vers courts
- Un vers affiche a la fois, change toutes les 6 secondes
- Effet machine a ecrire pour l'apparition
- Fade out doux avant le changement
- Petites particules (feuilles/plumes stylisees) qui tombent en arriere-plan

---

## Animations CSS a ajouter

```text
@keyframes border-glow-rotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes ring-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
}

@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes leaf-fall {
  0% { transform: translateY(-10%) rotate(0deg); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { transform: translateY(110%) rotate(180deg); opacity: 0; }
}
```

---

## Experience Utilisateur

### Entree sur la page

1. Les trois portails apparaissent avec un leger decalage (stagger animation)
2. Les animations internes demarrent progressivement
3. Atmosphere immediate de "monde vivant" qui respire

### Interaction hover

1. Portail s'eleve legerement (`translateY(-8px)`)
2. Glow intensifie autour de la carte
3. Animation interne s'accelere/s'intensifie
4. Texte "Entrer dans ce monde" apparait en fondu
5. Cursor devient plus lumineux

### Click/Tap

1. Effet "ripple" depuis le point de clic
2. Le portail s'agrandit legerement puis transition vers la page cible
3. Les autres portails s'effacent doucement

---

## Responsive Design

**Desktop (3 colonnes)** :
- Portails cote a cote, taille genereuse
- Animations completes

**Tablet (2 colonnes)** :
- 2 portails en haut, 1 centre en bas
- Animations maintenues

**Mobile (1 colonne)** :
- Portails empiles verticalement
- Animations simplifiees (performance)
- Touch : tap-to-reveal puis tap-to-enter

---

## Haikus pour le Portail Poesie

Exemples de fragments poetiques a faire tourner :

1. *« La riviere murmure / des mots que seuls les arbres / savent ecouter »*
2. *« Sous l'ecorce ancienne / mille vies invisibles / tissent leur silence »*
3. *« Le heron s'envole / emportant dans son reflet / un morceau de ciel »*
4. *« Feuilles de chene / tombant sur l'eau sombre / lettres de la foret »*
5. *« Entre deux rives / la Dordogne chante / ce que nous oublions »*

---

## Verification

1. Ouvrir la page d'accueil (`/`)
2. Observer les trois portails avec leurs animations distinctes
3. Hover sur chaque portail : verifier l'intensification des effets
4. Cliquer : verifier la transition fluide
5. Tester sur mobile : verifier les adaptations responsive
6. Verifier les performances (pas de lag meme avec animations)
