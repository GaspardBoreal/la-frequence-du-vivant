
# Refonte du menu "Apprendre" — Curation 5 sens & dossier inspirant

## Vue d'ensemble

Transformer l'onglet "Apprendre" en un véritable outil narratif et éditorial, organisé autour de deux sous-onglets :

```text
Apprendre
├── Ce que nous avons vu  ← NOUVEAU (curation 5 sens)
│   ├── L'œil      → espèces remarquables épinglées
│   ├── La main    → pratiques emblématiques épinglées
│   ├── Le cœur    → textes écrits (réutilise composant Empreinte)
│   ├── L'oreille  → audios épinglés + tous les autres
│   └── Le palais  → entrées dégustation manuelles + médias épinglés
└── Apprendre et créer  ← contenus actuels
```

Chaque section "Ce que nous avons vu" est curatée par l'ambassadeur/sentinelle via un toggle inline "Épingler", et alimente une **page web publique** `/lecteurs/{event-slug}/decouvertes` ainsi qu'un **export PDF** mis en page.

---

## Décisions validées

- **Curation** : toggle inline "Épingler" sur chaque média/espèce (visible uniquement par ambassadeur/sentinelle).
- **Catégories L'œil** : optionnelles (emblématique / parapluie / EEE / auxiliaire) + tag libre.
- **L'oreille** : hybride — section "épinglés" mise en avant + section repliable "tous les audios".
- **Le palais** : entrées manuelles créables uniquement par ambassadeur/sentinelle.
- **Diffusion** : page web `/lecteurs/{event-slug}/decouvertes` + bouton export PDF, basés sur la même source de données curatées.
- **Stockage** : table unique polymorphe `exploration_curations`.

---

## Plan d'implémentation

### Étape 1 — Schéma BDD (migration)

**Table `exploration_curations`** (polymorphe, une seule table pour tous les sens) :

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `exploration_id` | uuid FK | scope évènement |
| `sense` | enum | `oeil` \| `main` \| `coeur` \| `oreille` \| `palais` |
| `entity_type` | text | `species` \| `media` \| `text` \| `audio` \| `palais_entry` |
| `entity_id` | uuid \| text | ID de l'élément épinglé (nullable pour palais_entry manuel) |
| `category` | text \| null | "emblématique", "parapluie", "EEE", "auxiliaire" ou tag libre |
| `title` | text \| null | Titre éditorial (obligatoire pour `main` et `palais_entry`) |
| `description` | text \| null | Description (palais_entry) |
| `media_ids` | uuid[] | Pour `main` et `palais_entry` : plusieurs médias par entrée |
| `display_order` | int | Tri manuel |
| `created_by` | uuid | profil ambassadeur/sentinelle |
| `created_at` / `updated_at` | timestamptz | |

**RLS** :
- SELECT : public (lecture libre pour la page publique).
- INSERT/UPDATE/DELETE : seulement si `has_role(auth.uid(), 'ambassadeur')` OU `has_role(auth.uid(), 'sentinelle')` OU `has_role(auth.uid(), 'admin')`, ET liés à un évènement où l'utilisateur est inscrit (validation via fonction security definer).

**Index** : `(exploration_id, sense, display_order)`.

### Étape 2 — Sous-onglets dans `ApprendreTab.tsx`

Refonte de `src/components/community/insights/ApprendreTab.tsx` :

- En haut : 2 pills horizontales (style Voir/Écouter/Lire) :
  - **Ce que nous avons vu** (par défaut)
  - **Apprendre et créer**
- L'existant (5 piliers + cartes par catégorie) devient le contenu de "Apprendre et créer" — aucune perte fonctionnelle.
- "Ce que nous avons vu" rend un nouveau composant `CeQueNousAvonsVu.tsx`.

### Étape 3 — Composant `CeQueNousAvonsVu.tsx`

5 sous-onglets internes (réutilise les icônes des piliers existants) :

| Sous-onglet | Contenu | Composant |
|---|---|---|
| **L'œil** | Grille d'espèces épinglées, groupées par catégorie si présente | `OeilCuration.tsx` |
| **La main** | Cartes "pratique" : titre + galerie de médias liés | `MainCuration.tsx` |
| **Le cœur** | Liste des textes (réutilise `TextesEcritsSubTab.tsx` tel quel) | import direct |
| **L'oreille** | Section "Épinglés" en haut + section repliable "Tous les audios" (utilise `useExplorationAudioPlaylist`) | `OreilleCuration.tsx` |
| **Le palais** | Cartes dégustation manuelles + médias épinglés | `PalaisCuration.tsx` |

### Étape 4 — Mode curation (ambassadeur/sentinelle)

**Détection du rôle** : utiliser `useCommunityProfile` + `has_role` côté client pour afficher/masquer les actions de curation.

**UX inline "Épingler"** :
- Sur chaque carte espèce / média / audio, un petit bouton flottant en haut-à-droite (icône `Pin` / `PinOff`).
- Au clic : ouvre un mini-popover avec :
  - Champ "Catégorie" (combobox : 4 suggestions + saisie libre) — pour L'œil.
  - Champ "Titre éditorial" — pour La main.
  - Sélecteur multi-médias — pour La main et Le palais.
- Mutation optimiste vers `exploration_curations`.

**Création manuelle Palais** :
- Bouton "+ Ajouter une dégustation" (visible uniquement ambassadeur/sentinelle) ouvre une modale (titre, description, sélecteur multi-médias depuis bibliothèque évènement + Convivialité).

**Réorganisation** : drag-and-drop avec dnd-kit (réutilise pattern `useConvivialitePhotos`), via RPC `reorder_exploration_curations` SECURITY DEFINER.

### Étape 5 — Page web publique `/lecteurs/{event-slug}/decouvertes`

- Nouvelle route dans `App.tsx` : `/lecteurs/:eventSlug/decouvertes`.
- Nouveau composant page `PublicDecouvertes5Sens.tsx` :
  - Hero : nom évènement, lieu, date, image de couverture.
  - 5 sections verticales (œil → main → cœur → oreille → palais) avec scroll fluide + ancres.
  - Lecture seule, soumise au toggle progressive publishing existant (`is_published`).
  - SEO : `<title>`, `<meta description>`, OpenGraph (image hero, description issue de l'évènement).
- Données via RPC publique `get_public_decouvertes(event_slug)` → renvoie tous les `exploration_curations` joints aux médias/espèces/textes/audios.

### Étape 6 — Export PDF

- Bouton "Télécharger le dossier (PDF)" dans le sous-onglet "Ce que nous avons vu" (ambassadeur+) ET sur la page publique.
- Edge function `generate-decouvertes-pdf` :
  - Récupère les curations + médias.
  - Génère un PDF mis en page : couverture, sommaire, 5 sections illustrées (réutilise `pdfExportUtils.ts` existant comme base, étendu pour cette mise en page éditoriale).
  - Stocke le résultat dans le bucket Storage et renvoie l'URL signée.

### Étape 7 — Mémoire & documentation

- Créer `mem://features/mon-espace/apprendre-curation-5-sens-logic` décrivant l'architecture polymorphe et la double diffusion (web + PDF).
- Mettre à jour `mem://features/mon-espace/exploration-dedicated-page-architecture`.

---

## Fichiers concernés

**Nouveaux** :
- `supabase/migrations/{timestamp}_exploration_curations.sql`
- `src/components/community/insights/CeQueNousAvonsVu.tsx`
- `src/components/community/insights/curation/OeilCuration.tsx`
- `src/components/community/insights/curation/MainCuration.tsx`
- `src/components/community/insights/curation/OreilleCuration.tsx`
- `src/components/community/insights/curation/PalaisCuration.tsx`
- `src/components/community/insights/curation/PinToggle.tsx` (composant réutilisable)
- `src/components/community/insights/curation/CurationDrawer.tsx` (modale ajout/édition)
- `src/hooks/useExplorationCurations.ts`
- `src/hooks/useIsCurator.ts` (détection rôle ambassadeur/sentinelle)
- `src/pages/PublicDecouvertes5Sens.tsx`
- `supabase/functions/generate-decouvertes-pdf/index.ts`

**Modifiés** :
- `src/components/community/insights/ApprendreTab.tsx` (ajout sous-onglets, déplacement contenu existant dans "Apprendre et créer")
- `src/App.tsx` (nouvelle route publique)
- `src/integrations/supabase/types.ts` (regénéré après migration)

**Réutilisés tels quels** :
- `src/components/community/exploration/TextesEcritsSubTab.tsx` (Le cœur — code partagé avec Empreinte → Textes écrits)
- `src/hooks/useExplorationAudioPlaylist.ts` (L'oreille)
- Schéma de la migration et RPC suivront les conventions existantes (RLS strict, SECURITY DEFINER pour les writes).

---

## Découpage proposé en livraisons

1. **Livraison 1** — Schéma BDD + sous-onglets vides + déplacement contenu actuel dans "Apprendre et créer" (rien ne casse).
2. **Livraison 2** — L'œil + La main + Le cœur (curation espèces/médias, réutilisation textes).
3. **Livraison 3** — L'oreille + Le palais (audios hybrides, entrées manuelles).
4. **Livraison 4** — Page publique `/lecteurs/{slug}/decouvertes`.
5. **Livraison 5** — Export PDF.

Chaque livraison sera demandée séparément pour validation visuelle.
