

# Contributions Science Participative par Marcheur — Fiche immersive expandable

## Vision

Transformer chaque carte marcheur en une **fiche deployable** qui revele ses decouvertes biodiversite issues des APIs (GBIF, iNaturalist, eBird) via `marcheur_observations`. Au tap, la carte s'ouvre pour montrer un **mini-portfolio naturaliste** : galerie d'especes observees avec photos, source API, et un CTA inspirant pour rejoindre les plateformes citoyennes.

## Architecture

### Donnees disponibles

La table `marcheur_observations` contient deja : `marcheur_id`, `species_scientific_name`, `photo_url`, `source`, `marche_id`, `observation_date`. Le hook `useExplorationParticipants` recupere deja le `speciesCount` pour le crew — il faut enrichir cette query pour remonter aussi la **liste des especes** (nom, photo, source) par marcheur.

### Modification du hook `useExplorationParticipants`

Ajouter un champ `speciesObserved` au type `MarcheurWithStats` :

```typescript
speciesObserved: Array<{
  scientificName: string;
  photoUrl?: string;
  source?: string;
  observationDate?: string;
}>;
```

La query `marcheur_observations` existante (ligne 39-42) recupere deja `marcheur_id, species_scientific_name`. Il suffit d'ajouter `photo_url, source, observation_date` au select et de grouper les resultats par marcheur.

### Nouveau composant : `MarcheurSpeciesDrawer` (inline dans MarcheursTab)

Quand on tap sur une carte marcheur, un drawer `AnimatePresence` s'ouvre sous la carte avec :

```text
┌─────────────────────────────────────────┐
│  🌿 3 especes identifiees par Sylvain   │
├─────────────────────────────────────────┤
│  ┌──────┐  Parus major                  │
│  │ 📷   │  Mesange charbonniere         │
│  │      │  via iNaturalist · 12 mars    │
│  └──────┘                               │
│  ┌──────┐  Quercus robur               │
│  │ 🌱   │  Chene pedoncule             │
│  │      │  via GBIF · 14 mars           │
│  └──────┘                               │
├─────────────────────────────────────────┤
│  🔬 Devenez contributeur citoyen !      │
│  Creez un compte iNaturalist ou eBird   │
│  pour que vos observations comptent     │
│  dans la science mondiale.              │
│                                         │
│  [iNaturalist ↗]  [eBird ↗]            │
└─────────────────────────────────────────┘
```

### Design details

- **Carte marcheur** : ajouter un chevron `ChevronDown` qui tourne a 180deg quand ouvert, et un micro-badge "N especes" cliquable
- **Drawer** : `bg-card/80 backdrop-blur border-t border-emerald-500/20`, animation `height: auto` via framer-motion `layout`
- **Species mini-card** : photo ronde 40px (ou icone fallback par kingdom), nom FR via `useSpeciesTranslation`, badge source colore (vert iNaturalist, bleu eBird, orange GBIF), date
- **CTA engagement** : gradient emerald/amber subtle, liens directs vers `inaturalist.org/signup` et `ebird.org/register`, texte poetique ("Chaque observation nourrit la connaissance du vivant")
- **Empty state** (marcheur sans observations) : message doux "Aucune espece identifiee pour l'instant — explorez l'onglet Vivant pour decouvrir la biodiversite locale"

### Traduction des noms FR

Reutiliser le hook `useSpeciesTranslation` existant pour afficher les noms communs francais sous le nom scientifique.

## Fichiers impactes

| Fichier | Action |
|---|---|
| `src/hooks/useExplorationParticipants.ts` | Enrichir la query `marcheur_observations` avec `photo_url, source, observation_date` + ajouter `speciesObserved[]` au type |
| `src/components/community/exploration/MarcheursTab.tsx` | Ajouter etat `expandedId`, drawer AnimatePresence par marcheur, composant `MarcheurSpeciesDrawer` inline, CTA plateformes |

## Ce qui ne change PAS

- Le layout des cartes marcheurs (avatar, nom, badges stats)
- Le bloc engagement "Invitez un marcheur" en bas
- Le hook `useExplorationBiodiversitySummary` — non impacte
- Les autres onglets

