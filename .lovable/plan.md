## Objectif

Dans la vue **Marcheurs → Marcheurs** (`MarcheursTab.tsx`), pour chaque marcheur ayant un témoignage dans `event_testimonies` :

1. Afficher un **badge compteur** sur la ligne fermée (à côté des badges Camera / Headphones / Feather / Leaf).
2. Ajouter un **sous-onglet "Témoignage"** entre `Textes` et `Contributions`, présentant la citation de manière hyper élégante (carte poétique).

---

## 1. Picto proposé — `Quote` (lucide-react)

Recommandation : **icône `Quote` de lucide-react**, en **rose/fuchsia** (`text-rose-400`), pour se distinguer des 4 catégories existantes :

| Catégorie | Icône | Couleur |
|-----------|-------|---------|
| Observations | Camera | emerald |
| Écoute | Headphones | violet |
| Textes | Feather | amber-400 |
| **Témoignage** | **Quote** | **rose-400** |
| Contributions | Leaf | amber-500 |

`Quote` est universellement reconnu comme « parole rapportée », sobre, cohérent avec la famille lucide déjà utilisée. Comme un marcheur n'a au plus qu'**un seul témoignage**, le badge affichera juste l'icône (sans chiffre) ou `1` selon la convention voulue.

Alternatives possibles si tu préfères : `MessageCircleHeart` (chaleureux), `MessageSquareQuote` (explicite), `Sparkles` (poétique).

---

## 2. Changements dans `MarcheursTab.tsx`

### a) Hook compteur de témoignages
Récupérer en une requête tous les `event_testimonies` (par `user_id`) pour les events de l'exploration → exposer un Map `userId → testimony`. Soit via un nouveau hook léger `useExplorationTestimoniesByUser(explorationEventIds)`, soit en réutilisant `useExplorationTestimonies` déjà créé (qui agrège déjà tous les témoignages de l'exploration) et en mémoïsant un index par `user_id`.

### b) Badge fermé (ligne ~1071-1096)
Ajouter après le badge `textesCount` :
```tsx
{hasTestimony && (
  <div className="...rounded-full..." title="A laissé un témoignage">
    <Quote className="w-3 h-3 text-rose-400" />
  </div>
)}
```

### c) Sous-onglet (ligne 829-832)
Insérer entre `textes` et `contributions` :
```ts
{ key: 'temoignage', label: 'Témoignage', icon: Quote }
```
Et n'afficher l'onglet que si `hasTestimony` (filtrer `subTabConfig` par marcheur).

### d) Composant `TemoignageSubTab` — design élégant

```text
┌────────────────────────────────────────────┐
│        ❝  (Quote icon, large, rose/30)     │
│                                            │
│   « C'était vraiment cette notion d'être   │
│     à la rencontre des autres... »         │
│                                            │
│              — Sophie D                    │
└────────────────────────────────────────────┘
```

- Fond : `bg-gradient-to-br from-rose-500/5 via-transparent to-amber-500/5`
- Bordure douce : `border border-rose-500/10`
- Quote icon décorative (40px, opacity-20) en haut-gauche
- Citation en `font-serif italic text-base leading-relaxed`
- Signature `— Prénom Nom` en `text-xs text-muted-foreground` à droite
- Animation : `motion.div` avec `initial opacity-0 y-4` → entrée douce
- Padding généreux (`p-6`) pour respirer

### e) Étendre `hasContent`
Inclure `hasTestimony` pour permettre l'expand des marcheurs n'ayant *que* un témoignage.

---

## Fichiers modifiés
- `src/components/community/exploration/MarcheursTab.tsx` — badge + sous-onglet + nouveau sous-composant `TemoignageSubTab`

Aucune modification DB ni d'autre composant requis (les témoignages sont déjà en base).
