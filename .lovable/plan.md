# Fiche espèce — UX wahouhh : carrousel sourcé, dates, dialogue IA

Cible : `SpeciesGalleryDetailModal` ouvert depuis l'onglet **Synthèse → Taxons observés** sur `/marches-du-vivant/mon-espace/exploration/:id`.

## Ce qu'on ajoute

### 1. Carrousel "Référence iNaturalist ↔ Photos marcheurs" avec source visible

Aujourd'hui les `photos` sont fusionnées sans distinction de provenance. On va :

- Construire un tableau typé `gallerySlides: { url, source: 'inat' | 'marcheur' | 'gbif', credit?: string, observerName?: string, date?: string, originalUrl?: string, marcheName?: string }[]`.
  - **iNat / référence** : depuis `useSpeciesPhoto` (photo + credit existants).
  - **Marcheur** : nouveau hook `useSpeciesMarcheurPhotos(scientificName, explorationId)` qui interroge `marcheur_observations` (jointure médias) filtré sur les marches de l'exploration, et expose `photo_url`, `marcheur_name`, `observation_date`, `marche_name`.
- Dans le hero du modal :
  - Remplacer la nav `<button prev/next>` par un **carrousel Embla** (`@/components/ui/carousel` déjà disponible) avec snap horizontal + swipe tactile.
  - Sur chaque slide, en bas-gauche, une **pastille glassmorphique** (`bg-black/45 backdrop-blur`) :
    - icône (Leaf/Camera) + libellé : `Référence · iNaturalist`, `Photo marcheur · Laurence K.`, `GBIF · …`
    - sous-ligne discrète : date (format FR court) + lien "voir la source" si `originalUrl`.
  - Badge "Référence" / "Communauté" en haut-gauche, code couleur (emerald = communauté, sky = référence).
  - Indicateur de position : segments fins en bas (un par source), avec étiquette du groupe survolé.
  - Petit bandeau d'intro la première fois : "Glissez pour comparer la référence aux observations des marcheurs" (dismissable, persisté en `localStorage`).
- Lightbox conservée, en mode plein écran on garde le crédit + date en surimpression.

### 2. Dates affichées dans l'onglet Liste

Dans `SpeciesMarchesTab.tsx`, pour chaque carte de marche :
- Ajouter une ligne sous le nom de la marche : `📅 {format(observationDate, 'd MMM yyyy', { locale: fr })}`.
- Si plusieurs observations sur la même marche : afficher `Première : … · Dernière : …` (récupérer min/max depuis `useSpeciesMarches` qu'on enrichit avec `firstDate` / `lastDate`).
- Tri secondaire des cartes : par date desc à l'intérieur du même `order`.
- Style : pastille discrète `bg-white/5 text-white/60 text-[10px]`, icône Calendar lucide.

### 3. Dialoguer avec le chatbot depuis la fiche

- Ajouter un bouton primaire "Discuter de cette espèce avec l'IA" dans le modal (sous l'identité, au-dessus de "Observé sur ces marches"), visible uniquement si `useCanUseContextualChat().canUse === true` (admin / ambassadeur / sentinelle).
- Mécanique :
  - Émettre `window.dispatchEvent(new CustomEvent('community-chat:open', { detail: { prefill, context } }))`.
  - Dans `ChatBot.tsx`, écouter cet event : `setIsOpen(true)` + pré-remplir l'input avec un prompt contextualisé (ex. *"Parle-moi de la Mésange charbonnière observée 5 fois sur cette exploration, et explique pourquoi elle est sensible ici"*).
  - Le snapshot `apprendre.especeOuverte` est déjà injecté (lignes 101-124) → l'IA a déjà le contexte filtré.
- UX : micro-animation (sparkle) sur le bouton, libellé adaptatif selon le règne ("Demander à l'IA", "Comprendre cette espèce").
- Sur mobile, le bouton flotte en bas du modal en sticky pour rester accessible.

## Détails techniques

### Nouveaux fichiers
- `src/hooks/useSpeciesMarcheurPhotos.ts` — query Supabase, retourne `MarcheurPhoto[]` (url, observerName, date, marcheName, marcheId).
- `src/components/biodiversity/species-modal/SpeciesPhotoCarousel.tsx` — composant carrousel (Embla + crédits + badges sources).

### Fichiers modifiés
- `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` :
  - Construire `gallerySlides` typé, remplacer le hero existant par `<SpeciesPhotoCarousel slides={…} />`.
  - Ajouter le bouton "Discuter avec l'IA" gated par `useCanUseContextualChat`.
- `src/components/biodiversity/species-modal/SpeciesMarchesTab.tsx` :
  - Afficher `observationDate` (+ `firstDate`/`lastDate` si dispo), ajouter icône Calendar, tri secondaire date desc.
- `src/hooks/useSpeciesMarches.ts` :
  - Étendre `SpeciesMarcheData` avec `firstDate?` / `lastDate?` calculés à partir des snapshots et `marcheur_observations`.
- `src/components/chatbot/ChatBot.tsx` :
  - `useEffect` qui écoute `community-chat:open` → `setIsOpen(true)` + setInput(prefill).

### Sécurité / RLS
- `useSpeciesMarcheurPhotos` : filtrer strictement sur `marche_id ∈ exploration_marches(explorationId)` ; ne renvoyer que les médias des marcheurs publiés (statut `published`/`published_public`) pour respecter la visibilité existante. Pas d'exposition PII supplémentaire (le nom marcheur est déjà visible dans l'onglet Marcheurs).

### Mémoire à mettre à jour
Une fois implémenté, créer `mem://features/community/species-card-carousel-and-chat-logic.md` (carrousel sourcé + dates dans liste + ouverture chat IA contextuelle via CustomEvent).

## Hors-scope (à confirmer plus tard)
- Comparaison côte-à-côte référence/marcheur en split-view.
- Vote "ressemble / ne ressemble pas" sur les photos marcheurs.
- Filtrage du carrousel par marcheur sélectionné.
