

## Section "Empreintes passées" avec carte interactive

### Vue d'ensemble

Ajouter une 3e section **"Empreintes passées"** dans l'onglet Marches, composée de :
1. Une **mini-carte Leaflet** montrant tous les événements passés géolocalisés
2. Des **vignettes compactes** en lecture seule sous la carte

### Données disponibles

La table `marche_events` possède déjà les colonnes `latitude` et `longitude`. Sur 5 événements existants, 2 ont des coordonnées (DEVIAT et NOUAILLE-MAUPERTUIS), 3 n'en ont pas. La carte affichera uniquement les événements géolocalisés ; les vignettes listeront tous les événements passés.

### Modifications

**1. `src/pages/MarchesDuVivantMonEspace.tsx`**
- Nouvelle requête `past-marche-events` : tous les événements où `date_marche < now()`, avec `latitude`, `longitude`, `event_type`, triés par date DESC, limit 20
- Sous-requête pour compter les participants par événement passé (count sur `marche_participations`)
- Passer `pastEvents` en prop à `MarchesTab`

**2. `src/components/community/tabs/MarchesTab.tsx`**
- Nouvelle prop `pastEvents` dans `MarchesTabProps`
- Nouveau composant `PastEventsMap` : mini-carte Leaflet (`h-48 md:h-64`) avec marqueurs colorés par type (même palette que les badges), popups compacts (titre + date + lieu)
- Nouveau composant `PastEventCard` : vignette compacte fond sépia (`bg-stone-50 dark:bg-stone-800/20`), badge type identique au Carnet, titre tronqué, date + lieu, compteur participants, icône Footprints en filigrane
- Section header : icône `Footprints` + "Empreintes passées" + sous-titre "Les sentiers déjà parcourus par la communauté"
- Placement : après "Sentiers à explorer", avant le lien QR code

### Design de la carte

```text
┌─────────────────────────────────────┐
│          🗺️ Carte Leaflet           │
│  [●] DEVIAT   [●] NOUAILLE         │
│       (marqueurs colorés par type)  │
│  Popup: titre + date + type badge   │
└─────────────────────────────────────┘
```

- Fond carte sombre (même tile layer que `ExplorationCarteTab` : filtre CSS pour cohérence visuelle)
- Marqueurs : `CircleMarker` colorés selon `event_type` (emerald = agro, violet = éco-poétique, amber = éco-tourisme)
- Auto-fit bounds sur les marqueurs
- Hauteur : `h-48` mobile, `h-64` desktop

### Design des vignettes

```text
┌──────────────────────────────────┐
│ [Sprout] Marche agroécologique   │
│ La transhumance de Mouton...     │
│ 29 mars 2026 · 📍 Vouillé       │
│ 👥 2 marcheurs              🐾   │
└──────────────────────────────────┘
```

- Fond : `bg-stone-50 dark:bg-stone-800/20 border-stone-200`
- Grille : `grid-cols-1 sm:grid-cols-2` pour mobile/tablette/desktop
- Pas de bouton d'action (lecture seule)

### Responsive

- **Mobile** : carte `h-48`, vignettes empilées
- **Tablette** : carte `h-56`, vignettes `grid-cols-2`
- **Desktop** : carte `h-64`, vignettes `grid-cols-2`

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/pages/MarchesDuVivantMonEspace.tsx` — requête événements passés + count participants |
| Modifier | `src/components/community/tabs/MarchesTab.tsx` — section "Empreintes passées" avec carte + vignettes |

