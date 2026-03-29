

# Impact du Marcheur — 3 analyses dynamiques dans le drawer

## Vision

Ajouter un bloc **"Impact"** dans le drawer expandable de chaque marcheur, avec 3 metriques visuelles animees qui demontrent la valeur concrete de ses contributions.

## Les 3 analyses

### 1. Territoires pionniers (pour le marcheur)
**"X points de marche documentes pour la premiere fois"**

Croiser les `marche_id` ou le marcheur a contribue (via `marcheur_observations` ou `marcheur_medias`) avec les `biodiversity_snapshots` : si un `marche_id` n'avait **aucun snapshot avant la date d'observation du marcheur**, c'est un territoire pionnier. Afficher un compteur anime avec icone `MapPin` et texte "X territoires explores en pionnier — aucune donnee biodiversite n'existait avant votre passage".

### 2. Couverture taxonomique (pour le marcheur)
**"Diversite de vos observations : X familles du vivant couvertes"**

A partir des `speciesObserved` deja disponibles, categoriser les especes par groupe taxonomique (oiseaux, plantes, champignons, insectes, mammiferes...) via un mapping simple du nom scientifique ou via les donnees `species_data` des snapshots. Afficher des **mini-badges colores** par categorie avec le count, formant un "arc-en-ciel taxonomique" : `🐦 Oiseaux 12 · 🌿 Plantes 8 · 🍄 Champignons 3`. Cela valorise la diversite du regard du marcheur.

### 3. Indice de contribution scientifique (pour les partenaires B2B)
**"Score d'enrichissement des donnees territoriales"**

Calculer un score composite sur 100 base sur :
- Nombre de marches couvertes / total marches de l'exploration (couverture geographique)
- Nombre d'especes distinctes observees (richesse)  
- Diversite des types de contributions (photo + son + texte = bonus multi-sensoriel)

Afficher comme une **jauge circulaire animee** (SVG arc) avec label "Indice de contribution" et un sous-texte explicatif adapte au score ("Contributeur remarquable", "Explorateur engage", etc.).

## Implementation

### Donnees necessaires

Toutes les donnees sont deja disponibles ou facilement requetables :
- `marcheur.speciesObserved` — deja dans le hook
- `marcheur.stats` — photos, sons, textes deja comptes
- `biodiversity_snapshots` par `marche_id` — une query supplementaire legere

### Nouveau composant : `MarcheurImpactBlock`

Composant inline dans `MarcheursTab.tsx`, place entre `ContributionsGallery` et `CitizenScienceCTA` dans le drawer. Il recoit le `marcheur` et l'`explorationId`, et fait une query on-demand (`enabled: isExpanded`) pour les snapshots.

### Design

- Fond `bg-gradient-to-br from-emerald-500/5 to-cyan-500/5` avec bordure `border-emerald-500/10`
- Titre "Votre impact" avec icone `TrendingUp`
- 3 lignes : chacune avec icone, metrique animee (counter framer-motion), texte descriptif
- Jauge circulaire SVG pour le score (arc anime de 0 a N sur 100)
- Responsive : stack vertical sur mobile

### Query supplementaire

```typescript
// Fetch snapshots for this exploration's marches to determine "pioneer" status
const { data: snapshots } = useQuery({
  queryKey: ['marcheur-impact', explorationId],
  queryFn: () => supabase
    .from('biodiversity_snapshots')
    .select('marche_id, snapshot_date, total_species, birds_count, plants_count, fungi_count')
    .in('marche_id', explorationMarcheIds),
  enabled: isExpanded && !!explorationId
});
```

## Fichiers impactes

| Fichier | Action |
|---|---|
| `src/components/community/exploration/MarcheursTab.tsx` | Ajouter `MarcheurImpactBlock` inline, passer `explorationId` au `MarcheurCard`, query snapshots on-demand |

Aucun nouveau fichier, aucune migration.

