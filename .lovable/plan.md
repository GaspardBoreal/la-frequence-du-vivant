

## Correctif sécurité + UI 3 états + Pages publiques

### 1. Migration DB — Sécuriser l'accès anonyme

**Problème** : La policy `"Public can view profiles by slug"` expose le téléphone, email et données personnelles de `community_profiles` à tout visiteur anonyme.

**Solution** : Supprimer les 3 policies anonymes directes et créer 2 fonctions RPC `SECURITY DEFINER` qui ne retournent que les champs publics :

- `get_public_shared_contribution(p_id uuid, p_type text)` — retourne le contenu (texte ou média) + prenom/slug/avatar du marcheur + nom/lieu de la marche, uniquement si `shared_to_web = true`
- `get_public_marcheur_carnet(p_slug text)` — retourne le profil public (prenom, slug, avatar, role, marches_count) + tous les contenus `shared_to_web = true` groupés par exploration

Ajouter aussi un trigger pour garantir la cohérence : si `shared_to_web = true` alors `is_public` doit être `true`.

### 2. ContributionItem.tsx — Sélecteur 3 états

Remplacer le toggle Globe/Lock par un menu déroulant à 3 niveaux :
- 🔒 **Privé** (`is_public=false, shared_to_web=false`) — badge gris
- 👥 **Communauté** (`is_public=true, shared_to_web=false`) — badge bleu
- 🌍 **Partagé au monde** (`is_public=true, shared_to_web=true`) — badge violet

Quand `shared_to_web=true`, afficher un bouton 🔗 qui copie l'URL `/partage/{id}?type={texte|photo|...}` avec toast.

Adapter aussi le mode immersion pour afficher l'indicateur 3 états.

### 3. useMarcheurContributions.ts — Adapter les mutations

Dans `useUpdateContribution`, gérer la logique :
- Passer à "monde" → `{ is_public: true, shared_to_web: true }`
- Passer à "communauté" → `{ is_public: true, shared_to_web: false }`  
- Passer à "privé" → `{ is_public: false, shared_to_web: false }`

### 4. PartagePublic.tsx — Page publique individuelle

Nouvelle page `/partage/:id` avec query param `?type=texte|photo|video|audio` :
- Appel RPC `get_public_shared_contribution`
- Design mobile-first, fond sombre, bande latérale violette
- Typographie Crimson Text pour les textes, photo plein écran pour médias
- Header : avatar + prénom + lieu de la marche
- Bouton partage natif (`navigator.share`) + copie presse-papier
- Meta tags OpenGraph via `react-helmet-async`
- CTA discret "Les Marches du Vivant" en bas

### 5. CarnetMarcheur.tsx — Journal public du marcheur

Nouvelle page `/marcheur/:slug/carnet` :
- Appel RPC `get_public_marcheur_carnet`
- En-tête : avatar, prénom, rôle, nombre de marches
- Grille masonry de cartes (textes + photos) cliquables → `/partage/:id`
- Groupement par exploration
- Animations d'apparition au scroll
- Design poétique, fond crème/sombre

### 6. App.tsx — Routes

Ajouter :
```
<Route path="/partage/:id" element={<PartagePublic />} />
<Route path="/marcheur/:slug/carnet" element={<CarnetMarcheur />} />
```

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | Supprimer 3 policies anonymes, créer 2 RPC, trigger cohérence |
| `src/components/community/contributions/ContributionItem.tsx` | Sélecteur 3 états + bouton copier lien |
| `src/hooks/useMarcheurContributions.ts` | Adapter mutations visibility |
| `src/pages/PartagePublic.tsx` | Nouveau |
| `src/pages/CarnetMarcheur.tsx` | Nouveau |
| `src/App.tsx` | 2 routes publiques |

### Dépendance
- `react-helmet-async` pour les meta tags OG (à installer si absent)

