
# Réattribuer une photo à son véritable auteur

## Le problème

Sur le terrain, c'est très souvent **l'ambassadeur** (ou la sentinelle) qui upload les photos pour tout le groupe. Résultat : toutes les photos s'affichent au crédit de l'uploader, alors qu'elles ont été prises par d'autres marcheurs (ex. la photo de l'orchidée pourpre prise par Marie‑Josée Daubigeon mais uploadée par Gaspard).

Aujourd'hui aucun écran ne permet de **corriger ce crédit**. Cette fonctionnalité est essentielle pour la justesse narrative et pour la valorisation individuelle de chaque marcheur·euse.

## Principe UX

Une **action discrète mais découvrable**, placée **dans le Lightbox** (point d'entrée naturel : on regarde la photo → on voit qui en est crédité → on corrige). Pas de nouvel écran, pas de menu enfoui — un simple geste depuis la photo elle-même.

```text
┌──────────────────────────────────┐
│ Photo plein écran                │
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤
│ [Avatar] Marie‑Josée D.   [✏️]  │  ← chip auteur cliquable (admin only)
│ ────────  Marcheuse              │
│                                  │
│ Étape 11 · ORIG…                 │
│ [mini-carte]                     │
└──────────────────────────────────┘
```

### Le geste de réattribution

Quand un **ambassadeur / sentinelle / admin** est connecté, le bloc « auteur » devient interactif :

- **Indice visuel** : petite icône crayon `✏️` à droite du nom + l'ensemble du chip prend un fond légèrement teinté au survol/tap, avec ring émeraude subtil.
- **Tap sur le chip** → ouvre une **bottom-sheet** (mobile-first), inspirée du `MediaPickerSheet` déjà existant dans le projet.

### La bottom-sheet « Crédit de la photo »

```text
╭──────────────────────────────────╮
│         ▬▬▬                      │  drag handle
│                                  │
│ Crédit de la photo               │
│ Qui a pris cette photo ?         │
│                                  │
│ 🔍 Rechercher un marcheur…       │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ● Gaspard Boréal     ☑ actuel│ │
│ │   Ambassadeur · uploader     │ │
│ ├──────────────────────────────┤ │
│ │ ○ Marie‑Josée Daubigeon      │ │
│ │   Marcheuse                  │ │
│ ├──────────────────────────────┤ │
│ │ ○ Anne Lefèvre               │ │
│ │   Scientifique               │ │
│ └──────────────────────────────┘ │
│                                  │
│ [Annuler]   [Confirmer le crédit]│
╰──────────────────────────────────╯
```

Détails UX :
- **Liste = tous les marcheurs de l'exploration** (`exploration_marcheurs`), triés par `ordre`, avec pastille couleur, rôle en sous-titre, avatar si présent.
- **Recherche live** dès 6+ marcheurs (utile pour les grands événements).
- **Marqueur visuel** sur l'auteur actuel + sur l'uploader d'origine (badge « uploader » discret en gris) — important pour la transparence et la traçabilité.
- **Option « Retirer le crédit »** en bas (lien texte gris) : restaure le comportement par défaut (= afficher l'uploader).
- **Confirmation optimiste** : la sheet se ferme immédiatement, le chip auteur du Lightbox se met à jour avec une animation flip discrète, toast `Photo créditée à Marie‑Josée Daubigeon`. Annulation possible via le toast.

### Mobile first

- Sheet plein écran < 640 px, hauteur 70 dvh, scroll interne.
- Items de liste 56 px de haut (cible tactile confortable).
- Bouton primaire collant en bas (safe-area iOS respectée).
- Sur desktop : même composant en modal centré (max-w-md).

### Découvrabilité non‑intrusive

- Pour les utilisateurs **sans droit**, aucun changement visible (chip non interactif, pas d'icône crayon).
- Pour ceux **avec droit**, un micro‑onboarding une seule fois : tooltip discret « Vous pouvez réattribuer cette photo » au premier ouverture du Lightbox (clé localStorage), puis silence.

## Portée fonctionnelle

S'applique aux deux galeries demandées :
1. **Marcheurs → Convivialité** (vue fiche / mur convivialité) → photos `exploration_convivialite_photos`.
2. **Marches → toutes les marches de l'événement** (vue fiche) → photos & vidéos `marcheur_medias`.

Dans les deux cas, on traverse le **MediaLightbox** existant (`src/components/community/insights/curation/MediaLightbox.tsx`), donc une seule intégration UI couvre les deux cas.

## Plan technique (résumé)

### 1. Migration SQL

Ajouter dans `marcheur_medias` et `exploration_convivialite_photos` une colonne :

```sql
attributed_marcheur_id uuid references exploration_marcheurs(id) on delete set null
```

- Ne touche **pas** à `user_id` (= uploader, traçabilité préservée).
- Index sur `attributed_marcheur_id`.
- RLS update policy : autorisée si `is_admin(auth.uid())` OR rôle `ambassadeur|sentinelle` sur l'exploration concernée.
- Idem pour `marcheur_audio` (cohérence — même bug latent).

### 2. RPC

`reattribute_media(_source text, _media_id uuid, _marcheur_id uuid | null)`
- Switch sur `_source` ∈ {`media`, `conv`, `audio`}.
- Vérifie côté serveur le droit (admin OR ambassadeur/sentinelle de l'exploration parente).
- Vérifie que `_marcheur_id` appartient bien à la même exploration.
- Met à jour la colonne, retourne la nouvelle ligne enrichie.

### 3. Hook React

`useReattributeMedia()` (mutation TanStack) :
- Optimistic update sur `['exploration-all-media', explorationId]` et `['convivialite-photos', explorationId]`.
- Invalidation au succès. Rollback + toast erreur sinon.

### 4. Enrichissement des données

Dans `useExplorationAllMedia.ts` et `useConvivialitePhotos.ts` :
- Sélectionner `attributed_marcheur_id`.
- Si présent → résoudre `prenom/nom` via la map `exploration_marcheurs` déjà chargée (passer `explorationId` au hook conv).
- `MediaItem.authorName` = nom attribué si défini, sinon nom uploader (comportement actuel).
- Ajouter `MediaItem.attributedMarcheurId` et `MediaItem.uploaderName` (pour afficher « uploader » dans la sheet).

### 5. Composants UI

- **Nouveau** : `src/components/community/insights/curation/MediaAttributionSheet.tsx` (bottom sheet shadcn `Sheet` `side="bottom"`).
- **Modifié** : `MediaLightbox.tsx`
  - Props : ajouter `canReattribute: boolean`, `marcheurs: ExplorationMarcheur[]`.
  - Rendre le bloc auteur interactif conditionnellement, ouvrir la sheet.
- **Modifiés (call sites)** : `MainCuration.tsx`, `ConvivialiteImmersiveView.tsx`, `MarcheDetailModal.tsx` (et `contributions/MediaLightbox.tsx` si on étend aussi le 2ᵉ lightbox legacy) — passer `canReattribute = isAdmin || ['ambassadeur','sentinelle'].includes(userRole)` et la liste des marcheurs (déjà disponible via `useExplorationMarcheurs`).

### 6. Garde-fous

- Sécurité : RLS + RPC `SECURITY DEFINER` (jamais de check côté client uniquement).
- Logging : insérer une trace dans une table `media_attribution_log` (qui a réattribué quoi à qui, quand) — utile en cas de litige ou abus. Pas exposée en UI dans cette première itération.
- Mémoriser un préférence légère : si l'admin attribue 3 photos d'affilée à la même personne, proposer un bouton « Tout attribuer à Marie‑Josée pour cette session » (V2 — pas dans cette itération).

## Fichiers impactés

- migration SQL nouvelle
- `src/integrations/supabase/types.ts` (régénéré)
- `src/hooks/useExplorationAllMedia.ts`
- `src/hooks/useConvivialitePhotos.ts`
- `src/hooks/useReattributeMedia.ts` (nouveau)
- `src/components/community/insights/curation/MediaLightbox.tsx`
- `src/components/community/insights/curation/MediaAttributionSheet.tsx` (nouveau)
- `src/components/community/insights/curation/MainCuration.tsx`
- `src/components/community/exploration/convivialite/ConvivialiteImmersiveView.tsx`
- `src/components/community/MarcheDetailModal.tsx`

## Hors périmètre (V2 possibles)

- Co-crédit (plusieurs marcheurs sur une même photo).
- Attribution en lot depuis une vue grille.
- Notification au marcheur crédité (« une photo a été attribuée à vous »).
