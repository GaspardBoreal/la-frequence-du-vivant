

## Fil chronologique des contributions — Onglet "Marcheurs"

### Objectif

Ajouter dans l'onglet **Marcheurs** de la page exploration un **fil chronologique des contributions publiques** (photos, sons, textes) avec avatar du contributeur, date/heure et tri ascendant/descendant. Design mobile-first, sobre et cohérent avec l'existant.

### Emplacement

Dans `MarcheursTab.tsx`, **entre le résumé (ligne "X marcheurs · Y contributions") et la liste des cartes marcheurs**. Un nouveau bloc "Fil des contributions" avec :
- Un en-tête compact : icône + titre "Contributions récentes" + le `SortToggle` existant (desc/asc)
- Une liste scrollable de vignettes contribution

### Design mobile-first

Chaque contribution = une ligne horizontale compacte :

```text
┌─────────────────────────────────────────────┐
│ [Avatar] Gaspard B. · 📷  10 avr. · 14:12  │
│          ┌──────┐                            │
│          │ mini │  IMG_1393                   │
│          └──────┘                            │
└─────────────────────────────────────────────┘
```

- **Avatar** (24px) avec fallback initiales
- **Prénom + initiale nom** pour la privacy
- **Icône type** (📷 photo, 🎙 son, 📖 texte)
- **Date relative** ou formatée ("10 avr. · 14:12")
- **Miniature** (48px arrondie) pour les photos, icône pour sons/textes
- Fond `bg-card` / `dark:bg-white/5`, border subtile, `rounded-xl`
- Animations Framer Motion en cascade (stagger)

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/components/community/exploration/ContributionsFeed.tsx` | **Nouveau** — composant du fil chronologique |
| `src/hooks/useExplorationContributions.ts` | **Nouveau** — hook React Query qui agrège medias + audios + textes avec profils |
| `src/components/community/exploration/MarcheursTab.tsx` | Import et affichage du `ContributionsFeed` entre le résumé et les cartes |

### Hook `useExplorationContributions`

- Requête les `marcheur_medias`, `marcheur_audio`, `marcheur_textes` (is_public = true) pour tous les `marche_event_ids` de l'exploration
- Joint `community_profiles` pour avatar/prénom/nom
- Retourne un tableau unifié `{ id, type, url, titre, prenom, nom, avatarUrl, createdAt }` trié par `createdAt` desc par défaut
- `staleTime: 30s`

### Composant `ContributionsFeed`

- Props : `explorationId`, `maxItems?: number` (défaut 20)
- State local `sort: 'desc' | 'asc'` avec le `SortToggle` existant
- Skeleton loading (3 lignes animées)
- État vide élégant si aucune contribution
- Les photos affichent une miniature cliquable (lightbox ou lien vers la photo)

### Aucune migration SQL nécessaire

Toutes les données existent déjà. On fait des `SELECT` sur les tables existantes avec les profils communautaires.

