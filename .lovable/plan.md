
# Toggle Galerie ↔ Liste pour les vues espèces

## Objectif

Aligner la qualité d'affichage des vignettes espèces sur celle de l'écran « Apprendre › L'œil » (tuile carrée plein cadre, photo haute résolution, badges flottants élégants) tout en conservant la vue Liste actuelle comme alternative analytique.

## Méthode validée (analyse E1)

L'écran « Apprendre › L'œil » utilise `CuratedSpeciesCard` :
- Tuile `aspect-square` plein cadre, `object-cover`, `loading="lazy"`, `group-hover:scale-[1.03]`
- Source photo : `useSpeciesPhoto(scientificName)` → cascade photo marcheur > iNaturalist (URL « large » non « square »)
- Compteur d'observations en pill noire `bg-black/60 backdrop-blur` bas-gauche
- Nom commun FR + nom latin italic sous la photo
- Bordure ambre subtile si épinglée

L'écran « Biodiversité › Taxons observés » utilise `EnhancedSpeciesCard` : carte horizontale avec mini-vignette (~64 px), badges source/photo et date à droite. Format dense mais résolution photo bridée.

## Architecture

### 1. Contexte global de mode d'affichage

Nouveau `src/contexts/SpeciesViewModeContext.tsx`
- Valeurs : `'gallery' | 'list'` (défaut `'gallery'`)
- Persistance `localStorage` clé `lfdv.species-view-mode`
- Provider monté au niveau racine `App.tsx` (à côté de `SpeciesPhotoModeProvider`)
- Hook `useSpeciesViewMode()` exposant `{ mode, setMode }`

### 2. Composant de bascule

Nouveau `src/components/biodiversity/SpeciesViewModeToggle.tsx`
- Même langage visuel que `SpeciesPhotoModeToggle` (pill segmentée glassmorphism)
- 2 options : `Galerie` (icône `LayoutGrid`) / `Liste` (icône `Rows3`)
- Indicateur actif `layoutId` framer-motion (slide fluide entre options)
- Halo pulsé sur sélection (cohérent avec le toggle existant)

### 3. Nouvelle tuile Galerie réutilisable

Nouveau `src/components/biodiversity/SpeciesGalleryCard.tsx`
- S'inspire directement de `CuratedSpeciesCard` mais sans logique de curation
- Props : `species: BiodiversitySpecies`, `translation?`, `onClick?`
- Tuile `aspect-square` plein cadre, photo via `useSpeciesPhoto`
- Pill compteur `XX obs.` bas-gauche
- Pastille source iNat (réutilise le composant pastille existant de `SpeciesThumb`) discrète haut-droite
- Nom FR (semi-bold) + nom latin (italic, plus petit) sous l'image, padding `p-2.5`
- Hover : `scale-[1.03]` sur l'image + halo subtil sur la bordure
- Slot `overlayTopLeft` pour les `MarcheurSpeciesTagDots` déjà gérés par le parent

### 4. Intégration dans `SpeciesExplorer.tsx`

- Insertion du `<SpeciesViewModeToggle />` à droite de la ligne « 19 espèces trouvées » (ligne refondue en flex avec `justify-between`)
- `renderSpeciesGrid` devient :
  ```tsx
  <motion.div layout className={mode === 'gallery' ? galleryGridCols : listGridCols}>
    <AnimatePresence>
      {list.map(sp => (
        <motion.div key={sp.id} layout
          initial={{opacity:0, scale:0.96}} animate={{opacity:1, scale:1}} exit={{opacity:0}}
          transition={{ type:'spring', stiffness:260, damping:28 }}>
          {mode === 'gallery'
            ? <SpeciesGalleryCard ... />
            : <EnhancedSpeciesCard ... />}
          <MarcheurSpeciesTagDots ... overlay />
        </motion.div>
      ))}
    </AnimatePresence>
  </motion.div>
  ```
- Grille Galerie : `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` (haute densité visuelle)
- Grille Liste : conservation des `gridCols` actuels

### 5. Transition FLIP morph

- `motion.div layout` sur le conteneur ET chaque vignette pour interpolation automatique des positions
- `LayoutGroup` autour de la grille pour partager le layoutId
- Image elle-même en `layoutId={`species-img-${sp.id}`}` pour qu'elle morphe de la mini-vignette liste vers la tuile carrée galerie et inversement
- `transition={{ layout: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}` (easing « expo-out » premium)
- Réduction des reflows : `will-change: transform` ajouté pendant la transition

## Périmètre d'application

Le contexte étant global, le toggle pilote l'affichage partout où `SpeciesExplorer` est utilisé (Biodiversité > Taxons, vue Carte si présente, portfolio marcheur, etc.). Le toggle visuel n'est rendu **que dans le bandeau de `SpeciesExplorer`** pour ne pas polluer les autres surfaces, mais la préférence stockée s'applique uniformément.

## Détails techniques

- Aucun changement backend, aucune nouvelle table.
- `useSpeciesPhoto` est déjà cache-aware via `species_thumb_cache` → pas de surcharge réseau.
- `framer-motion` déjà installé.
- `EnhancedSpeciesCard` et `CuratedSpeciesCard` restent intacts (zéro régression sur Apprendre > L'œil).
- Mode par défaut `gallery` à la première visite, mémorisé ensuite.

## Fichiers touchés

- **Nouveaux** :
  - `src/contexts/SpeciesViewModeContext.tsx`
  - `src/components/biodiversity/SpeciesViewModeToggle.tsx`
  - `src/components/biodiversity/SpeciesGalleryCard.tsx`
- **Modifiés** :
  - `src/App.tsx` (montage Provider)
  - `src/components/biodiversity/SpeciesExplorer.tsx` (bandeau + renderSpeciesGrid + LayoutGroup)

## Vérification

- Build TS / lint propres
- Navigation Biodiversité > Taxons : toggle visible à droite de « 19 espèces trouvées », défaut Galerie, photos plein cadre identiques à Apprendre > L'œil
- Bascule Galerie ↔ Liste : morph fluide ~450 ms, aucun saut, photos persistantes via `layoutId`
- Rechargement de page : mode mémorisé
- Vérification écran Apprendre > L'œil inchangé
