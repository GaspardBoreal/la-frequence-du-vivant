

## Ajouter le rayon d'observation dans l'onglet Empreinte

### Analyse

- L'onglet **Vivant** (par étape) utilise `RadiusSelector` pour changer le rayon en temps réel via l'API `biodiversity-data`
- L'onglet **Empreinte** (agrégé) utilise des snapshots pré-stockés dans `biodiversity_snapshots`, collectés à **500m fixe** (hardcodé ligne 137 de `collect-event-biodiversity/index.ts`)
- Le champ `radius_meters` existe dans chaque snapshot → on peut lire le rayon réel utilisé

### Solution

1. **Extraire `RadiusSelector`** dans un composant partagé `src/components/biodiversity/RadiusSelector.tsx` (actuellement interne à `MarcheDetailModal.tsx`)

2. **Afficher le rayon dans Empreinte** entre "X étapes analysées" et les indicateurs — en mode **informatif** (lecture seule), montrant le rayon utilisé lors de la collecte (lu depuis `snapshots[0].radius_meters` ou défaut 500m). Le pill 500m est surligné en émeraude, les autres sont grisés/désactivés

3. **Cohérence des calculs** : le `RadiusSelector` partagé utilise la même constante `RADIUS_OPTIONS` et la même formule de surface (π×r²) dans les deux vues

### Modifications

| Action | Fichier |
|--------|---------|
| Créer | `src/components/biodiversity/RadiusSelector.tsx` — composant extrait avec prop `readOnly?: boolean` |
| Modifier | `src/components/community/MarcheDetailModal.tsx` — importer le composant partagé au lieu de la version locale |
| Modifier | `src/components/community/EventBiodiversityTab.tsx` — ajouter le `RadiusSelector` en readOnly entre "X étapes analysées" et la grille d'indicateurs |

### Détail de l'intégration dans Empreinte (ligne ~370)

```tsx
// Après "X étapes analysées"
<RadiusSelector 
  value={snapshots?.[0]?.radius_meters ? snapshots[0].radius_meters / 1000 : 0.5} 
  onChange={() => {}} 
  readOnly 
/>
// Puis les AnimatedStat cards
```

En mode `readOnly`, les pills non-actives sont visuellement désactivées (opacity réduite, cursor par défaut), et un petit texte "Rayon utilisé lors de la collecte" remplace "Zone couverte".

