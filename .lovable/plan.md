# Onglet « Apprendre › La main » — chargement instantané et lecture progressive

## Constat

L'onglet rend aujourd'hui **toutes les pratiques en entier dès l'ouverture** : pour chaque carte, jusqu'à 6 vignettes en pleine résolution + la description HTML complète + le bloc `PratiqueMarcheursPicker`. Avec 8-15 pratiques, cela représente vite 50+ images simultanées et un long bloc de texte → l'attente perçue est forte, surtout sur mobile.

## Objectifs

1. **First paint < 400 ms** : la structure (titres) doit apparaître immédiatement.
2. **Lecture progressive** : l'utilisateur choisit ce qu'il déplie.
3. **Effet wahouhh** : skeleton poétique + reveal en cascade + transitions douces.

## Changements (frontend uniquement, `MainCuration.tsx`)

### 1. Mode accordéon par défaut
- Chaque pratique devient une **carte repliable** (`<Collapsible>` shadcn).
- **État par défaut : toutes repliées** sauf la première (donne immédiatement le ton éditorial sans surcharger).
- En mode replié on affiche : titre + nombre de médias + 1 vignette « héro » miniature (40×40) + 1ʳᵉ ligne de description en aperçu (`line-clamp-1`).
- Animation : `framer-motion` height + fade (180 ms).

### 2. Bouton « Tout ouvrir / Tout fermer »
- Petit bouton dans la barre d'en-tête, à côté de « Réordonner ».
- État global `expandedIds: Set<string>` ; bascule entre `Set(all)` et `Set()`.
- L'état individuel reste manipulable après un « Tout ouvrir ».

### 3. Résumé tronqué + « Lire la suite »
- Quand la carte est ouverte, la description s'affiche tronquée à **250 caractères** (via `stripHtml` pour compter, puis on rend le HTML original avec `max-height` + dégradé blanc en bas).
- Bouton « Lire la suite ↓ » / « Réduire ↑ » en lien discret emeraude.
- Si la description fait < 250 caractères : pas de bouton, tout est affiché.

### 4. Optimisation des vignettes
- Quand ouvert, on affiche **les 3 premières vignettes** dans la grille 3-cols (au lieu de 6) + tuile « +N » sur la 3ᵉ si dépassement → clic = ouvre la lightbox sur l'image 4.
- Toutes les `<img>` reçoivent `loading="lazy"` + `decoding="async"` + `fetchpriority="low"` (sauf la héro de la 1ʳᵉ carte ouverte = `eager`).
- Pour les vignettes Supabase Storage, on suffixe l'URL avec `?width=400&quality=60` (transformer d'images Supabase natif) — fallback silencieux à l'URL originale si le bucket ne supporte pas.
- `<video preload="metadata">` déjà en place : on passe à `preload="none"` + un placeholder poster jusqu'au déploiement.

### 5. Skeleton poétique au chargement
- Tant que `isLoading`, on remplace le texte « Chargement… » par 3 cartes squelettes shimmer émeraude (réutilisation de `MediaSkeletonGrid` en mode `fiche`).

### 6. Stagger reveal à l'apparition
- `motion.div` avec `transition={{ delay: i * 0.04 }}` sur chaque carte → cascade douce de 40 ms (limité aux 8 premières pour ne pas allonger).

### 7. Lazy-mount du `PratiqueMarcheursPicker`
- Le sous-composant interroge `useExplorationMarcheurs` et fait du rendu non trivial. **On ne le monte que lorsque la carte est ouverte** (`{expanded && <PratiqueMarcheursPicker .../>}`).
- Gain massif : avec 10 cartes repliées, 0 picker monté au lieu de 10.

### 8. Mémoire UX
- État `expandedIds` persistant dans `localStorage` sous clé `main-curation-expanded:<explorationId>` (TTL 7 jours).
- Au retour, l'utilisateur retrouve ses cartes ouvertes.

## Décisions par défaut (questions non répondues)

- **Ouverture** : 1ʳᵉ carte ouverte, autres repliées (compromis lecture/perf).
- **Résolution** : transformer Supabase `?width=400&quality=60` avec fallback.
- **Bonus wahouhh retenus** : skeleton + stagger reveal + lazy-mount picker.
- **Recherche / sticky-sommaire** : non inclus (à réserver pour quand le nombre de pratiques dépasse vraiment 10-15 dans une exploration).
- **Mémoire** : oui, localStorage par exploration.

## Détails techniques

```text
MainCuration.tsx
├─ état nouveau : expandedIds: Set<string>, allExpanded: boolean
├─ helper : stripHtml(description).slice(0, 250) pour résumé
├─ helper : optimizeStorageUrl(url) → ajoute ?width=400&quality=60 si supabase.co/storage
├─ Collapsible carte :
│   ├─ Header (toujours visible) : chevron + titre + count médias + ligne aperçu
│   └─ Content (motion height) : grille 3 vignettes + description tronquée + actions + Picker
└─ Toolbar : bouton « Tout ouvrir / fermer » avec icône ChevronsUpDown / ChevronsDownUp
```

Aucune migration SQL, aucune nouvelle dépendance (framer-motion, @radix collapsible, lucide-react déjà présents).

## Validation

- Ouverture onglet avec 10+ pratiques : titres apparaissent < 400 ms (devtools Network throttling Fast 3G).
- Clic « Tout ouvrir » : toutes les cartes se déploient en cascade.
- Description longue : « Lire la suite » apparaît, clic = expansion complète.
- Retour sur l'onglet plus tard : cartes ré-ouvertes restaurées depuis localStorage.
- HEIC, vidéos, audios continuent de fonctionner dans la lightbox.
