## Diagnostic

La sheet `MediaAttributionSheet` reçoit `marcheurs={[]}` pour cette exploration parce que `useExplorationMarcheurs(explorationId)` ne lit que la table éditoriale `exploration_marcheurs` (les marcheurs "héros" mis en avant). Or :

- L'exploration `DEVIAT — Marcher sur un sol qui respire` n'a **0 ligne** dans `exploration_marcheurs`.
- Les vrais participants (≥9 user_id) vivent dans `marche_participations` via les `marche_events` rattachés à l'exploration.
- Résultat visible : on ouvre la modale, mais aucune fiche cliquable n'apparaît, donc on ne peut rien réattribuer.

Symptôme secondaire : même quand `exploration_marcheurs` est peuplée, elle ne contient en général qu'une poignée de personnes éditorialisées, jamais l'ensemble des marcheurs présents le jour J — donc l'ambassadeur ne peut pas réattribuer une photo à Marie‑Josée si elle n'est pas dans cette table.

## Objectif

Permettre à un ambassadeur / sentinelle / admin de **réattribuer une photo à n'importe quel participant validé** d'une marche de l'exploration, depuis :
- la mosaïque Convivialité (`ConvivialiteMosaic`)
- la lightbox de curation (`insights/curation/MediaLightbox`)
- la lightbox legacy fiche (`contributions/MediaLightbox` dans `MarcheDetailModal`)

## Solution

### 1. Nouveau hook `useExplorationParticipants(explorationId)`

Source unifiée pour le picker, qui agrège :
- `exploration_marcheurs` (les marcheurs éditorialisés — gardent leur avatar/couleur/role)
- **+ `marche_participations` joint à `community_profiles`** pour tous les événements `marche_events.exploration_id = X`
- Déduplication par `user_id` (un editorial + une participation = 1 entrée), priorité éditorial pour avatar/role.
- Champs retournés alignés sur `ExplorationMarcheur` (id, prenom, nom, fullName, avatarUrl, couleur, role, isPrincipal, ordre, source: 'editorial' | 'participant').

L'`id` exposé reste le `exploration_marcheurs.id` quand il existe ; sinon on génère un id stable basé sur `user_id` (préfixé `user:`). La RPC `reattribute_media` doit accepter ces deux formes — voir §3.

### 2. UX du picker (mobile-first, élégant)

Réécriture du corps de `MediaAttributionSheet` :

- **Tri alphabétique** strict par "Prénom Nom" (locale `fr`, sensitivité `base` pour ignorer accents/casse), au lieu de l'ordre éditorial actuel.
- **Recherche "contient"** insensible aux accents (normalisation NFD) sur `prenom`, `nom`, `fullName`. Champ de recherche **toujours visible** (≥ 3 personnes), pas seulement à partir de 6.
- **Index alphabétique latéral** (A‑Z) optionnel sur ≥ 20 entrées, avec scroll-to-letter — utile si l'événement compte 30+ marcheurs.
- **Sections** dans la liste :
  1. ⭐ "Suggéré" : l'uploader (souvent l'ambassadeur lui-même) et le crédit actuel.
  2. "Marcheurs éditorialisés" (si présents).
  3. "Tous les participants de la marche" (alphabétique).
- **État vide** clair : "Aucun participant trouvé pour cette exploration. Vérifiez que les inscriptions sont validées." (au lieu d'une simple ligne grise muette).
- **Skeletons** pendant le chargement (3 lignes shimmer) — aujourd'hui la sheet apparaît "vide" pendant le fetch, ce qui amplifie le bug perçu.
- Tap = sélection optimiste (radio visuel emerald), CTA "Confirmer" sticky en bas avec safe‑area, swipe‑down pour fermer (déjà fourni par Sheet).
- Avatar : photo si `avatarUrl`, sinon initiales colorées (couleur déterministe dérivée du nom, plus jolie que le fallback `#10b981` actuel).

### 3. Backend — adapter `reattribute_media`

La RPC actuelle attend un `_marcheur_id uuid` qui pointe sur `exploration_marcheurs.id`. Il faut autoriser deux formes :

- `exploration_marcheur_id` (comportement actuel) — colonne `attributed_marcheur_id`.
- ou `user_id` d'un participant validé — dans ce cas la RPC :
  1. cherche/insère un `exploration_marcheurs` "shadow" (non-`is_principal`, role `marcheur`, prenom/nom copiés depuis `community_profiles`) attaché à l'exploration,
  2. retourne son id et l'écrit dans `attributed_marcheur_id`.

Garde‑fous SQL :
- Vérifier que l'utilisateur courant est admin / ambassadeur / sentinelle de l'exploration (logique déjà en place — réutiliser `has_role` / `useIsCurator`).
- Vérifier que le `user_id` cible a bien une `marche_participations` validée sur un `marche_events.exploration_id = X`.
- `SECURITY DEFINER`, `SET search_path=public`.

Ainsi pas besoin de pré-créer 200 lignes éditoriales : la table `exploration_marcheurs` se densifie à la demande, uniquement quand un crédit est réellement attribué.

### 4. Câblage composants

- `ConvivialiteMosaic`, `insights/curation/MediaLightbox`, `contributions/MediaLightbox` : remplacer `useExplorationMarcheurs` par `useExplorationParticipants` **uniquement** pour le picker. Les autres usages (avatars, profils marcheurs principaux, observations) gardent `useExplorationMarcheurs`.
- `MarcheDetailModal` : idem, passer la liste enrichie comme prop `marcheurs` à la lightbox.
- L'invalidation cache de `useReattributeMedia` ajoute la clé `['exploration-participants', explorationId]`.

### 5. Renforcement visibilité auteur (Copie 2)

Pour la lightbox `contributions/MediaLightbox` (vue fiche legacy), aligner le chip auteur sur le style "Copie 1" déjà appliqué à la mosaïque Convivialité : pill emerald `bg-emerald-600/90`, `shadow-lg`, `backdrop-blur`, ring emerald, taille `text-sm`, icône crayon visible quand `canEditCredit`. Aujourd'hui le nom est en `text-white/70` sans fond → illisible sur photos claires.

## Fichiers touchés

```text
src/hooks/useExplorationParticipants.ts            (NEW)
src/components/community/insights/curation/MediaAttributionSheet.tsx
src/components/community/exploration/convivialite/ConvivialiteMosaic.tsx
src/components/community/insights/curation/MediaLightbox.tsx
src/components/community/contributions/MediaLightbox.tsx
src/components/community/MarcheDetailModal.tsx
src/hooks/useReattributeMedia.ts                   (invalidation supplémentaire)
supabase/migrations/<timestamp>_reattribute_media_by_user.sql
```

## Vérification post‑build

Sur `/marches-du-vivant/mon-espace/exploration/70fcd8d1…` (ambassadeur connecté) :
1. Convivialité → ouvrir une photo → clic sur le chip auteur → la sheet liste les 9+ participants triés A→Z, recherche "mar" filtre Marie‑Josée, sélection + Confirmer met à jour le crédit.
2. Marches → fiche d'une marche → onglet Voir → photo → même comportement dans la lightbox legacy.
3. Recharger la page : le crédit attribué persiste partout (mosaïque, fiche, exports).
