
Objectif retenu après clarification : le type sera porté directement par `marche_events` (un événement = un seul type), puis exposé sur les 2 écrans admin concernés uniquement :
- `/admin/marche-events/:id`
- `/admin/marche-events`

Constat
- `MarcheEventsAdmin.tsx` a déjà une barre de recherche + tri et des cartes d’événements sobres, responsive de base.
- `MarcheEventDetail.tsx` gère déjà la création/édition complète d’un événement avec une section “Informations”.
- Aujourd’hui, `marche_events` ne contient aucun champ de type.
- Le formulaire d’exploration global (`ExplorationForm`) existe, mais d’après ta réponse il ne doit pas devenir la source métier du type.

Plan d’implémentation

1. Ajouter le type sur la table `marche_events`
- Créer une migration Supabase pour ajouter une colonne `event_type` sur `public.marche_events`.
- Restreindre les valeurs à 3 types métier :
  - `agroecologique`
  - `eco_poetique`
  - `eco_tourisme`
- Prévoir une valeur par défaut sûre pour ne pas casser les événements existants, puis rendre l’usage cohérent côté UI.
- Vérifier que les requêtes existantes lisent bien ce nouveau champ.

2. Définir une couche de configuration centralisée des types
- Créer une petite config côté front pour éviter les strings dispersées :
  - label lisible
  - description courte
  - picto Lucide
  - couleurs / classes badge / accent visuel
- Exemple d’intention UX :
  - Agroécologique = plus technique, vivant-terrain
  - Éco poétique = plus littéraire, sensible
  - Éco tourisme = plus patrimoine, découverte

3. Enrichir la fiche événement `/admin/marche-events/:id`
- Ajouter un bloc “Type de marche” dans la carte “Informations”.
- Utiliser un sélecteur design, clair et responsive, avec 3 options visuellement riches.
- Quand un type est choisi, afficher immédiatement :
  - son picto
  - son nom
  - sa description métier
  - un badge visuel marqué
- En mobile :
  - options empilées
  - description sous le sélecteur
- En desktop :
  - intégration harmonieuse dans la grille existante
- Sauvegarder `event_type` en création et en édition.
- Afficher le type sélectionné aussi dans l’en-tête ou dans un badge de contexte si pertinent, sans alourdir la page.

4. Enrichir la liste `/admin/marche-events`
- Ajouter un filtre de type en plus de la recherche et du tri :
  - Tous les types
  - Marche agroécologique
  - Marche éco poétique
  - Marche éco tourisme
- Faire fonctionner le filtre en combinaison avec la recherche debouncée et le tri existant.
- Ajouter sur chaque carte événement un badge type avec picto pour lecture instantanée.
- Garder une hiérarchie visuelle propre :
  - statut temporel
  - date
  - titre
  - type
  - lieu / exploration / participants

5. Soigner le design sans toucher au reste
- Conserver l’architecture actuelle des deux écrans.
- Ne modifier ni les autres routes admin, ni les écrans publics.
- Appliquer seulement un enrichissement UI local :
  - badges plus premium
  - meilleure lisibilité
  - bon comportement mobile/tablette
  - descriptions utiles sans surcharge

Détail technique
- Base :
  - nouvelle colonne `event_type` sur `public.marche_events`
- Front :
  - `src/pages/MarcheEventDetail.tsx`
  - `src/pages/MarcheEventsAdmin.tsx`
  - éventuellement un petit utilitaire/config partagé pour les métadonnées des types
- Requêtes :
  - inclure `event_type` dans les `select`, `insert`, `update`
- Filtrage :
  - ajouter `selectedType` dans l’état de la liste et l’intégrer au `useMemo`

Résultat attendu
- Chaque événement de marche possède exactement un type métier.
- La fiche événement permet de sélectionner ce type de façon élégante, descriptive et visuelle.
- La liste admin permet de filtrer par type ou d’afficher tous les types.
- Les cartes deviennent plus lisibles et expressives, sans modifier d’autres zones de l’application.

Point d’alignement important
- Malgré la formulation initiale “fiche exploration”, la source métier retenue est bien la fiche événement `/admin/marche-events/:id`, pour éviter tout couplage erroné avec `explorations`.
