

# Onglet Marcheurs — Afficher les participants avec stats et engagement

## Diagnostic

L'onglet Marcheurs affiche un placeholder "Bientot disponible". Deux sources de donnees existent :

1. **`exploration_marcheurs`** — crew manuelle (lies a `marcheur_observations` pour la biodiversite)
2. **`marche_participations`** + **`community_profiles`** — marcheurs communautaires inscrits (lies a `marcheur_medias`, `marcheur_audio`, `marcheur_textes` via `marche_event_id`)

Les contributions des marcheurs communautaires sont dans 3 tables : `marcheur_medias` (photos/videos, champ `is_public`, `type_media`), `marcheur_audio` (sons), `marcheur_textes` (textes, champ `is_public`).

## Architecture

### 1. Nouveau hook `useExplorationParticipants`

Fusionne les deux sources pour une exploration donnee :

- Query `marche_participations` via le `marche_event_id` lie a l'exploration
- Query `community_profiles` pour les noms/avatars (pattern `.in()` existant)
- Query agregee sur `marcheur_medias` (count par user_id, filtre `is_public = true`, group by `type_media`), `marcheur_audio`, `marcheur_textes` pour les stats publiques
- Merge avec `exploration_marcheurs` + `marcheur_observations` (deja dans `useExplorationMarcheurs`)

Interface retournee :
```
MarcheurWithStats {
  id, prenom, nom, avatarUrl,
  source: 'community' | 'crew',
  role: string,
  stats: { photos, videos, sons, textes, speciesCount }
}
```

### 2. Nouveau composant `MarcheursTab.tsx`

Remplace le `ComingSoonPlaceholder` dans `ExplorationMarcheurPage.tsx`.

**Structure UI (mobile-first)** :

```text
┌─────────────────────────────────┐
│  🌿 8 marcheurs · 47 contrib.  │  Resume compact
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ 👤 Marie Dupont         │    │  Carte marcheur
│  │ Marcheuse               │    │
│  │ 📷 12  🎙 3  📖 2  🦎 8 │    │  Stats inline
│  │                         │    │
│  │ [Voir ses contributions] │    │  CTA vers onglet Marches filtre
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 👤 Paul Martin          │    │
│  │ ...                     │    │
│  └─────────────────────────┘    │
│                                 │
│ ─── Inviter un marcheur ─────  │
│                                 │
│  ┌─────────────────────────┐    │
│  │  🌱 Partagez cette      │    │  Bloc engagement
│  │  exploration avec un    │    │
│  │  ami marcheur !         │    │
│  │                         │    │
│  │  [📋 Copier le lien]    │    │
│  │  [📱 Partager]          │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Details de chaque carte marcheur** :
- Avatar (ou initiales) avec bordure couleur du role
- Prenom Nom + role
- 4 compteurs inline : 📷 photos publiques, 🎙 sons, 📖 textes, 🦎 especes observees
- Tri par nombre total de contributions (les plus actifs en haut)

**Bloc engagement en bas** :
- Bouton "Copier le lien" (Web Share API avec fallback clipboard)
- Message inspirant contextuel : "Chaque marcheur enrichit le recit collectif du vivant"
- Design emerald/amber gradient subtil

### 3. Modification de `ExplorationMarcheurPage.tsx`

- Importer et rendre `MarcheursTab` au lieu du placeholder
- Passer `effectiveExplorationId` et `marcheEventId`

## Fichiers impactes

| Fichier | Action |
|---|---|
| `src/hooks/useExplorationParticipants.ts` | **Nouveau** — hook fusionnant les 2 sources + stats |
| `src/components/community/exploration/MarcheursTab.tsx` | **Nouveau** — composant d'affichage |
| `src/components/community/ExplorationMarcheurPage.tsx` | **Modifier** — brancher MarcheursTab |

## UX inspirante pour l'engagement

- **Classement bienveillant** : pas de "1er, 2e" mais les plus actifs en haut naturellement
- **Micro-animation** : compteurs qui s'incrementent au chargement (framer-motion)
- **Partage natif** : utilise `navigator.share()` sur mobile avec un message poetique pre-rempli ("Rejoins-moi sur les Marches du Vivant...")
- **Empty state elegant** : si aucun participant, message "Soyez le premier a documenter cette exploration" avec CTA vers l'onglet Marches

