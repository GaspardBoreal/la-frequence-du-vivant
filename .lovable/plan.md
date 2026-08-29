# Console Propriétés — tri par date de création + filtre par période

Objectif : enrichir `/admin/proprietes` avec un tri par date de création (décroissant par défaut) et un filtre de période de création (aujourd'hui → tout, plage personnalisée).

## Ce que voit l'administrateur

### 1. Tri par date de création
- Le tri par défaut devient **« Création » décroissante** (les fiches les plus récentes en haut) au lieu de « Nom ».
- La colonne « Création » de la table est déjà triable par clic (mécanisme existant) : un clic alterne croissant/décroissant. Le tri reste dans l'URL (`tri=created_at&dir=asc|desc`), donc partageable.
- Un lien déjà trié conserve son tri (ex. un lien « par nom » trié ainsi continue de fonctionner).

### 2. Nouveau filtre « Période de création »
Ajout d'un sélecteur dans la barre de filtres (2e rangée, 7 colonnes au lieu de 6) :
- **Tout** (par défaut)
- **Aujourd'hui** — créées aujourd'hui (heure de Paris)
- **Hier**
- **7 derniers jours**
- **Mois en cours**
- **Trimestre en cours** (T1 : janv–mars, etc.)
- **Année en cours**
- **Plage personnalisée** — deux sélecteurs de date « Du … au … » (composant calendrier shadcn, pointer-events activé pour rester cliquable dans le popover)

La période choisie reste dans l'URL (`periode`, plus `du`/`au` pour la plage personnalisée) : lien partageable, filtres conservés au retour de fiche. Changer de période ramène en page 1, comme les autres filtres. Le bouton « Réinitialiser » efface aussi la période.

Le filtre s'applique aux deux vues (Table **et** Carte) et combine avec tous les filtres existants (recherche, statut, région, département, entreprise, GPS, sondes).

## Détails techniques

- `src/components/admin/proprietes/types.ts` — `ProprietesFilterValues` gagne `periode: 'all' | 'aujourdhui' | 'hier' | '7j' | 'mois' | 'trimestre' | 'annee' | 'plage'`, plus `du: string` / `au: string` (ISO `YYYY-MM-DD`). `DEFAULT_FILTERS` mis à jour.
- `src/pages/AdminProprietes.tsx` :
  - Défaut de tri : `tri` = `created_at`, `dir` = `desc` quand les paramètres sont absents.
  - Nouvelle fonction pure `resolvePeriodeRange(periode, du, au)` calculée en heure de Paris (mémo « local time first ») : retourne `{ from, to }` ISO ou null ; « tout » ne pose aucune contrainte.
  - `applyFilters` ajoute `.gte('created_at', from)` / `.lte('created_at', to)` — s'applique donc automatiquement à la liste paginée **et** à la vue carte (les deux passent par `applyFilters`).
  - Lecture/écriture des paramètres `periode`, `du`, `au` dans l'URL.
- `src/components/admin/proprietes/ProprietesFilters.tsx` — ajout du sélecteur de période + popover calendrier (deux dates) quand `periode === 'plage'` ; grille passée de 6 à 7 colonnes sur grand écran ; « Réinitialiser » revient à `DEFAULT_FILTERS` (période incluse).
- Composant calendrier : `Calendar` shadcn + `date-fns` déjà présents ; wrapper `pointer-events-auto` (règle projet pour les popovers).
- Aucune migration SQL, aucun changement de RLS : `created_at` existe déjà sur `proprietes`.
- Performance : le filtre de date est appliqué côté requête (`gte/lte`), avant pagination `.range()` — aucun chargement supplémentaire à grande échelle.
