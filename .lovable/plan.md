## Problème observé

La fiche espèce s'ouvre dans un `Dialog` `max-w-2xl` centré sur fond opaque : sur desktop (1116px), elle apparaît comme une colonne étroite avec beaucoup de vide latéral, et sur mobile elle laisse des marges qui cassent l'immersion. La hero photo, le carrousel, les onglets et la liste se retrouvent dans une fenêtre qui ne respire pas.

## Direction UX/UI

Adopter un pattern **mobile-first immersif** :

- **Mobile (≤ md)** : bottom sheet plein écran (Drawer Vaul), photo hero edge-to-edge, contenu scrollable, handle bar en haut, fermeture par swipe.
- **Desktop (≥ md)** : side sheet ancré à droite (largeur ~ 560–640 px), pleine hauteur, ombre douce, photo hero plein cadre du panneau, contenu scrollable interne. Pas de "petite carte centrée" qui flotte.

Avantages : surface utile maximale sur tous les écrans, gestes naturels mobile, lecture longue confortable desktop, photos qui respirent.

## Changements

### 1. `SpeciesGalleryDetailModal.tsx`
- Remplacer `Dialog`/`DialogContent` par un composant responsive :
  - `useIsMobile()` → si mobile : `Drawer` (vaul, déjà présent dans le projet via shadcn) en bottom sheet `h-[95vh]`.
  - Sinon : `Sheet` shadcn `side="right"` avec `w-full sm:max-w-[600px]` pleine hauteur.
- Conteneur scroll unique : header sticky (nom + close), hero photo, puis contenu.
- Padding latéral : `px-4 md:px-5`, top padding réduit (la photo touche les bords).
- Titre accessible conservé via `VisuallyHidden`.

### 2. `SpeciesPhotoCarousel.tsx`
- Hero responsive : `aspect-[4/3] md:aspect-[16/10]` ; supprimer `max-h-[42vh]` pour laisser respirer dans le sheet plein écran.
- Flèches nav : taille `w-10 h-10 md:w-11 md:h-11`, halo plus marqué.
- Toggle segmenté + thumbnails : conserver, mais alignés et collés au bord du sheet (pas de gap latéral inutile).
- Thumbnails : passer à `w-16 h-16` sur desktop, scroll horizontal lisse, snap.
- Compteur 1/N et badges inchangés (déjà bons).

### 3. Header sticky léger
- Petite barre flottante au-dessus de la hero (sur mobile, après scroll) avec nom français + bouton close, fond `bg-slate-900/80 backdrop-blur`.

### 4. Onglets (Liste / Carte / Observateurs)
- TabsList full width déjà OK ; ajuster taille touch target mobile (`h-10`).
- Liste : afficher la date sous le nom de marche (déjà fait précédemment), vérifier line-height.

### 5. CTA "Discuter avec l'IA"
- Devient sticky en bas sur mobile (`sticky bottom-0` dans le scroll container) avec dégradé + safe-area `pb-[env(safe-area-inset-bottom)]`. Sur desktop, reste inline sous le bloc identité.

## Détails techniques

- Réutiliser `@/components/ui/drawer` (Vaul) et `@/components/ui/sheet` déjà installés (vérifier rapidement avant d'éditer).
- Hook `useIsMobile` déjà présent (`src/hooks/use-mobile.tsx`).
- Pas de changement de logique data : `gallerySlides`, `useSpeciesMarcheurPhotos`, fusion par URL inchangés.
- Lightbox (portal) inchangé.
- Pas de nouveau token couleur ; rester sur l'esthétique sombre actuelle de la fiche.

## Hors-scope

- Refonte du contenu (sections audio, liens externes) : on garde l'ordre actuel.
- Changement du carrousel data-side (sources, fusion) : déjà validé précédemment.
- Refonte des autres modals biodiversité.

## QA

1. Mobile 375px : sheet plein écran, photo hero edge-to-edge, CTA IA accessible au pouce, swipe-to-close.
2. Tablette 820px : side sheet 600px à droite, contenu lisible.
3. Desktop 1116px (cas de la capture) : side sheet à droite, plus de "petite fenêtre flottante".
4. Vérifier que les onglets Liste / Carte / Observateurs restent fonctionnels et que les flèches du carrousel ne sont jamais masquées.
