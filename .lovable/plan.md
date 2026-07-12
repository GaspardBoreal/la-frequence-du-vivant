## Objectif

Depuis la Carte des Marches du Vivant, quand un filtre catégorie est actif (ex. **Jardin**), permettre de naviguer d'un événement filtré au suivant / précédent directement depuis la fiche immersive `/jardin/:slug`, sans repasser par la carte. Ajouter un bouton **Retour** qui reconduit vers la carte en conservant les filtres, avec des transitions inter-fiches **wahouhhh**.

## UX cible

Sur `/jardin/:slug?cat=jardin&…` :

- **Chevron gauche** (bas-gauche, flottant) → jardin précédent de la liste filtrée.
- **Chevron droit** (bas-droit, flottant) → jardin suivant.
- **Compteur** minimaliste au centre : `3 / 12 · Jardin` (chip verre/or, halo doux).
- **Bouton retour** (haut-gauche existant) → renvoie vers `/marches-du-vivant/carte-marches-du-vivant?…` avec l'intégralité des filtres restaurés.
- Raccourcis clavier `←` / `→` / `Esc` (retour).
- Boutons désactivés en bout de liste ; si un seul événement, chevrons masqués.

## Transition wahouhhh entre fiches

Effet **« portail végétal »** orchestré côté client (Framer Motion, aucune dep) :

1. **Iris organique** : `clip-path: circle()` qui se referme depuis un point aléatoire (0.9s) sur la fiche sortante, teinté par la saison en cours.
2. **Voile doré** : radial-gradient `#f5d68a` en `mix-blend-mode: screen`, opacité 0→0.55→0, 700 ms.
3. **Feuilles/particules** : ~14 pétales SVG animés depuis le centre du chevron cliqué (parallax, rotation, fade), 900 ms.
4. **Blur + scale** sortie (`blur 0→14px`, `scale 1→1.06`) et entrée inverse (`blur 12→0`, `scale 1.08→1`) synchronisés.
5. **Cross-fade titre** : ancien titre monte/opacité 0, nouveau descend/opacité 1, décalé de 150 ms.
6. **Préchargement** de la cover + première `heroPhoto` du jardin cible pour éviter tout flash blanc.
7. **Reduced motion** : simple cross-fade 250 ms, aucune particule ni clip-path.

Navigation implémentée **sans démonter la page** : la même route `/jardin/:slug` change de `slug` via `navigate()`, et un composant `GardenTransitionOverlay` orchestré par `AnimatePresence` couvre le swap.

## Passage du contexte de filtres

**Encodage URL** (source de vérité, partageable) : on sérialise les filtres actifs de `useCarteMdVFilters` dans le lien "Découvrir" de `EventCard` sous une clé unique `?from=carte&<mêmes clés que la carte>` (q, type, cat, status, season, minSpecies, zone, audio, photos, view…).

Sur la fiche jardin :

- Un hook `useSiblingGardenEvents()` lit `useSearchParams`, reconstruit un objet `CarteMdVFilters` partiel, appelle `useCarteMdVEvents()` (déjà en cache TanStack → instantané si l'utilisateur vient de la carte), applique `applyFilters`, garde uniquement `category === 'jardin'` (ou la catégorie active si différente, ex. filtre unique), trie par `date_marche desc` comme dans `ListView`.
- Retourne `{ list, index, prev, next, backHref }` où `backHref` reconstruit `/marches-du-vivant/carte-marches-du-vivant?…` avec les mêmes params.

Si aucun filtre n'est passé (accès direct à `/jardin/:slug`), fallback : liste = tous les jardins publiés, ordre date desc → les chevrons naviguent quand même entre jardins.

## Fichiers touchés

### `src/components/carte-mdv/EventCard.tsx`
- Lire l'URL courante via `useLocation()` (ou passer les filtres en prop depuis `ListView`/parents ; on prend `useLocation().search` car déjà synchronisé).
- Concaténer `location.search` à `detailUrl` quand `isJardin` : `/jardin/<slug>?<mêmes params>` (nettoyer `view` si besoin).

### `src/hooks/useSiblingGardenEvents.ts` (nouveau)
- Reconstruit les filtres depuis `useSearchParams`.
- Utilise `useCarteMdVEvents` + `applyFilters` (mêmes règles que la carte, cache partagé).
- Restreint à `category === 'jardin'` par défaut ; conserve `filters.categories` si présent.
- Fournit `prevHref`, `nextHref`, `backHref`, `index`, `total`, `categoryLabel`.

### `src/components/immersive-garden/GardenSiblingNav.tsx` (nouveau)
- UI flottante : deux `OrganicButton` (chevrons), chip central `n / total · Catégorie`.
- `AnimatePresence` + gestion `←`/`→`/`Esc`.
- Déclenche `onNavigate(direction, originXY)` transmis au parent pour l'overlay.

### `src/components/immersive-garden/GardenTransitionOverlay.tsx` (nouveau)
- Overlay plein écran orchestrant iris + voile doré + pétales SVG.
- Props : `active`, `origin {x,y}`, `tint`, `onDone`.
- Précharge (Image() JS) la cover du jardin cible avant `navigate()`.
- Respect `useReducedMotion`.

### `src/pages/ImmersiveGardenFiche.tsx`
- Utilise `useSiblingGardenEvents(event)`.
- Remplace le bouton retour actuel : `to={backHref}` (fallback `/marches-du-vivant/carte-marches-du-vivant`).
- Monte `<GardenSiblingNav />` + `<GardenTransitionOverlay />`.
- Enveloppe la fiche dans un `motion.div key={event.id}` avec variants `enter/exit` (blur+scale+fade) pour compléter la transition côté contenu.

## Hors scope

- Aucun changement backend, aucune migration.
- Pas de modification des vues de la carte (map/list/wall/etc.) autres que l'ajout du contexte URL au lien.
- Pas de changement des données `useGardenFiche` ni du carrousel Ken Burns.

## Détails techniques

- Les filtres sont déjà sérialisés en URL par `useCarteMdVFilters` → mêmes clés, on relit avec `useSearchParams`, aucune duplication de logique.
- `useCarteMdVEvents` est mis en cache 5 min par TanStack Query : le hook sibling ne relance aucune requête si l'utilisateur arrive depuis la carte.
- Préchargement image : `const img = new Image(); img.src = target.cover_image_url` juste avant `setTimeout(navigate, 350)`.
- Sécurité : la navigation clavier ignore les inputs focus (`document.activeElement?.tagName === 'INPUT'|'TEXTAREA'`).
- Fallback SEO : `<link rel="prev">` / `<link rel="next">` ajoutés dans le `<Helmet>` quand la liste sibling contient des voisins.
