# Galerie Convivialité — Mur immersif de l'exploration

Une galerie collective qui célèbre la dynamique humaine des marcheurs : visages, rires, partages, pauses. Visible par tous les marcheurs de l'exploration, alimentée uniquement par les Ambassadeurs et Sentinelles (gardiens de la mémoire vivante).

## Expérience utilisateur

### Entrée immersive
Un nouvel onglet **"Convivialité"** (icône `Users` ou `Sparkles`) dans `ExplorationMarcheurPage`, à côté de Voir / Écouter / Lire / Vivant. Au clic, ouverture en **plein écran immersif** (sortie du layout standard) avec un fond sombre dégradé pour faire ressortir les photos.

### Trois modes d'affichage (toggle haut-droite)

```text
┌─────────────────────────────────────────────────┐
│  Convivialité — DEVIAT          [≡] [▶] [🖨]  ✕ │
│                                                 │
│   ┌────┐  ┌──────┐  ┌───┐  ┌────┐              │
│   │ ph │  │ ph   │  │ph │  │ ph │              │
│   └────┘  │      │  └───┘  └────┘              │
│   ┌──────┐│      │  ┌──────────┐               │
│   │ ph   │└──────┘  │ ph       │               │
│   └──────┘          └──────────┘               │
│                                                 │
│   12 instants partagés par 5 marcheurs          │
└─────────────────────────────────────────────────┘
```

1. **Mosaïque masonry** (par défaut) — colonnes responsives (2/3/4 selon viewport), hauteurs variables, animation `fade-in` cascadée à l'entrée, `hover-scale` léger, clic = lightbox plein écran avec navigation clavier (← → Esc).
2. **Diaporama cinématique** — plein écran noir, transition crossfade 1.5s, effet Ken Burns (zoom lent + pan), lecture auto 5s/photo, contrôles flottants (pause, ⟵ ⟶, vitesse, sortie).
3. **Mode impression** — layout A4 portrait, 6 photos par page, légende discrète "auteur · date", marges respectées, bouton "Imprimer" déclenche `window.print()` avec CSS `@media print` dédié.

### Bouton d'upload (visible uniquement Ambassadeur/Sentinelle)
Bouton flottant (FAB) glassmorphism en bas-droite : **"+ Ajouter un instant"**. Drawer multi-upload (drag & drop + sélecteur), aperçus, optimisation côté client, barre de progression. Pour les autres rôles, on affiche à la place un message poétique discret : *"Les Ambassadeurs et Sentinelles enrichissent ce mur de souvenirs."*

### Signalement
Au survol d'une photo, petite icône `Flag` discrète (en bas-droite de la vignette). Clic = modale "Signaler ce contenu" → raison libre 200 car. → notification admin. Photo masquée pour le signaleur immédiatement, retrait définitif par admin.

## Architecture technique

### Base de données

Nouvelle table `exploration_convivialite_photos` :

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `exploration_id` | uuid NOT NULL | FK explorations |
| `user_id` | uuid NOT NULL | uploader (Ambassadeur/Sentinelle) |
| `storage_path` | text NOT NULL | chemin dans le bucket |
| `url` | text NOT NULL | URL publique |
| `width`, `height` | int | pour le masonry sans CLS |
| `taille_octets` | bigint | |
| `is_hidden` | bool default false | masquage admin après signalement |
| `created_at` | timestamptz | |

Table `exploration_convivialite_signalements` :
`id, photo_id, reporter_user_id, raison, created_at, resolved_at, resolved_by`.

### Storage

Nouveau bucket **public** `exploration-convivialite` (lecture publique, écriture via RLS). Chemins : `{exploration_id}/{user_id}/{uuid}.webp`. Optimisation client (max 1920px, WebP, ~85% qualité) pour rester sous ~500 Ko par photo.

### RLS — règles clés

- **SELECT** sur `exploration_convivialite_photos` : tout marcheur ayant une participation à un événement de l'exploration (réutilise la logique `shares_marche_event` adaptée à l'exploration via `marche_events.exploration_id`) + admins. Filtre `is_hidden = false` pour les non-admins.
- **INSERT** : seulement si `community_profiles.role IN ('ambassadeur','sentinelle')` ET `user_id = auth.uid()`. Vérification via fonction `SECURITY DEFINER` `can_upload_convivialite(user_id, exploration_id)`.
- **DELETE** : auteur de la photo OU admin.
- **Signalements INSERT** : tout marcheur avec accès à l'exploration. SELECT/UPDATE : admin uniquement.
- **Storage policies** miroir : INSERT bucket si `can_upload_convivialite`, DELETE si propriétaire ou admin, SELECT public (bucket public).

### Composants front

```text
src/components/community/exploration/convivialite/
  ConvivialiteTab.tsx           — entrée onglet, gère l'ouverture immersive
  ConvivialiteImmersiveView.tsx — overlay plein écran, switch de mode
  ConvivialiteMosaic.tsx        — masonry + lightbox
  ConvivialiteSlideshow.tsx     — Ken Burns + crossfade
  ConvivialitePrintLayout.tsx   — layout A4 + @media print
  ConvivialiteUploadFAB.tsx     — bouton + drawer upload (gated par rôle)
  ConvivialiteReportDialog.tsx  — signalement
  useConvivialitePhotos.ts      — hook react-query
  useCanUploadConvivialite.ts   — hook rôle (lit community_profiles)
```

Réutilisation : `imageOptimizer.ts`, `parallelUploadManager.ts`, animations Tailwind existantes (`animate-fade-in`, `hover-scale`, `enter`).

### Intégration

- Ajout d'un onglet dans `ExplorationMarcheurPage.tsx` (icône + label "Convivialité").
- Badge collectif (compteur de photos) cohérent avec les autres onglets sensoriels.
- Activity tracking via `useActivityTracker` (`tab_switch` + `media_upload` event_target=`convivialite_photo`).
- Admin : exposition simple dans `OutilsHub` admin pour modérer les signalements (liste + masquage/suppression).

## Sécurité & RGPD

- Photos = visages → bucket public mais **URL non devinables** (UUID) et accès lecture conditionné côté UI par appartenance à l'exploration (le bucket public reste nécessaire pour les performances ; la sécurité repose sur la non-énumération + masquage rapide en cas de signalement).
- Bouton "Supprimer" toujours disponible pour l'auteur.
- Modération admin sous 24h sur signalement, avec audit (`resolved_by`, `resolved_at`).
- Limite douce côté UI : 30 photos / exploration, 5 Mo / fichier, formats jpg/png/webp/heic.

## Ce qui sera livré

1. Migration SQL (2 tables + bucket + RLS + fonction `can_upload_convivialite`).
2. 8 composants React + 2 hooks listés ci-dessus.
3. Onglet "Convivialité" branché dans `ExplorationMarcheurPage`.
4. Module admin minimal de modération des signalements.
5. CSS d'impression dédié.

## Hors-scope (à itérer plus tard si besoin)

- Légendes, tags d'ambiance, lien à une marche précise (peut être ajouté sans casser le schéma).
- Réactions emoji / commentaires.
- Export PDF stylé (le mode impression couvre déjà l'usage immédiat).
