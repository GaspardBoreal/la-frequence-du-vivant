

# Marcheurs — Affordance visuelle + drawer enrichi

## Problemes identifies

1. **Aucun indice visuel** que les cartes sont cliquables. L'utilisateur ne devine pas qu'il peut decouvrir les contributions en tapant la fiche.
2. **Drawer vide pour les community members** : il ne montre que les especes (toujours vide pour les marcheurs communautaires), pas leurs contributions reelles (photos, sons, textes).

## Solution

### 1. Hint visuel "Voir les contributions"

Ajouter sous chaque carte marcheur qui a des contributions un **micro-bandeau cliquable** anime :

```text
┌─────────────────────────────────────────────┐
│  👤 Gaspard Boreal          📷54  🎙2  📖1  │
│      Marcheur En Devenir                  ▾ │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  🌿 Voir ses contributions · 57 partages    │  ← NEW : bandeau emerald subtil
└─────────────────────────────────────────────┘
```

- Texte emerald `text-[10px]` avec icone `Leaf` + pulse animation douce
- Disparait quand la carte est depliee
- Si aucune contribution, pas de bandeau (la carte reste statique, pas de chevron)

### 2. Drawer enrichi avec contributions reelles

Quand le drawer s'ouvre, afficher **deux sections** :

**Section A — Contributions partagees** (photos, sons, textes)
- Galerie horizontale scrollable des 6 dernieres photos publiques (thumbnails rondes 48px)
- Compteurs inline : "54 photos · 2 sons · 1 texte partagés"
- Si aucune contribution : ne pas afficher cette section

**Section B — Especes identifiees** (existant, inchange)
- Garde le `SpeciesDrawer` actuel pour les marcheurs crew qui ont des observations
- Pour les marcheurs community sans especes, afficher un message encourageant different : "Identifiez les especes rencontrees lors de vos marches via l'onglet Vivant"

### 3. Donnees : fetcher les dernieres photos dans le drawer

Le drawer a besoin des URLs des dernieres photos publiques du marcheur. Deux options :
- **Option retenue** : query on-demand quand le drawer s'ouvre, via un petit hook `useQuery` avec `enabled: isExpanded`. Requete legere : `marcheur_medias` filtre par `user_id`, `is_public=true`, `type_media='photo'`, `order('created_at', desc)`, `limit(6)` — retourne juste `url_fichier, external_url, titre`.

### 4. Extraction du user_id depuis l'id marcheur

L'id marcheur est formate `community-{userId}` ou `crew-{crewId}`. Pour les community members, extraire le `userId` pour la query photos. Pour les crew members, pas de query photos (ils n'ont pas de `user_id` dans `marcheur_medias`).

## Fichiers impactes

| Fichier | Action |
|---|---|
| `src/components/community/exploration/MarcheursTab.tsx` | Ajouter bandeau hint, galerie photos dans drawer, query on-demand photos |

## Ce qui ne change PAS

- Le hook `useExplorationParticipants` — stats deja correctes
- Le `SpeciesDrawer` — conserve tel quel, deplace apres la galerie photos
- Le bloc engagement "Invitez un marcheur" en bas
- Les autres onglets

