

## Ajouter un onglet "Événements" dans Exportations & Rapports

### Constat

La page `/admin/exportations` (ExportationsAdmin.tsx) possède déjà un système d'onglets (Tabs) pour exporter des textes littéraires (Word, CSV, ePub, PDF, Éditeur). Mais aucun onglet ne couvre les **événements** (`marche_events`) ni leurs **marches associées** avec données de biodiversité et participants.

### Proposition

Ajouter un onglet **"Événements"** dans le `TabsList` existant, contenant :

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Textes] [Vocabulaire] [Stats] [ePub] [PDF] [★ Événements]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sélection des événements                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Filtre type ▼]  Agro / Éco poétique / Éco tourisme       │ │
│  │                                                            │ │
│  │ ☑ Transhumance Mouton Village    🌱 29 mar · 3 marcheurs  │ │
│  │ ☑ DEVIAT première découverte     🌱 05 jan · 2 marcheurs  │ │
│  │ ☐ Réveil de la Terre             📖 11 avr · 0 marcheurs  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Contenu du rapport                                             │
│  ☑ Fiche événement (titre, date, lieu, type, organisateur)      │
│  ☑ Liste des participants (nom, statut, date inscription)       │
│  ☑ Marches associées (étapes, coordonnées, textes)              │
│  ☑ Synthèse biodiversité (espèces par royaume, top espèces)    │
│  ☐ Données brutes biodiversité (species_data complet)           │
│                                                                 │
│  Format d'export                                                │
│  ○ Word (.docx)  ○ CSV  ○ PDF                                  │
│                                                                 │
│  [Aperçu]  [Exporter]                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Données jointes

Pour chaque événement sélectionné, la requête récupère :
- `marche_events` : titre, date, lieu, event_type, latitude/longitude, exploration_id
- `marche_participations` → `community_profiles` : participants (prénom, nom, statut validated_at)
- `exploration_marches` → `marches` : étapes géolocalisées, textes littéraires
- `biodiversity_snapshots` via les marches : espèces, compteurs par royaume (calculés depuis `species_data` JSON, comme corrigé dans `useExplorationBiodiversitySummary`)

### Charte graphique respectée

- Badges colorés par type d'événement (emerald/violet/amber) via `getMarcheEventTypeMeta`
- En-têtes de section dans le Word/PDF avec la couleur du type
- Icônes Sprout / BookOpenText / Trees selon le type

### Formats d'export

**Word (.docx)** — Rapport structuré par événement :
- Page de garde avec titre, type (badge), date, lieu
- Section participants (tableau)
- Section parcours (liste des étapes avec coordonnées)
- Section biodiversité (compteurs + top espèces)

**CSV** — Données tabulaires aplaties :
- Un fichier "événements" (1 ligne par événement)
- Un fichier "participants" (1 ligne par inscription)
- Un fichier "biodiversité" (1 ligne par espèce par marche)

**PDF** — Rapport visuel similaire au Word avec mise en page soignée

### Architecture technique

| Action | Fichier |
|--------|---------|
| Créer | `src/components/admin/EventExportPanel.tsx` — composant de l'onglet (sélection, options, aperçu) |
| Créer | `src/utils/eventExportUtils.ts` — logique d'export Word/CSV/PDF pour événements |
| Modifier | `src/pages/ExportationsAdmin.tsx` — ajouter l'onglet "Événements" dans le TabsList |

