
Objectif

Ajouter un type unique à chaque exploration, puis enrichir uniquement les 2 écrans admin demandés :
- la fiche événement de marche (`/admin/marche-events/:id`) pour affecter / voir le type via l’exploration associée
- la liste des événements (`/admin/marche-events`) pour filtrer par type ou afficher tous les types
Le tout avec une UI plus lisible, design et responsive.

Constat dans le code actuel

- `src/pages/MarcheEventDetail.tsx`
  - le formulaire permet déjà de choisir une `exploration_id`
  - la liste des explorations charge seulement `id, name`
  - aucun type d’exploration n’existe encore
  - la preview des marches liées existe déjà et donne une bonne base visuelle
- `src/pages/MarcheEventsAdmin.tsx`
  - la liste charge `marche_events` avec `explorations(name)`
  - il y a déjà recherche + tri chronologique
  - aucun filtre par type
- `src/types/exploration.ts`
  - pas encore de type métier dédié pour catégoriser les explorations

Approche retenue

1. Modèle de donnée
- Ajouter un champ unique sur `public.explorations` pour stocker le type.
- Recommandation : enum PostgreSQL dédié, pour éviter les variantes libres et garantir 1 seul type possible.
- Valeurs :
  - `agroecologique`
  - `eco_poetique`
  - `eco_tourisme`

2. Fiche événement de marche
Dans `MarcheEventDetail.tsx` :
- enrichir la requête des explorations avec le type
- enrichir la requête de l’événement avec `explorations(name, exploration_type)`
- garder un seul sélecteur “Exploration associée”
- après sélection, afficher un bloc visuel compact et élégant indiquant :
  - nom de l’exploration
  - type de l’exploration sous forme de badge/pill
  - éventuellement une micro-description du protocole (technique, littéraire, patrimoine) pour mieux guider l’admin
- pour éviter toute confusion :
  - le type ne sera pas modifiable sur la fiche événement
  - l’affectation du type se fait sur la fiche exploration elle-même
- ajouter depuis cette zone un accès clair vers la fiche exploration si un lien admin existe déjà dans le projet ; sinon rester informatif seulement

3. Fiche exploration
Comme la demande impose de pouvoir “affecter le type correspondant” sur la fiche exploration :
- repérer l’écran de gestion des explorations existant et y ajouter un champ obligatoire “Type d’exploration”
- UI recommandée :
  - soit `Select`
  - soit `ToggleGroup`/cartes choix si le formulaire s’y prête
- libellés affichés :
  - Marches agroécologiques
  - Marches éco poétiques
  - Marches éco tourisme
- stocker les valeurs normalisées enum en base
- afficher aide contextuelle courte sous le champ pour rappeler la logique métier “une exploration = un seul protocole”

4. Liste admin des événements
Dans `MarcheEventsAdmin.tsx` :
- enrichir la requête avec `explorations(name, exploration_type)`
- ajouter un filtre de type au-dessus de la liste, à côté de la recherche et du tri
- comportement :
  - Tous les types
  - Agroécologique
  - Éco poétique
  - Éco tourisme
- intégrer le filtre dans le `useMemo` existant avec la recherche + tri
- afficher aussi le type directement dans chaque carte événement via un badge secondaire distinct du badge exploration

5. Direction UX / responsive
Liste admin :
- conserver la barre actuelle mais la rendre plus éditoriale :
  - recherche pleine largeur
  - groupe de filtres responsive sous la recherche sur petit écran
  - type filter en `ToggleGroup` si l’espace le permet, sinon `Select` mobile-friendly
- cartes événements :
  - badge statut
  - date
  - titre
  - badges lieu / exploration / type / participants
  - wrapping propre sur mobile

Fiche événement :
- transformer la zone exploration en mini panneau de contexte :
  - sélecteur
  - badge type
  - encart visuel harmonisé avec la preview des marches
- sur mobile, tout reste en pile verticale sans débordement

6. Détails techniques
Base de données
- nouvelle migration Supabase :
  - création enum `public.exploration_type`
  - ajout colonne `exploration_type` sur `public.explorations`
  - valeur nullable au départ pour compatibilité avec l’existant, puis backfill éventuel plus tard
- pas de nouvelle table nécessaire
- pas de changement RLS spécifique requis pour ce champ seul

Types frontend
- étendre `src/types/exploration.ts` avec :
  - `ExplorationType`
  - éventuellement helpers de label/couleur
- idéalement centraliser un mapping :
  - valeur DB -> label FR
  - valeur DB -> classes badge

Écrans à modifier
- `src/pages/MarcheEventsAdmin.tsx`
- `src/pages/MarcheEventDetail.tsx`
- écran de gestion des explorations correspondant
- `src/types/exploration.ts`
- `supabase/migrations/...`

7. Résultat attendu
- chaque exploration possède 1 type unique
- la fiche exploration permet de définir ce type
- la fiche événement affiche clairement le type de l’exploration associée
- la liste des événements peut être filtrée par type ou tous les types
- l’ensemble reste propre, lisible, cohérent et responsive
- aucun autre périmètre n’est modifié inutilement

8. Point d’attention
Il faudra gérer élégamment les explorations déjà existantes sans type :
- affichage “Type non défini” côté admin tant que non renseigné
- filtre “Tous” continue de fonctionner
- pas de blocage brutal tant que la donnée historique n’est pas complétée
