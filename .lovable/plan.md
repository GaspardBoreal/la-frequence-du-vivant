

## Nouvel onglet "Empreinte Vivante" — Biodiversité par événement

### Objectif
Créer un onglet à forte valeur ajoutée montrant la biodiversité collectée lors d'un événement de marche, visible à la fois dans l'admin et dans l'espace marcheur.

### Étape 0 — Collecter les données biodiversité manquantes
Les 11 marches de "La transhumance de Mouton Village" n'ont aucun `biodiversity_snapshot`. Il faut lancer la collecte via l'edge function `biodiversity-data` pour chacune de ces marches avant de pouvoir afficher des données réelles.
- Récupérer les coordonnées GPS de chaque marche
- Appeler l'edge function pour chacune
- Insérer les snapshots résultants

### Étape 1 — Composant partagé `EventBiodiversityTab`
Créer `src/components/community/EventBiodiversityTab.tsx`, un composant réutilisable acceptant un `explorationId` et un `marcheEventId`.

**Section Synthèse** (en haut)
- Agrège `biodiversity_snapshots` de toutes les marches liées à l'exploration
- Affiche 5 compteurs visuels en grille : Tous, Faune (birds_count), Flore (plants_count), Champignons (fungi_count), Autre (others_count)
- Design : cartes avec icônes colorées, animation de comptage, responsive mobile-first (2 colonnes mobile, 5 desktop)
- Indication du nombre de marches couvertes (ex: "11 étapes · 28-29 mars 2026")

**Section Taxons observés** (sous-menu)
- Liste triée par nombre d'observations décroissant
- Chaque ligne : picto catégorie (oiseau/plante/champignon/autre), nom, compteur
- Extraction depuis `species_data` des snapshots si disponible, sinon compteurs agrégés
- Filtre par catégorie (Tous / Faune / Flore / Champignons / Autre)

**Section Analyse IA** (sous-menu)
- Placeholder élégant avec design inspirant
- Icône IA, texte "L'analyse écologique de cet événement sera bientôt disponible"
- Badge "Bientôt disponible"

### Étape 2 — Intégration dans la page admin `/admin/marche-events/:id`
- Ajouter un système d'onglets (Tabs) en haut de la page : **Informations** | **Empreinte Vivante**
- L'onglet Informations contient le formulaire + QR + participants existants
- L'onglet Empreinte Vivante affiche le composant `EventBiodiversityTab`
- Visible uniquement en mode édition (pas pour "nouveau")

### Étape 3 — Intégration dans l'espace marcheur
- Ajouter un 5e onglet dans `ExplorationMarcheurPage.tsx` : `{ key: 'biodiversite', label: 'Empreinte', icon: Leaf }` (ou `TreePine`)
- Nouvel ordre : Carte, Marches, Empreinte, Marcheurs, Messages
- Affiche le même composant `EventBiodiversityTab`

### Étape 4 — État vide élégant
- Si aucun snapshot n'existe, afficher un état vide inspirant avec illustration et message d'encouragement
- "La biodiversité de cet événement n'a pas encore été collectée"

### Détail technique
- **Fichiers créés** : `src/components/community/EventBiodiversityTab.tsx`
- **Fichiers modifiés** : `MarcheEventDetail.tsx` (ajout onglets), `ExplorationMarcheurPage.tsx` (ajout onglet)
- **Requêtes** : `exploration_marches` → `marche_id[]` → `biodiversity_snapshots` (agrégation côté client)
- **Aucune migration DB nécessaire** — les données existent déjà dans `biodiversity_snapshots`
- **Attribution par marcheur** : reportée en V2 comme convenu

### UX/UI
- Mobile-first : cartes empilées sur mobile, grille sur desktop
- Palette nature : tons verts/ambrés cohérents avec le design existant
- Animations subtiles (framer-motion) pour les compteurs et transitions d'onglets
- Sous-navigation interne (Synthèse / Taxons / Analyse IA) via des boutons pill

