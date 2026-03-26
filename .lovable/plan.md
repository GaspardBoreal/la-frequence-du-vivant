

# Palette de couleurs enrichie — Sortir du "tout vert"

## Probleme

Tout est vert-sur-vert fonce : header, fond, cartes, textes, badges, tabs. L'interface manque de contraste et de respiration visuelle.

## Strategie design

Introduire des surfaces **blanc translucide / gris clair** pour les cartes de contenu, tout en gardant le fond sombre emeraude comme toile de fond. L'effet : les cartes "flottent" avec elegance sur le fond naturel.

```text
AVANT                          APRES
┌──────────────────┐          ┌──────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │          │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← header sombre (inchange)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │          │ ░░░░░░░░░░░░░░░ │  ← tabs sur fond plus clair
│ ▓▓ carte verte ▓▓ │          │ ████████████████ │  ← carte blanche/frost
│ ▓▓ carte verte ▓▓ │          │ ████████████████ │  ← carte blanche/frost
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │          │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────┘          └──────────────────┘
```

## Changements par composant

### 1. FrequenceWave — Carte "frost" lumineuse
- Fond : `bg-white/[0.08]` → `bg-white/[0.12] border-white/20`
- Texte "Ma Frequence du jour" : `text-emerald-200/50` → `text-white/70`
- Score : `text-white font-bold`

### 2. ProgressionCard — Surface blanche elevee
- Fond : `bg-white/10` → `bg-white/[0.14] backdrop-blur-lg`
- Bordure : plus prononcee `border-white/25`
- Titre "Votre role actuel" : `text-white/80`
- Texte description : `text-white/60` (au lieu de emerald-200/60)
- Barre de progression : fond `bg-white/25` au lieu de `bg-white/20`
- Labels timeline : `text-white/70`

### 3. Quick Actions (Accueil) — Boutons bicolores
- Bouton "Mes marches" : fond `bg-white/[0.08]` border `border-white/15`, texte `text-white/80`
- Bouton "Quiz" : fond `bg-cyan-500/[0.08]` border `border-cyan-400/20`, texte `text-white/80`
- Hover : eleve a `bg-white/15`

### 4. MonEspaceTabBar (Desktop)
- Tabs inactifs : `text-white/40` → `text-white/50`
- Tab actif : conserver `text-emerald-300` mais indicateur blanc `bg-white/80` au lieu de `bg-emerald-400`

### 5. MonEspaceHeader — Touches de blanc
- Prenom : rester `text-white` (ok)
- Kigo accueil : `text-white/50` au lieu de `text-emerald-200/40`
- Compteur frequences : fond `bg-white/10 border-white/20` avec texte `text-white`

### 6. Page principale fond
- Fond de la zone de contenu (main) : ajouter un `bg-gradient-to-b from-white/[0.02] to-transparent` pour creer une zone de respiration sous les tabs

## Fichiers modifies

| Fichier | Modifications |
|---------|--------------|
| `FrequenceWave.tsx` | Fond + textes vers blanc/frost |
| `ProgressionCard.tsx` | Surface, textes, barre vers blanc eleve |
| `AccueilTab.tsx` | Quick actions bicolores, textes blancs |
| `MonEspaceTabBar.tsx` | Indicateur blanc, textes ajustes |
| `MonEspaceHeader.tsx` | Touches de blanc sur kigo + compteur |
| `MarchesDuVivantMonEspace.tsx` | Gradient subtil sur main |

## Resultat

L'identite naturelle emeraude du fond est preservee, mais les surfaces de contenu gagnent en luminosite et lisibilite grace a des fonds frost/blanc translucide. Le contraste apporte de l'elegance sans casser l'univers visuel.

