

# Ajouter l'option "Tous les marcheurs" au filtre de la page /admin/marcheurs

## Objectif

Permettre de consulter tous les marcheurs/marcheuses de toutes les explorations en une seule vue, en ajoutant une option "Toutes les explorations" dans le selecteur existant.

## Modifications

### `src/pages/MarcheursAdmin.tsx`

1. Ajouter une option `__all__` dans le `<Select>` au-dessus des explorations individuelles : "Toutes les explorations (X marcheurs)"
2. Quand `selectedExplorationId === '__all__'`, afficher un nouveau composant `AllMarcheursView` au lieu de `MarcheursManager`
3. Initialiser le state a `'__all__'` par defaut pour que la vue globale s'affiche directement

### Nouveau composant `src/components/admin/AllMarcheursView.tsx`

1. Requete Supabase qui recupere TOUS les `exploration_marcheurs` avec une jointure sur `explorations` pour avoir le nom de l'exploration
2. Jointure sur `marcheur_observations` pour compter les especes par marcheur
3. Affichage en grille (meme style que `MarcheursManager`) avec en plus un badge indiquant le nom de l'exploration d'appartenance sur chaque carte
4. Barre de recherche textuelle (filtre par nom/prenom) en haut
5. Filtre par role (dropdown multi-select ou chips)
6. Les actions edit/delete/observations restent fonctionnelles (redirigent vers le contexte de l'exploration concernee)

### Details techniques

- La requete recupere `exploration_marcheurs` avec `select('*, explorations(name)')` pour obtenir le nom de l'exploration en une seule requete
- Les observations sont comptees via une sous-requete sur `marcheur_observations`
- Le composant est en lecture + actions (edit ouvre le dialog avec le bon `exploration_id`)

