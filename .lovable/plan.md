# Impression combinée "J'observe" (+ Portrait)

## Comportement cible

Au clic sur **Imprimer** dans le carnet scellé de "J'observe" :

1. Une **modale design** s'ouvre au lieu de lancer l'impression directement.
2. Deux choix illustrés, côte à côte :
   - **Carnet seul** — synthèse "J'observe" uniquement (comportement actuel).
   - **Cahier complet** — "J'observe" puis "Portrait du site" dans un seul document, séparés par une page de garde intercalaire.
3. Confirmation → construction du DOM d'impression combiné, attente du chargement images, `window.print()`, nettoyage.

## Design de la modale (Radix Dialog déjà utilisé partout)

- Fond crème `hsl(var(--ds-cream))`, filet or `hsl(var(--ds-gold))`, coins arrondis 24px, ombre douce.
- Titre serif Cormorant : *« Comment souhaitez-vous imprimer ce carnet ? »*
- Sous-titre italique bronze : *« Deux façons de partager votre regard sur le site. »*
- Deux **cartes-choix** cliquables (grille 2 colonnes, empilées mobile) :
  - Miniature SVG maison en aquarelle (cachet daté seul vs cachet + planches photo empilées).
  - Titre + 1 ligne descriptive + estimation `~N pages`.
  - Hover : liseré or, léger scale, ombre chaude.
  - Une carte "recommandée" (Cahier complet si la galerie Portrait contient ≥ 1 photo) porte un ruban discret *« Recommandé »*.
- Si aucune photo Portrait n'existe : la 2ᵉ carte est désactivée, tooltip *« Ajoutez d'abord des photos dans l'onglet Portrait. »*
- Pied de modale : bouton fantôme "Annuler" + bouton principal "Imprimer" (activé après sélection), avec picto `Printer` animé au hover.

## Impression combinée (single PDF, une seule pop-up navigateur)

Nouveau composant `CombinedPrintLayout.tsx` monté via `createPortal` sur `document.body` dans un `<div id="combined-print-portal">` :

```
[Couverture crème "Carnet du site — {propriete}"]
[Section 1 : rendu <ObserveSummary print /> ]
[Page intercalaire : "Portrait du site" + cachet daté]
[Section 2 : rendu <PortraitPrintLayout photos={...} />]
```

- Nouvelle règle CSS d'isolation impression :
  ```
  body.combined-printing > *:not(#combined-print-portal) { display: none !important; }
  @page { size: A4; margin: 0; }
  .combined-print-root .print-break { break-before: page; }
  ```
- `ObserveSummary` accepte une nouvelle prop `printMode?: 'inline' | 'standalone'` pour ne pas ré-appliquer sa propre logique `window.print()` quand rendu dans le layout combiné (retire ses `print:hidden` sur le header).
- Attente `Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })))` avant `window.print()` — même pattern que TabPortrait.
- `afterprint` : démontage portail, retrait classe `combined-printing`.

## Où brancher le déclencheur

- `ObserveSummary.tsx` : le bouton "Imprimer" (l.289) n'appelle plus `window.print()` directement. Il appelle une prop `onPrint()` fournie par `TabObserve`.
- `TabObserve.tsx` : détient l'état `printChoice: 'observe' | 'combined' | null`, ouvre `<PrintChoiceDialog>`, connaît `photos.length` via hook existant `usePropertyGallery(proprieteId)`, monte `<CombinedPrintLayout>` quand nécessaire.
- Si l'utilisateur choisit "Carnet seul" → on garde l'ancienne isolation `observe-printing` (déjà fonctionnelle).
- Si "Cahier complet" → nouvelle isolation `combined-printing` + layout combiné.

## Fichiers touchés

- **Nouveaux**
  - `src/components/propriete/print/PrintChoiceDialog.tsx` — modale de choix (Radix Dialog + illustrations SVG inline).
  - `src/components/propriete/print/CombinedPrintLayout.tsx` — layout d'impression fusionné (couverture + Observe + intercalaire + Portrait).
  - `src/components/propriete/print/usePrintCombined.ts` — hook orchestrant portail, attente images, `window.print()`, cleanup.
- **Modifiés**
  - `src/components/propriete/observe/ObserveSummary.tsx` — prop `onPrint?()`; supprimer l'appel direct à `window.print()` lorsqu'un handler est fourni.
  - `src/components/propriete/tabs/TabObserve.tsx` — état + rendu de la modale + branchement du layout combiné ; injecte `onPrint` dans `<ObserveSummary>`.
  - `src/index.css` — ajouter le bloc `@media print` pour `#combined-print-portal` (isolation + `@page` + `print-color-adjust: exact` + `break-before: page`).

## Vérification

Ouvrir `/propriete/jardin-monde-deviat` → onglet "J'observe" (étape complétée) → bouton **Imprimer** → la modale s'affiche → choisir **Cahier complet** → un unique aperçu Chrome présente la synthèse Observe puis le cahier Portrait, correctement paginés, images visibles, sans fond noir.
