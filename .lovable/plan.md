# Carrousel saisonnier — Noms FR + Lightbox immersif

Deux évolutions du composant `src/components/immersive-garden/SeasonSpeciesCarousel.tsx` (aucun autre fichier touché).

## 1. Noms français cohérents avec l'app marcheurs

L'onglet Biodiversité → Taxons observés (`EventBiodiversityTab.tsx`) affiche les noms via `<SpeciesName />`, qui délègue à `useFrenchSpeciesNamesAuto` — cache DB `species_translations` + auto-traduction en tâche de fond, avec fade doux quand le nom FR arrive.

Actuellement le carrousel affiche `sp.commonName` brut (souvent EN, ex. « Common Ivy » au lieu de « Lierre grimpant »).

Correctif :
- Remplacer le bloc `<div className="text-[#f4ecd4] text-xs md:text-sm …">{sp.commonName}</div>` + ligne italique scientifique par un simple :
  ```tsx
  <SpeciesName
    scientificName={sp.scientificName}
    commonName={sp.commonName}
    showScientific
    size="sm"
    truncate
    className="[&_span:first-child]:text-[#f4ecd4] [&_span:last-child]:text-[#f4ecd4]/60"
    scientificClassName="font-serif"
  />
  ```
- Le composant gère déjà : fallback instantané → swap FR fade 200 ms → jamais de blanc. Même comportement visuel que la liste des Taxons observés côté marcheur.

## 2. Lightbox plein page cliquable, navigation prev/next

Ajouter un mode plein écran sur toute la liste `eligible` (pas seulement la page courante — l'utilisateur peut donc parcourir toutes les espèces de la saison sans quitter le lightbox).

Comportement :
- Clic sur une vignette → ouvre un overlay `fixed inset-0 z-[100]` avec `AnimatePresence`.
- Fond noir 92 % + backdrop-blur, halo saisonnier radial subtil derrière la photo.
- Image centrée `max-h-[85vh] max-w-[92vw] object-contain`, arrivée `scale 0.9→1 + fade` (spring doux).
- Sous l'image, carte texte compacte : `<SpeciesName showScientific size="lg" />` + badge « N obs en <saison> ».
- Boutons flèches ‹ / › (grands, ronds, glassmorphism `bg-white/10 backdrop-blur border-white/20`) positionnés `left-4 / right-4 top-1/2`. Bouton fermer × en haut à droite.
- Compteur discret en bas centre : `12 / 47 · <saison>`.
- **Clavier** : `←` prev, `→` next, `Esc` ferme (via `useEffect` window listener actif seulement quand ouvert).
- **Swipe mobile** : `motion.div` avec `drag="x"` + `onDragEnd` seuil ±60 px pour prev/next.
- **Preload** : précharge silencieusement `eligible[i-1]` et `eligible[i+1]` (nouvelles `Image()`) pour transition instantanée.
- **Focus trap léger** : `role="dialog" aria-modal="true" aria-label="Espèce en grand"`.

## Détail technique

État ajouté :
```ts
const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
```

Chaque vignette devient un `<button>` accessible (`aria-label={\`Voir \${displayName} en grand\`}`). L'index passé est l'index dans `eligible` (pas dans `slice`), calculé `currentPage * PAGE_SIZE + idx`.

Nouveau sous-composant local `<Lightbox />` (dans le même fichier pour rester atomique) :
- Reçoit `species: SpeciesItem[]`, `index`, `onIndexChange`, `onClose`, `resolvePhoto`, `tint`, `season`.
- Utilise `<SpeciesName />` pour le titre — cohérence FR garantie même en plein écran.
- Utilise `framer-motion` déjà importé, ajout de `useEffect` pour clavier + preload.

Aucun changement dans : `useGardenFiche`, `ImmersiveGardenFiche.tsx`, hooks de données, DB, edge functions.

## Hors périmètre

- Pas de zoom pinch/pan dans le lightbox (photo statique object-contain).
- Pas de partage social depuis le lightbox.
- Pas d'ouverture du drawer espèce complet (peut être ajouté ultérieurement — reste un simple visualiseur immersif).
