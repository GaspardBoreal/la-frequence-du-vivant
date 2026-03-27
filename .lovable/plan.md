

# Refactoring Admin Evenements : Liste + Fiche detail

## Probleme

Tout est entasse dans une seule page de 473 lignes : liste, formulaire de creation, details participants, ajout retroactif, QR code. L'UX est confuse — on ouvre/ferme des panneaux inline sans navigation claire.

## Solution

Separer en **deux routes** avec une navigation propre :

1. **`/admin/marche-events`** — Liste des evenements (recherche, tri, cartes compactes)
2. **`/admin/marche-events/:id`** — Fiche evenement (lecture, modification, participants, QR)
3. **`/admin/marche-events/nouveau`** — Creation (meme composant fiche, mode creation)

## Architecture fichiers

| Fichier | Role |
|---------|------|
| `src/pages/MarcheEventsAdmin.tsx` | **Refactorise** — Liste seule (recherche, tri, cartes cliquables) |
| `src/pages/MarcheEventDetail.tsx` | **Nouveau** — Fiche complete (CRUD + participants + QR) |
| `src/App.tsx` | Ajouter les 2 nouvelles routes |

## Detail des pages

### Page Liste (`/admin/marche-events`)

- Header avec bouton "Nouvel evenement" → navigue vers `/admin/marche-events/nouveau`
- Barre de recherche + tri (existante, conservee)
- Cartes compactes cliquables : clic sur la carte → navigue vers `/admin/marche-events/:id`
- Retirer : formulaire inline, panneau participants, panneau ajout retroactif
- Les cartes gardent : badge statut, date, titre, lieu, exploration, compteur participants

### Page Fiche (`/admin/marche-events/:id` ou `/admin/marche-events/nouveau`)

Organisee en sections claires :

1. **Header** : Bouton retour + titre de l'evenement (ou "Nouvel evenement")
2. **Section infos** : Formulaire editable (titre, date, lieu, lat/lng, max participants, description, exploration). Boutons "Enregistrer" / "Supprimer"
3. **Section QR Code** : Apercu QR + URL + bouton imprimer (uniquement en mode edition)
4. **Section Participants** : Tableau des participants valides + bouton ajout retroactif avec recherche (uniquement en mode edition)

En mode **creation** : formulaire vide, pas de sections QR/participants.
En mode **lecture/edition** : toutes les sections visibles, champs pre-remplis.

## Implementation technique

- Utiliser `useParams()` pour recuperer l'ID et `useNavigate()` pour la navigation
- Mode creation detecte via `id === 'nouveau'` ou absence de data
- Mutation `update` a ajouter (actuellement seul `create` existe) via `supabase.from('marche_events').update(...).eq('id', id)`
- Deplacer les queries `participations`, `allProfiles`, `addParticipant` dans la page fiche
- Conserver `events`, `participationCounts`, `filteredAndSortedEvents` dans la page liste

## Resultat UX

- Navigation claire : liste → fiche → retour
- Chaque page a une responsabilite unique
- La fiche permet de voir et modifier tout au meme endroit sans accordeons inline
- La liste reste legere et scannable

