
# Vue Carte de Curation IA — Onglet « Reconnaissance IA »

Ajout d'une **vue carte interactive** dans l'onglet Reconnaissance IA, à côté des compteurs actuels, pour visualiser, filtrer, contrôler et valider en masse les photos reconnues par l'IA, géolocalisées sur la carte de l'événement.

## UX — Layout split-view

```text
┌───────────────────────────────────────────────────────────────┐
│  Compteurs + Lancer reconnaissance  (bloc existant, conservé) │
├──────────────────────────┬────────────────────────────────────┤
│                          │  FILTRES (sticky top)              │
│                          │  ─ Statut IA (chips multi)         │
│                          │  ─ Règne (Flore/Faune/Champi/?)    │
│                          │  ─ Marche/parcours (select)        │
│                          │  ─ Confiance (slider 0–100%)       │
│                          │  ─ Sans GPS (toggle)               │
│       CARTE LEAFLET      │  ─ Recherche espèce (text)         │
│   (RichMap réutilisée)   ├────────────────────────────────────┤
│                          │  LISTE PHOTOS (virtualisée)        │
│  • Markers colorés par   │  Vignettes 96px + chips statut/    │
│    statut IA             │  confiance + nom espèce top1       │
│  • Cluster auto          │  Hover → highlight marker          │
│  • Clic marker → ouvre   │  Clic → ouvre drawer curation      │
│    drawer                │  Checkbox sélection multi          │
│  • Tracé marche affiché  │                                    │
│  • Photos sans GPS →     │  ─── Barre d'actions sticky ───    │
│    pile "orphelines"     │  [Valider top1] [Non id.] [Re-IA]  │
│                          │  [Affecter à marche] [Export CSV]  │
└──────────────────────────┴────────────────────────────────────┘
```

Plein-écran disponible (bouton ⛶) — pattern déjà en place via `useFullscreenPreparation` + `RichMap`.

## Markers — sémantique visuelle

Couleur = statut IA, forme = règne, taille = confiance :

| Statut | Couleur marker | Icône centrale |
|---|---|---|
| auto_validated | emerald | ✓ |
| pending_curation | amber (pulse) | ? |
| low_confidence | orange | ! |
| validated_by_human | emerald foncé | ★ |
| unidentifiable | gris | ⊘ |
| pending/processing | bleu | ⋯ |

Halo proportionnel à la confiance (rayon 8→18px). Règne via micro-icône superposée (🌿 / 🐾 / 🍄 / ❓).

Cluster Leaflet (`leaflet.markercluster`) avec donut multi-couleurs représentant la répartition des statuts dans le cluster.

## Popup marker → mini-fiche

Photo 200px + top 3 suggestions cliquables (chaque ligne = bouton valider direct) + bouton **« Ouvrir la curation détaillée »** qui pousse le drawer plein.

## Drawer curation enrichi (réutilise `CurationCard`)

- **Carrousel des suggestions** (jusqu'à 5) avec photo de référence iNaturalist/GBIF en regard pour comparaison visuelle
- **Recherche manuelle** d'espèce (autocomplete GBIF — hook `useGbifTaxonSearch` déjà existant) si aucune suggestion n'est correcte
- **Repositionnement GPS** drag-and-drop sur mini-carte (réutilise `useRepositionMediaGps`)
- **Actions** : Valider · Modifier suggestion · Non identifiable · Relancer IA sur cette photo seule
- Navigation ← → entre photos en curation au clavier

## Sélection multiple & actions de masse

- Mode sélection (Cmd+clic ou checkbox liste)
- Lasso sur la carte (rectangle drag) pour sélectionner une zone
- Barre d'actions sticky en bas :
  - **Valider top-1 en lot** (uniquement si confiance ≥ seuil paramétrable)
  - **Marquer non identifiables**
  - **Relancer reconnaissance**
  - **Affecter à une marche** (rattachement géographique manuel)
  - **Exporter sélection** (CSV/GeoJSON, aligne sur Pack Vivant)

## Filtres

État local synchronisé en URL (`?status=pending_curation&kingdom=plante&marcheId=...`) pour partage et permaliens.

Présets rapides en haut : « À curer », « Faible confiance », « Auto-validées à vérifier », « Sans GPS », « Tout ».

## Photos sans GPS

Panneau pliable « 📍 N photos sans coordonnées » au-dessus de la liste, avec affectation rapide : drag d'une vignette sur la carte = pose un marker + écrit GPS via `reposition_marcheur_media_gps` (audit déjà en place).

## Implémentation technique

**Nouveaux fichiers :**
- `src/components/admin/marche-events/ai-recognition/AiCurationMapView.tsx` — composant split-view
- `src/components/admin/marche-events/ai-recognition/AiCurationFilters.tsx` — barre filtres
- `src/components/admin/marche-events/ai-recognition/AiCurationPhotoList.tsx` — liste virtualisée (react-window déjà dispo)
- `src/components/admin/marche-events/ai-recognition/AiPhotoMarker.tsx` — factory icônes Leaflet
- `src/components/admin/marche-events/ai-recognition/AiCurationDetailDrawer.tsx` — drawer enrichi
- `src/hooks/useAiCurationMedias.ts` — hook unifié (medias + suggestions + GPS extrait de `metadata.exif`)

**Réutilisations :**
- `RichMap` (`src/components/maps/RichMap.tsx`) pour la coque carte
- `useGbifTaxonSearch`, `useRepositionMediaGps`, `useReattributeMedia`
- `curate-marcheur-photo` edge function (déjà déployée, accepte `validate` / `unidentifiable`)
- `recognize-marcheur-photos` avec un nouveau paramètre optionnel `mediaIds?: string[]` pour relance ciblée

**Edge function — petite évolution :**
- `recognize-marcheur-photos` : accepter `mediaIds?: string[]` pour traiter uniquement la sélection (sinon comportement actuel inchangé).
- `curate-marcheur-photo` : accepter un mode `batch` `{ mediaIds: string[], action, scientificName? }` pour réduire les allers-retours réseau lors de la validation en masse.

**Intégration dans le panel existant :**
Dans `AiRecognitionPanel.tsx`, en dessous des compteurs, remplacer le bouton « Curer N photos » seul par un onglet local :
- **Vue Compacte** (drawer actuel) — conservée pour mobile
- **Vue Carte** (nouveau, par défaut sur desktop ≥ md)

## Performance

- Markers : cluster Leaflet, virtualisation liste, hooks paginés par chunks de 200
- Realtime Supabase sur `marcheur_medias` (filtre `marche_event_id=eq.X`) pour refléter instantanément les validations
- Mutations optimistes via `useQueryClient.setQueryData` (statut bascule instantanément en validé)

## Hors scope (à proposer plus tard si souhaité)

- Heatmap densité d'espèces non-identifiées
- Suggestions intelligentes de regroupement (« 3 photos similaires de cette zone — même espèce ? »)
- Mode comparaison côte-à-côte de 2 photos pour décider doublon vs distinct
