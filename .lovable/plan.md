## Objectif

Intégrer les 3 vidéos du test bêche (AFES, Bio Nouvelle-Aquitaine, Chambre d'Agriculture Nouvelle-Aquitaine) dans le Widget 3 « Étape 2 · Structure du sol », de façon **clairement optionnelle** : invisible/discret pour qui connaît déjà le test, immédiatement désirable pour qui découvre.

## Parti pris design : le « Ciné-terrain » replié

Aucun lecteur imposé, aucune vignette qui écrase le protocole. Sur la fiche-test A (bêche), sous les 3 étapes du protocole, une **barre d'appel repliée** :

```text
┌──────────────────────────────────────────────┐
│ ▷  Voir le geste — 3 regards de terrain      │
│    Optionnel · 3 vidéos · ~4 à 8 min      ▾  │
└──────────────────────────────────────────────┘
```

- Ligne fine dorée, icône film, chip « Optionnel » discrète.
- Au clic : dépliage animé (hauteur + fondu) révélant **3 mini-cartes « pellicule »** côte à côte (empilées en mobile) :
  - miniature YouTube réelle (`img.youtube.com/vi/<id>/hqdefault.jpg`), légère désaturation qui se lève au survol,
  - bouton play circulaire vert forêt avec halo doré animé,
  - nom de la source en petites capitales espacées (AFES / Bio Nouvelle-Aquitaine / Chambre d'Agriculture N-A),
  - une ligne d'angle éditorial pour orienter le choix (ex. « le regard scientifique », « le regard paysan bio », « le regard technique »),
  - liseré latéral doré + numéro sérigraphié pour l'esprit « planche de carnet ».
- Rien n'est chargé avant le clic : **facade YouTube** (image + play), l'iframe n'est montée qu'à l'ouverture → zéro impact perf/RGPD tant que l'utilisateur n'y va pas.

## Lecture

Clic sur une carte → **lightbox** (Dialog shadcn) plein cadre :
- fond assombri, cadre crème avec liseré doré, ratio 16/9,
- iframe `youtube-nocookie.com/embed/<id>?autoplay=1&rel=0`,
- barre inférieure : sélecteur des 3 sources pour passer d'une vidéo à l'autre sans fermer, et lien « Ouvrir sur YouTube ».

## Mémoire du geste (renforce l'optionnalité)

- Une fois une vidéo ouverte, la carte porte une pastille « vue » ; la barre affiche « Geste revu ».
- L'état déplié/replié est mémorisé en `localStorage` : celui qui replie ne le revoit plus déplié, celui qui découvre garde son panneau ouvert.
- Micro-lien secondaire « Je connais déjà le test » qui replie et marque la section comme acquise (visuel apaisé, plus de halo animé).

## Détails techniques

- `src/components/propriete/analyze/structureTests.ts` : remplir `videos` du test `beche` avec les 3 entrées (label = source, url = lien youtu.be) et étendre le type par des champs optionnels `angle` (ligne éditoriale) et `youtubeId` (dérivé automatiquement de l'URL si absent).
- Nouveau `src/components/propriete/analyze/VideoLightbox.tsx` : Dialog + iframe nocookie + navigation entre sources.
- Nouveau `src/components/propriete/analyze/TestVideoShelf.tsx` : barre repliée + grille de facades + persistance localStorage (clé par test id). Réutilisable tel quel par le Widget 4 (texture) quand les vidéos boudin/sédimentation arriveront.
- `StructureProtocolCard.tsx` : remplacer la rangée de puces `▶ Vidéo n` par `<TestVideoShelf test={test} />` (rendu uniquement si au moins une URL est fournie — comportement actuel conservé pour le test B sans vidéo).
- Tous les styles via les tokens existants `--ds-forest`, `--ds-forest-deep`, `--ds-cream`, `--ds-gold`, `--ds-line` ; animations framer-motion cohérentes avec les cartes voisines.
- Accessibilité : boutons réels, `aria-expanded` sur la barre, `title` sur l'iframe, focus visible, respect `prefers-reduced-motion` pour les halos.
