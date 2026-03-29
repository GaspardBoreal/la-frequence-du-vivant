

# Navigation rapide entre marches — Sélecteur complémentaire

## Constat

Le `StepSelector` actuel offre une navigation séquentielle (◀ ▶) et des dots cliquables. C'est élégant pour 3-4 marches, mais pénible pour sauter de la 1 à la 7 ou de la 8 à la 3 sur une exploration de 10+ étapes.

## Solution : Tiroir déroulant "Jump to"

Ajouter un **mini-drawer** qui s'ouvre en tapant sur le label central "Étape 3/10" du StepSelector existant. Ce tiroir affiche la liste complète des marches dans un format compact et scrollable, permettant un saut direct.

```text
Avant (tap sur "Étape 3/10") :
┌──────────────────────────────┐
│  ◀   Étape 3/10  ▼   ▶      │  ← le ▼ indique que c'est tapable
│     🌿 Vouillé              │
│     ● ● ◉ ● ● ● ● ●        │
└──────────────────────────────┘

Après tap — drawer s'ouvre dessous :
┌──────────────────────────────┐
│  ◀   Étape 3/10  ▲   ▶      │
│     🌿 Vouillé              │
├──────────────────────────────┤
│  1  Départ Transhumance      │
│  2  Parc de la Gorande       │
│  3  Vouillé            ✓     │  ← active, highlight emerald
│  4  La Villedieu             │
│  5  Saint-Maixent            │
│  6  Niort                    │
│  7  Marais Poitevin          │
│  8  La Rochelle              │
└──────────────────────────────┘
```

## Comportement UX

- **Tap sur le label central** → toggle le drawer (ouvert/fermé)
- **Tap sur une marche dans la liste** → saut immédiat + fermeture du drawer
- **Indicateur visuel** : petite icône chevron-down à côté de "Étape X/Y" signalant l'interactivité
- **ScrollArea** limitée à `max-h-[200px]` pour ne pas envahir l'écran mobile
- **Animation** : slide-down fluide avec `framer-motion` (height auto)
- Les dots existants restent en dessous — rien n'est supprimé

## Design

- Fond glassmorphism cohérent avec le StepSelector (`bg-white/5 backdrop-blur`)
- Chaque ligne : numéro + nom de la marche, highlight emerald pour l'active
- Hover/tap feedback subtil
- Transition `AnimatePresence` pour l'ouverture/fermeture

## Fichier impacté

| Fichier | Action |
|---|---|
| `src/components/community/MarcheDetailModal.tsx` | Modifier `StepSelector` — ajouter état `isOpen`, drawer AnimatePresence, liste cliquable |

Aucun nouveau fichier. Le composant reste exporté et fonctionne dans les deux contextes (modal + page exploration).

