

# Supprimer le "sursaut" à l'ouverture du modal Marche

## Diagnostic

Quand on clique sur un événement dans le Carnet, le modal s'ouvre avec un contenu vide (les queries `adminPhotos`, `userMedias`, `stats` sont asynchrones). Quelques centaines de millisecondes plus tard, les données arrivent et le contenu apparaît d'un coup — provoquant un saut de layout visible et désagréable.

Causes techniques :
1. **Pas de skeleton/placeholder** pendant le chargement des données
2. **Le contenu du tab passe de 0px à sa hauteur réelle** sans transition
3. **L'AnimatePresence du tab content** ajoute un micro-mouvement vertical (`y: 4`) qui amplifie l'effet

## Solution : ouverture cinématique avec squelettes immersifs

### Principe UX

Au lieu d'un modal qui "saute", on obtient une ouverture fluide en 3 temps :
1. **Le modal apparaît** avec un fond atmosphérique et un skeleton élégant (shimmer sur des rectangles aux proportions photo)
2. **Les images chargent** et remplacent les squelettes avec un fondu doux
3. **Aucun saut de layout** car les squelettes occupent exactement l'espace final

### Fichiers modifiés

#### 1. `src/components/community/MarcheDetailModal.tsx`

**VoirTab** — ajouter un état de chargement avec skeleton grid :

- Exploiter `isLoading` des queries (`useQuery` retourne `isLoading`)
- Quand `isLoading === true` : afficher une grille de 6 squelettes `aspect-[3/4]` (mode immersion) avec animation shimmer
- Quand les données arrivent : fondu enchaîné (opacity transition) sans changement de hauteur

```text
┌─────────────────────────────────┐
│  ░░░░░░  ░░░░░░  ░░░░░░        │  ← Skeleton shimmer
│  ░░░░░░  ░░░░░░  ░░░░░░        │    (même aspect-ratio que
│  ░░░░░░  ░░░░░░  ░░░░░░        │     les vraies photos)
│  ░░░░░░  ░░░░░░  ░░░░░░        │
└─────────────────────────────────┘
         ↓  fondu 300ms  ↓
┌─────────────────────────────────┐
│  [photo] [photo] [photo]        │
│  [photo] [photo] [photo]        │
└─────────────────────────────────┘
```

**Modifications concrètes dans VoirTab :**
- Récupérer `isLoading` des queries `adminPhotos` et `userMedias`
- Créer un composant inline `PhotoSkeleton` : grille 3 colonnes × 2 rangées de `Skeleton` avec `aspect-[3/4]` et un léger gradient animé emerald
- Afficher le skeleton quand `isLoading`, sinon le contenu réel
- Retirer l'animation `y: 4` du `motion.div` parent pour éviter le double mouvement

**Modal principal (ligne ~937-951) :**
- Changer la transition du contenu de `y: 4` à `opacity` seule pour éliminer le décalage vertical
- Ajouter `layout` sur le conteneur scroll pour lisser tout changement de hauteur

#### 2. Nouveau composant `src/components/community/contributions/MediaSkeletonGrid.tsx`

Un composant réutilisable et visuellement inspirant :
- Grille 3 colonnes de squelettes `aspect-[3/4]` avec coins arrondis
- Animation shimmer avec gradient emerald subtil (pas le gris standard)
- Nombre de cellules configurable (défaut : 6)
- Compatible mode clair et sombre

### Résultat attendu

- L'ouverture du modal est **fluide et sans saut** : le skeleton réserve l'espace exact
- L'arrivée des photos est **progressive et élégante** (fondu)
- Le sentiment est celui d'une app native premium, pas d'une page web qui charge

