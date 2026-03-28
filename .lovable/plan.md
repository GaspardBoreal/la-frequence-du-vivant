

# Visionneuse plein ecran avec navigation swipe pour mobile

## Objectif

Permettre au marcheur de visualiser chaque media (photo/video) en grand sur mobile, avec navigation precedent/suivant par swipe ou boutons, tout en respectant la visibilite public/prive.

## Approche

Creer un composant `MediaLightbox` leger et immersif :

```text
┌─────────────────────────────┐
│  ✕                   2 / 8  │  ← compteur + fermer
│                             │
│                             │
│    ◀   [ PHOTO PLEIN ]  ▶   │  ← swipe ou tap bords
│                             │
│                             │
│  "Lever de brume"           │  ← titre optionnel
│  🔒 Privé · 12 mars 2026   │  ← badge visibilite + date
└─────────────────────────────┘
```

- **Swipe gauche/droite** (touch) pour naviguer sur mobile
- **Fleches clavier** sur desktop
- **Boutons chevron** semi-transparents sur les bords
- **Fond noir** avec media centre (object-contain)
- **Badge public/prive** discret en bas
- Videos : lecteur natif avec controls

## Integration dans VoirTab

Chaque section (exploration, mes contributions, marcheurs) alimente un **tableau unique ordonne** de medias visibles. Quand l'utilisateur tape sur une miniature, le lightbox s'ouvre a l'index correspondant dans ce tableau. La navigation parcourt tous les medias autorises de la marche en cours.

Regles de visibilite dans le tableau :
- Admin photos → toujours inclus
- Mes contributions → toujours inclus (meme prives)
- Contributions des autres → uniquement `is_public = true`

## Fichiers impactes

| Fichier | Changement |
|---------|-----------|
| `src/components/community/contributions/MediaLightbox.tsx` | **Nouveau** — composant fullscreen avec swipe (touch events), fleches, compteur, badge visibilite, titre |
| `src/components/community/MarcheDetailModal.tsx` | Dans `VoirTab` : construire le tableau de medias visibles, passer `onClick` sur chaque miniature pour ouvrir le lightbox a l'index, rendre le lightbox conditionnellement |

## Details techniques

- Swipe : `onTouchStart` / `onTouchEnd` natifs (delta X > 50px = navigation), zero dependance
- Le lightbox recoit `items: Array<{url, type, titre, isPublic, isOwner}>` + `startIndex`
- Animation entree/sortie via framer-motion (fade + scale)
- `position: fixed inset-0 z-[60]` pour passer au-dessus de la modale
- Sur mobile, les boutons chevron sont caches au profit du swipe ; sur desktop, ils sont visibles au hover

