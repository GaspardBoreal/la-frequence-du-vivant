# Ajustements du cahier « Portrait + J'observe »

## 1. Photo d'ouverture sélectionnable

Objectif : laisser l'utilisateur désigner explicitement la photo qui servira de couverture (variante `hero-photo`), au lieu de prendre simplement la première du tri.

- **`src/components/propriete/portrait/GalleryBento.tsx`** : ajouter sur chaque vignette (au survol, à côté de la poignée de drag) un bouton étoile « ✦ Photo d'ouverture ». Un clic remonte la photo à l'index 0 via le `onReorder` existant et déclenche la sauvegarde (`useSavePropertyGallery`). La vignette actuellement en position 0 reçoit un badge discret « Ouverture » (filet or, coin haut-droit) pour rendre le statut lisible sans nouvelle colonne en base.
- **`src/components/propriete/portrait/TabPortrait.tsx`** : ajouter une courte ligne d'aide sous la galerie : *« La première photo ouvre le cahier imprimé — cliquez ✦ pour changer d'ouverture. »*
- Aucune migration Supabase : on réutilise `order_index` déjà persisté par `set_propriete_gallery`. `PortraitPrintLayout` continue de prendre `photos[0]` comme couverture.

## 2. Réinsérer la page « respiration citation » en avant-dernière page

La page crème avec la citation *« Regarder un lieu, c'est déjà en prendre soin. »* (copie 2) disparaît du cahier combiné quand le nombre de planches est faible (la boucle de rythme n'en génère plus). Elle doit toujours apparaître, positionnée juste avant le colophon.

- **`src/components/propriete/portrait/PortraitPrintLayout.tsx`** :
  - Ajouter une prop `finalBreath?: boolean` (défaut `true` en mode `hero-photo`).
  - Après `{insertBeforeColophon}` et avant la section colophon, rendre inconditionnellement une `<section className="portrait-print-page portrait-print-breath portrait-print-breath-final">` avec la citation d'ouverture (`QUOTES[0]`).
  - Recalculer `totalPages` (+1) et le `pageCursor` pour que la pagination du footer reste juste (la citation devient `totalPages - 1`, le colophon `totalPages`).
  - Retirer la respiration automatique équivalente de la boucle si elle tombe en dernière position, pour éviter le doublon.

## 3. Colophon : picto centré en bas de page

Actuellement la « signature » (Marches du Vivant · La Fréquence du Vivant + point or) est collée sous la grille, non centrée verticalement et alignée à gauche selon la largeur du bloc.

- **`src/components/propriete/portrait/PortraitPrintLayout.tsx`** : envelopper `portrait-print-signature` dans un conteneur `portrait-print-colophon-mark` positionné en bas de page.
- **`src/index.css`** (bloc print déjà présent) :
  - `.portrait-print-colophon { display: flex; flex-direction: column; }`
  - `.portrait-print-colophon-mark { margin-top: auto; display: flex; justify-content: center; padding-bottom: 18mm; }`
  - `.portrait-print-signature { justify-content: center; text-align: center; }`
  - Le footer paginé reste ancré tout en bas via son positionnement absolu existant.

## Vérification

`/propriete/jardin-monde-deviat` → onglet **Portrait** : cliquer ✦ sur une vignette autre que la première, vérifier que le badge « Ouverture » se déplace. Puis **J'observe → Imprimer → Cahier complet** :

1. Page 1 = la photo choisie, avec date d'édition en pied.
2. Avant-dernière page = citation crème centrée (« Regarder un lieu… »).
3. Dernière page = colophon avec la signature « Marches du Vivant · La Fréquence du Vivant » centrée horizontalement en bas de la page.
