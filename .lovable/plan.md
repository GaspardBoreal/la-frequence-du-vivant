
# Fiche espèce unifiée — Apprendre → L'Œil

## Objectif

Remplacer la fiche actuelle (peu lisible : famille vide, "Vu le Invalid Date", traduction cassée, pas de marches, pas de carte, pas de liens GBIF/iNat) par la fiche riche déjà utilisée sur Empreinte/Synthèse, et y ajouter un nouvel onglet **Observateurs** listant les marcheurs ayant vu l'espèce sur l'événement.

## Résultat attendu

Quand on clique sur "Buddleja de David" depuis Apprendre → L'Œil :

- Hero photo plein cadre (carrousel si plusieurs photos) + lightbox.
- Nom FR + nom scientifique + badges (règne, "N obs. sur M marches").
- Bloc "Observé sur ces marches" avec **3 onglets** :
  - **Liste** — marches avec ville, date d'observation, nb d'obs.
  - **Carte** — points d'observation sur fond de toutes les marches de l'événement.
  - **Observateurs** *(nouveau)* — avatar + nom + marche + date pour chaque marcheur ayant observé l'espèce sur l'événement.
- Lecteur audio Xeno-Canto si disponible (faune sonore).
- Liens externes : GBIF, iNaturalist, Xeno-Canto.
- Mobile-first : modal scrollable, onglets pleine largeur, tap targets ≥ 44px.

## Plan d'implémentation

### 1. Unifier sur le modal riche (zéro régression)

Dans `src/components/community/insights/curation/OeilCuration.tsx` :
- Remplacer l'import et l'usage de `SpeciesDetailModal` par `SpeciesGalleryDetailModal`.
- Adapter `handleSpeciesClick` pour produire le shape attendu par le modal riche : `{ name, scientificName, count, kingdom, photos }`.
- Récupérer `allEventMarches` (déjà fait dans `EventBiodiversityTab` via `useQuery` sur `exploration_marches`) et l'extraire dans un petit hook réutilisable `useExplorationAllMarches(explorationId)`, puis le passer au modal pour la carte de fond.
- Supprimer le state `BiodiversitySpecies` devenu inutile.

Bénéfices immédiats : la date "Invalid Date" disparaît (le modal riche n'affiche pas ce champ), le nom FR fonctionne (`useSpeciesTranslation` + `useSpeciesPhoto`), les marches + carte + liens GBIF/iNat apparaissent.

### 2. Nouvel onglet "Observateurs"

#### 2a. Hook `useSpeciesObservers`

Nouveau fichier `src/hooks/useSpeciesObservers.ts` :
- Input : `scientificName`, `explorationId`.
- Étapes :
  1. Récupérer les `marche_id` de l'exploration (mêmes filtres `publication_status` que `useSpeciesMarches`).
  2. `select` sur `marcheur_observations` : `marcheur_id, marche_id, observation_date, photo_url` filtré `ilike species_scientific_name`.
  3. Récupérer infos marche (`nom_marche`, `ville`) et profils (`profiles.user_id, prenom, nom, avatar_url`) en deux requêtes batch.
  4. Retourner une liste triée par date desc :
     ```ts
     { userId, prenom, nom, avatarUrl, marcheId, marcheName, ville, observationDate, photoUrl? }[]
     ```
- Cache 30 min, `enabled` = `!!scientificName && !!explorationId`.

Sécurité : `marcheur_observations` étant déjà visible aux co-participants via RLS existante (mémoire `co-participant-visibility-logic`), aucune nouvelle policy. Si la jointure profiles fuite des PII non désirées, on remplacera par un RPC `SECURITY DEFINER` retournant uniquement les colonnes publiques (prenom, nom, avatar) — à confirmer pendant l'implémentation.

#### 2b. Composant `SpeciesObserversTab`

Nouveau fichier `src/components/biodiversity/species-modal/SpeciesObserversTab.tsx` :
- Affiche `Loader` pendant chargement, `EmptyState` si vide ("Aucun marcheur n'a encore enregistré d'observation pour cette espèce").
- Liste de cartes compactes :
  - Avatar 40×40 (fallback initiales).
  - Ligne 1 : `Prénom Nom` (truncate).
  - Ligne 2 : `marcheName · ville` en `text-xs text-white/60`.
  - Ligne 3 : badge date relative (`il y a 3 jours`) + mini-vignette photo si `photo_url`.
- Clic sur une carte → ouvre `/communaute/marcheur/{slug}` (route publique existante via `useCommunityProfile` slug). Optionnel : à brancher après validation.

#### 2c. Intégration dans le modal riche

Dans `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` :
- Importer `useSpeciesObservers` et `SpeciesObserversTab`.
- Étendre les Tabs de 2 → 3 onglets : `Liste / Carte / Observateurs`.
- Le badge sous "Observé sur ces marches" devient : `N obs. sur M marches · K marcheurs`.
- L'onglet Observateurs apparaît même si Marches est vide tant que `observers.length > 0` (cas où l'observation existe via `marcheur_observations` sans snapshot agrégé).

### 3. Cohérence ChatBot (screen-awareness)

Pour rester aligné avec l'architecture mémoire `chatbot-screen-awareness-architecture` :
- Quand le modal espèce est ouvert, publier une slice `useChatTabSnapshot('apprendre.oeil.especeOuverte', { nom, sci, marches: [...], observateurs: [...] })`.
- Marquer le DialogContent avec `data-chat-card data-chat-title={frenchName}` pour la couche DOM générique.

Permet à l'IA de répondre "qui a vu Buddleja ?" directement depuis le contexte écran.

## Détails techniques

### Fichiers modifiés
- `src/components/community/insights/curation/OeilCuration.tsx` — bascule sur modal riche, branche `allEventMarches`.
- `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` — 3e onglet Observateurs, snapshot chatbot, `data-chat-*`.

### Fichiers créés
- `src/hooks/useSpeciesObservers.ts`
- `src/hooks/useExplorationAllMarches.ts` (extraction du fetch dupliqué dans `EventBiodiversityTab`).
- `src/components/biodiversity/species-modal/SpeciesObserversTab.tsx`

### Pas de migration BDD
Toutes les données nécessaires sont accessibles via tables existantes (`marcheur_observations`, `profiles`, `exploration_marches`, `marches`) avec les RLS actuelles.

### QA mobile-first (375 px)
- Tabs Liste/Carte/Observateurs en `grid-cols-3`, label texte court, icône + label vertical si overflow.
- Carte d'observateur : padding 12 px, gap 12 px, ligne ≤ 2 lignes max, touch target avatar+nom ≥ 48 px.
- Modal `max-h-[90vh] overflow-y-auto` déjà en place, on conserve.

### Hors-scope (non traité dans cette itération)
- Badge "Photo marcheur" calculé proprement (logique actuelle approximative dans le modal riche).
- Ouverture profil marcheur au clic sur un observateur (à brancher dans une 2e itération si validé).
- Date d'observation primaire dans le header (le modal riche ne l'affiche pas car elle est multi-valeur ; visible par marche/observateur dans les onglets).

