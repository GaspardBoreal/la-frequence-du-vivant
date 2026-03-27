

# Enrichissement de la page Admin Evenements de Marche

## Ajouts

### 1. Barre de filtre et tri (entre le header et la liste)

- **Champ de recherche** : `Input` avec icone `Search`, filtre en temps reel (debounce 300ms) sur tous les champs texte d'un evenement (`title`, `description`, `lieu`, nom d'exploration, `qr_code`)
- **Selecteur de tri** : `Select` avec deux options — "Date decroissante" (defaut) et "Date croissante". Le tri s'applique cote client sur les evenements deja charges

### 2. Affichage en cartes enrichies

Les cartes actuelles sont deja en `Card`, mais on les ameliore :
- **Badge de statut temporel** : "A venir" (vert) si `date_marche > now`, "Passee" (gris) sinon
- **Compteur de participants** en temps reel (count depuis `marche_participations`) affiche sur la carte sans avoir a cliquer
- **Meilleure hierarchie visuelle** : date en gros, titre en dessous, lieu + exploration en badges

### 3. Implementation technique

Tout dans **un seul fichier** `MarcheEventsAdmin.tsx` :

- Ajouter deux states : `searchTerm` (string) et `sortOrder` ('desc' | 'asc')
- Utiliser `useDebounce` existant pour le filtre
- Filtrer et trier avec `useMemo` sur `events`
- Ajouter une query pour compter les participations par event (`marche_participations` groupees)
- Afficher un compteur de resultats "X evenement(s) sur Y"

### Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/pages/MarcheEventsAdmin.tsx` | Ajout barre recherche + tri + badges statut + compteur participants |

