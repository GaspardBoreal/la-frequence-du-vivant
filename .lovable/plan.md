

## Nouveau statut "Partagé au monde" — Partage web public des contributions

### Contexte actuel
- `is_public` (boolean) sur `marcheur_textes` et `marcheur_medias` = visibilité entre marcheurs
- Pas de champ pour le partage web public
- `community_profiles` n'a pas de slug/pseudo (seulement prenom, nom, user_id)

### Architecture

**1. Migration base de données**

Ajouter sur `marcheur_textes` et `marcheur_medias` :
- `shared_to_web` (boolean, default false) — statut "Partagé au monde"
- Politique RLS : permettre SELECT anonyme quand `shared_to_web = true`

Ajouter sur `community_profiles` :
- `slug` (text, unique, nullable) — identifiant public du marcheur pour l'URL carnet

Fonction DB pour générer un slug automatique depuis prenom+nom si null.

**2. UI — Trois niveaux de partage dans ContributionItem**

Remplacer le toggle simple Globe/Lock par un sélecteur à 3 états :
- 🔒 **Privé** — visible uniquement par le marcheur
- 👥 **Communauté** — visible par les autres marcheurs (`is_public = true`)
- 🌍 **Partagé au monde** — accessible publiquement via URL (`shared_to_web = true`, implique `is_public = true`)

Un petit menu dropdown ou un cycle de clics (Privé → Communauté → Monde → Privé).

Indicateur visuel : badge avec icône et couleur distincte pour chaque état.

**3. Route publique individuelle : `/partage/:id`**

Nouvelle page `src/pages/PartagePublic.tsx` :
- Fetch le contenu (`marcheur_textes` ou `marcheur_medias`) par ID où `shared_to_web = true`
- Joint le profil marcheur (prenom, avatar) et les infos marche (nom, lieu)
- Design mobile-first, plein écran :
  - Textes : fond sombre avec bande latérale violette, typographie Crimson Text, contenu centré
  - Photos : photo plein écran avec overlay glassmorphism pour titre/auteur/lieu
- Bouton "Partager" natif (`navigator.share` ou copie presse-papier)
- Meta tags OpenGraph via `<Helmet>` pour un rendu social riche
- CTA discret vers "Les Marches du Vivant" en bas

**4. Route carnet : `/marcheur/:slug/carnet`**

Nouvelle page `src/pages/CarnetMarcheur.tsx` :
- Fetch tous les contenus `shared_to_web = true` du marcheur (textes + photos)
- En-tête : avatar, prénom, ville, nombre de contributions, citation/kigo d'accueil
- Grille masonry de cartes : chaque carte est cliquable → ouvre `/partage/:id`
- Regroupement par exploration/événement
- Design : fond crème clair / sombre selon préférence, typographie poétique, animations d'apparition au scroll

**5. Bouton "Copier le lien" dans ContributionItem**

Quand `shared_to_web = true`, afficher un petit bouton lien (🔗) qui copie l'URL publique dans le presse-papier avec toast de confirmation.

### Fichiers

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter `shared_to_web`, `slug`, RLS anonyme |
| `src/components/community/contributions/ContributionItem.tsx` | Sélecteur 3 états + bouton copier lien |
| `src/pages/PartagePublic.tsx` | **Nouveau** — page publique individuelle |
| `src/pages/CarnetMarcheur.tsx` | **Nouveau** — carnet public du marcheur |
| `src/App.tsx` | Ajouter routes `/partage/:id` et `/marcheur/:slug/carnet` |
| `src/hooks/useMarcheurContributions.ts` | Adapter les mutations pour `shared_to_web` |

### Sécurité
- RLS : SELECT anonyme uniquement sur les lignes où `shared_to_web = true`
- INSERT/UPDATE/DELETE : inchangé (propriétaire uniquement)
- Le marcheur contrôle entièrement ce qui est exposé

