

# Fond clair premium pour la zone de contenu

## Concept

Passer d'un "tout vert sombre" a un split design : **header + tabs restent sombres** (identite forte), la **zone de contenu passe en fond blanc/gris tres clair** avec des cartes a ombres douces. Effet "app mobile premium" immediat.

```text
┌──────────────────────────────┐
│ ██ HEADER SOMBRE (inchange) ██│  bg-emerald-950
├──────────────────────────────┤
│ ██ TABS SOMBRES (inchange)  ██│  bg-emerald-950/60
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │  Carte blanche ombre   │  │  bg-white rounded-2xl shadow
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │  bg-slate-50/gray-50
│  │  Carte blanche ombre   │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

## Changements

### 1. `MarchesDuVivantMonEspace.tsx` — Zone main
- Fond principal : garder le gradient emerald **uniquement sur header+tabs**
- Zone `<main>` : `bg-gray-50 rounded-t-3xl -mt-1` pour creer un effet de "panneau clair" qui glisse sous les tabs sombres

### 2. `FrequenceWave.tsx` — Carte sur fond clair
- Fond : `bg-white shadow-lg shadow-emerald-500/5 border border-gray-100`
- Textes : `text-gray-500` (label), `text-gray-900 font-bold` (score)
- Barres SVG : conserver les gradients de couleur role (contraste sur blanc)

### 3. `ProgressionCard.tsx` — Carte blanche elegante
- Fond : `bg-white shadow-lg shadow-emerald-500/5 border border-gray-100`
- Textes : `text-gray-500` (labels), `text-gray-900` (titre role), `text-gray-600` (description)
- Barre progression : fond `bg-gray-200`, fill gradient emerald (inchange)
- Timeline roles : icones avec fonds pastel (`bg-emerald-50`, `bg-teal-50`, etc.)
- Textes timeline : `text-gray-600`

### 4. `AccueilTab.tsx` — Boutons d'action sur fond clair
- Fond boutons : `bg-white border border-gray-200 shadow-sm hover:shadow-md`
- Icones : garder les couleurs emerald/cyan sur fond pastel
- Textes : `text-gray-700`

### 5. `MarchesTab.tsx` — Cartes marches sur fond clair
- QR CTA : `bg-white border border-gray-200 shadow-sm`
- Cartes marches : `bg-white border border-gray-100 shadow-sm` (non inscrit), `bg-emerald-50 border border-emerald-200` (inscrit)
- Textes : `text-gray-900` (titres), `text-gray-500` (meta), `text-emerald-600` (dates)
- Bouton inscription : `bg-emerald-600 hover:bg-emerald-500` (inchange)
- Titres de section : `text-gray-900`

### 6. `QuizInteractif.tsx` — Adaptation fond clair
- Conteneur : `bg-white rounded-2xl shadow-lg border border-gray-100`
- Textes questions : `text-gray-900`
- Options : `bg-gray-50 border border-gray-200 hover:border-emerald-400`
- Correct : `bg-emerald-50 border-emerald-400`
- Incorrect : `bg-red-50 border-red-300`

### 7. `PlaceholderTab.tsx` — Placeholders elegants
- Fond : `bg-white border border-gray-100 shadow-sm`
- Icone : fond pastel selon le type (`bg-emerald-50`, `bg-cyan-50`, etc.)
- Textes : `text-gray-900` (titre), `text-gray-500` (description)
- Badge "Bientot" : `bg-gray-100 text-gray-400`

### 8. `MonEspaceTabBar.tsx` — Mobile bottom bar
- Mobile : rester sombre (c'est un element de navigation systeme)
- Desktop tabs : rester sombres (colles au header)
- Aucun changement necessaire

## Fichiers modifies

| Fichier | Nature |
|---------|--------|
| `MarchesDuVivantMonEspace.tsx` | Main zone fond clair avec `rounded-t-3xl` |
| `FrequenceWave.tsx` | Carte blanche, textes sombres |
| `ProgressionCard.tsx` | Carte blanche, timeline pastel |
| `AccueilTab.tsx` | Boutons blancs ombrés |
| `MarchesTab.tsx` | Cartes blanches, textes sombres |
| `QuizInteractif.tsx` | Conteneur blanc, options claires |
| `PlaceholderTab.tsx` | Fond blanc, accents pastel |

## Resultat

Contraste fort header sombre / contenu clair. Les cartes blanches avec ombres douces creent un effet "app native iOS/Android" premium. Les couleurs emerald deviennent des accents precieux sur fond clair au lieu de se noyer dans le vert.

