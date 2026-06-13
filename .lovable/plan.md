## Problème observé

Sur l'onglet **Carte**, ouvrir une fiche entreprise déclenche un `Sheet` plein hauteur (max-w-2xl) qui **recouvre la carte**, masque le marqueur sélectionné, casse l'auto-zoom et empêche toute lecture spatiale. Le popup Leaflet par défaut est aussi très basique ("Ouvrir la fiche" en lien souligné). Résultat : on perd le contexte géographique dès qu'on clique.

## Direction proposée — « Atlas Commercial »

Une mise en page split-screen façon Mapbox Studio / Linear Insights : la carte reste reine, le panneau d'information glisse à droite **sans la masquer**, et la carte se re-cadre automatiquement sur le marqueur sélectionné dans l'espace visible restant.

### 1. Split layout sur l'onglet Carte

```text
┌───────────────────────────────────────────────┬──────────────────┐
│                                               │  ◐ CO            │
│            CARTE (flex-1)                     │  Construire pour │
│                                               │  Partager        │
│        ● marqueur sélectionné                 │  ──────────────  │
│        (halo pulsé, recentré)                 │  [Suspect ▾]     │
│                                               │  → Prospect      │
│                                               │  → Client        │
│                                               │  ──────────────  │
│                                               │  Identité ▸      │
│                                               │  Dirigeants      │
│                                               │  Finances        │
│                                               │  Activités       │
└───────────────────────────────────────────────┴──────────────────┘
```

- Sur Carte, quand `selectedId` est défini : grid `1fr 420px` (desktop) ; sur mobile (`<lg`) on retombe sur un Sheet bottom-sheet (drag handle) qui n'occupe que ~70 % de la hauteur.
- Le panneau latéral utilise une nouvelle variante du composant détail (mode `inline`) : pas d'overlay sombre, pas de `Sheet`, juste une card sticky avec glassmorphism léger (`bg-card/95 backdrop-blur border-l`).
- Bouton fermeture rond flottant en haut à gauche du panneau (chevron »).
- Quand la sélection se ferme, la carte reprend toute la largeur avec une transition fluide (`transition-[grid-template-columns] duration-500`).

### 2. Carte plus expressive

- **Marqueurs custom** : pin goutte SVG (au lieu du disque actuel) colorée selon le stage, avec halo pulsé pour le marqueur sélectionné (`animate-ping` + ring).
- **Popup remplacé** par un *tooltip carte de visite* au survol uniquement : avatar 2 lettres + nom + ville + chip stage. Le clic ouvre directement le panneau (plus de popup intermédiaire avec "Ouvrir la fiche").
- **Recadrage intelligent** sur sélection : `map.flyTo([lat, lng], 14, { duration: 0.8 })` avec offset latéral pour compenser le panneau (utilise `map.panBy([panelWidth/2, 0])`).
- **Clustering doux** si > 50 marqueurs proches (optionnel — à confirmer si on veut l'ajouter maintenant).

### 3. Refonte visuelle du panneau détail

- **Header hero** : bandeau dégradé subtil (`from-primary/10 via-card to-card`), avatar 56px avec halo radial coloré selon le stage, titre en `text-xl font-semibold tracking-tight`.
- **Stage switcher visuel** : 4 pills horizontaux (Suspect · Prospect · Client · Inactif) avec ligne soulignée animée sous l'actif (Framer Motion `layoutId`), au lieu du Select + 2 boutons "Passer en…".
- **Tabs sticky** sous le header avec indicateur underline et compteurs discrets (`Dirigeants · 3`, `Finances · 5 ans`, `Activités · 12`).
- **Rows Identité** : grille 2 colonnes (label / valeur) plus dense, séparateurs `border-border/40`, icônes en cercle teinté.
- **Footer flottant** sticky en bas avec actions secondaires (Supprimer en ghost rouge discret, plus de gros bouton rouge agressif en haut).
- Animations d'entrée Framer Motion (`opacity 0 → 1`, `x: 20 → 0`, durée 250 ms).

### 4. Cohérence avec les autres tabs

Hors onglet Carte (Annuaire, Entreprises, Kanban), l'ouverture continue d'utiliser le `Sheet` actuel (le split n'a de sens que face à une carte). Le composant détail expose deux modes : `mode="sheet"` (par défaut) et `mode="inline"` (utilisé par la Carte).

## Détails techniques

- **`CompanyDetailSheet.tsx`** : factoriser le corps en `<CompanyDetailContent companyId={id} onClose={…} />` réutilisable. Garder l'export `CompanyDetailSheet` qui enveloppe `<CompanyDetailContent>` dans un `Sheet` (rétro-compatibilité pour Annuaire / Entreprises / Kanban).
- **`CrmAnnuaire.tsx`** :
  - Sur tab `carte` : grid `lg:grid-cols-[1fr_420px]` quand `selectedCompanyId` est set, sinon une seule colonne. Le `<CompanyDetailSheet>` est remplacé par `<CompanyDetailContent>` dans la 2e colonne. Sur mobile, fallback `Sheet` bottom (`side="bottom"`).
  - Sur les autres tabs : on garde `<CompanyDetailSheet>` tel quel.
- **`CrmCompaniesMap.tsx`** :
  - Nouvelles icônes SVG pin (gradient, ombre portée) via `L.divIcon`.
  - Halo pulsé pour `selectedId` (prop ajoutée).
  - `flyTo` + offset au lieu de l'auto-fit quand un marqueur est sélectionné.
  - Tooltip Leaflet (hover) à la place du Popup ; clic = `onSelect`.
- **Tokens design** : aucune nouvelle couleur, on réutilise `--primary`, `--card`, `--border`, `STAGE_MARKER_COLOR`.

## Hors scope

- Pas de clustering Leaflet (sauf si tu veux l'ajouter maintenant).
- Pas de mini-streetview / Google StreetView.
- Pas de réorganisation des onglets internes Identité/Dirigeants/Finances/Activités (juste re-skin).
- Pas de modif des autres tabs (Annuaire, Entreprises, Kanban).

## Livrables

1. `src/components/crm/CompanyDetailContent.tsx` (nouveau) — corps réutilisable, mode inline + sheet.
2. `src/components/crm/CompanyDetailSheet.tsx` — devient un mince wrapper `Sheet` autour de `CompanyDetailContent`.
3. `src/components/crm/CrmCompaniesMap.tsx` — pins SVG, halo sélection, `flyTo` avec offset, tooltip hover.
4. `src/pages/CrmAnnuaire.tsx` — split layout sur tab Carte, mobile bottom-sheet fallback.

Veux-tu que j'ajoute le **clustering Leaflet** dans le même chantier, ou on garde simple pour cette première passe ?
