## Nouvelle qualification « Catégorie » sur les marches

### 1. Modèle de données

Nouvelle colonne `category` sur `public.marche_events` :

- Type : `text NOT NULL` avec `CHECK` sur l'enum applicatif.
- Valeurs autorisées : `arboriculture`, `grande_culture`, `elevage`, `maraichage`, `vignoble`, `jardin`, `exploration`, `autre`.
- Backfill : tous les événements existants passent à `autre` (valeur neutre) pour respecter le `NOT NULL`, ajustables ensuite dans l'admin.
- Index B-tree sur `category` pour le filtre.

Les RPC impactées (`get_marche_events_paginated`, `get_marche_events_filtered_all`, `get_marches_map_events`, `get_marche_events_dashboard_stats`) renvoient la nouvelle colonne + acceptent un paramètre optionnel `category_filter text` (NULL = toutes). Aucune casse pour les appelants existants (paramètre par défaut NULL).

### 2. Mapping Partenaires Sol Vivant → nos catégories

Ajout d'un utilitaire pur `src/lib/marcheCategories.ts` centralisant :

- Liste des 8 catégories + libellé FR + icône Lucide + couleur token.
- Fonction `mapSolVivantToCategory(labels: string[]): MarcheCategory` avec règles prioritaires (première correspondance gagne) :

```text
contient "Arboriculteur"                → arboriculture
contient "Vign"                         → vignoble
contient "Maraîcher" ou "MSV"           → maraichage
contient "Élevage" / "Éleveur"          → elevage
contient "Grande culture"               → grande_culture
contient "Jardinier" (seul ou combiné)  → jardin
contient "toutes_categories"            → autre
contient "Organisation" / "Association" → autre
défaut                                  → autre
```

Priorité justifiée : les combinaisons Sol Vivant (« Jardiniers, Maraîchers (MSV) », « Maraîchers (MSV), Accueil stagiaire, Arboriculteurs… ») sont résolues en gardant la spécialité agricole la plus caractéristique avant de retomber sur « jardin » puis « autre ». Cette fonction sera réutilisée côté sync Sol Vivant si l'on affiche une pastille catégorie sur les points partenaires, et pour tout futur import automatique.

### 3. Admin — `MarcheEventDetail` (fiche)

Nouveau bloc **Catégorie \*** inséré entre la grille « Type de marche » et la ligne Lieu / Max participants.

- Composant `CategoryPicker` : grille responsive 4 col desktop / 2 col mobile, mêmes styles que le picker de type (carte cliquable avec icône + label, badge « Sélectionné », anneau vert `ring-primary/30`, background token `bg-card`).
- Validation : `category` obligatoire → `Save` désactivé + toast si vide, message d'aide sous la grille.
- Persistance : ajout dans `initialForm`, dans `insert()` et `update()`, et dans le reset après duplicate.

### 4. Admin — `EventsFiltersBar` (copie 2)

Nouveau `Select` compact « Toutes catégories » ajouté sur la 2e ligne de filtres, aligné avec les autres (Type / Statuts / Tri / Partage). Sur mobile → il repasse en dessous naturellement grâce au `flex-wrap` existant. La valeur est propagée via `useMarcheEventsQuery` (ajout du champ `category` à `EventsFilters`, URL param `?cat=`), réinitialise la pagination.

### 5. Public — `carte-marches-du-vivant` FiltersBar (copie 3)

- Ajout d'une rangée de « chips » sous la rangée Type, préfixée `Catégorie :`, avec les 8 puces (icône + label court), même style que les chips Type (bordure, `ring-primary/30` si actif).
- `CarteMdVFilters` gagne `categories: string[]` (multi-sélection cohérent avec `types`).
- `applyFilters` filtre localement `events` sur `categories.length === 0 || categories.includes(e.category)`.
- Ordre visuel dans le bandeau : `Type` → `Catégorie` → toggle `Partenaires Sol Vivant` (inchangé). Compteur « X marches » et bouton Reset couvrent la nouvelle dimension.

### 6. Design tokens

Palette catégorie (via CSS vars dans `index.css`, jamais de couleurs hardcodées) :

```text
arboriculture  → --category-arboriculture (vert olive)
grande_culture → --category-grande-culture (blé doré)
elevage        → --category-elevage (terre cuite)
maraichage     → --category-maraichage (vert frais)
vignoble       → --category-vignoble (bordeaux profond)
jardin         → --category-jardin (rose pâle)
exploration    → --category-exploration (bleu ardoise)
autre          → --category-autre (muted)
```

Icônes Lucide : `TreePine`, `Wheat`, `Beef`, `Sprout`, `Grape`, `Flower2`, `Compass`, `MoreHorizontal`.

### 7. Fichiers touchés

- Migration SQL : colonne + check + index + refactor des 4 RPC pour retourner/filtrer `category`.
- `src/lib/marcheCategories.ts` (nouveau) — enum, meta, mapper Sol Vivant.
- `src/index.css` — tokens couleurs catégorie.
- `src/pages/MarcheEventDetail.tsx` — champ obligatoire + picker.
- `src/hooks/useMarcheEventsQuery.ts` — type `EventsFilters` + params RPC + `category` sur `MarcheEventListItem`.
- `src/components/admin/marche-events/EventsFiltersBar.tsx` — Select catégorie.
- `src/pages/MarcheEventsAdmin.tsx` — URL param `cat`.
- `src/components/admin/marche-events/EventsListTab.tsx` + `EventsMapTab.tsx` — pastille catégorie discrète à côté du type.
- `src/hooks/useCarteMdV.ts` — champ `categories`, `applyFilters`, requête RPC.
- `src/components/carte-mdv/FiltersBar.tsx` — rangée chips catégorie.

### 8. Compatibilité & robustesse

- Défaut `autre` sur l'existant → aucun événement invisible.
- Paramètres RPC nullables → aucune régression pour les appelants qui ne passent pas encore le filtre.
- Fonction `mapSolVivantToCategory` unitaire, pure, testable, réutilisable pour la synchro automatique ultérieure.
- Aucune modification des URLs publiques ; nouveaux query params optionnels uniquement.
