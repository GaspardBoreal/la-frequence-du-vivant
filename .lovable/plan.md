

## Aligner l'affichage des espèces entre Vivant et Empreinte

### Problème identifié

- **Vivant** (par marche) appelle l'edge function `biodiversity-data` en temps réel → retourne des `BiodiversitySpecies[]` riches : photos iNaturalist, noms français (traduction), source, date, attributions. Affichées via `SpeciesExplorer` + `EnhancedSpeciesCard`.
- **Empreinte** (événement) lit le JSON `species_data` stocké dans `biodiversity_snapshots` → données minimales : `commonName` en anglais, `scientificName`, `kingdom`, `observations`. Pas de photo, pas de traduction. Affichées via une liste custom simpliste.

### Solution

Remplacer la section "Taxons observés" de `EventBiodiversityTab` par le composant `SpeciesExplorer` existant, en transformant les données `species_data` agrégées en objets `BiodiversitySpecies[]`. Les traductions et photos seront gérées automatiquement par `SpeciesExplorer` (via `useSpeciesTranslationBatch` et `EnhancedSpeciesCard`).

Ajouter un panneau dépliable (accordéon) sur chaque carte d'espèce dans Empreinte, montrant les marches où l'espèce a été observée.

### Étapes

**1. Transformer species_data en BiodiversitySpecies[] dans EventBiodiversityTab**

Dans le `useMemo` qui calcule `allSpecies`, mapper chaque entrée vers le type `BiodiversitySpecies` complet :
- `id` : généré depuis `scientificName`
- `commonName`, `scientificName`, `kingdom` : depuis les données existantes
- `family` : depuis le champ `family` (numérique dans les données, à convertir en string)
- `observations` : agrégé
- `source` : `'inaturalist'` par défaut (source principale des snapshots)
- `lastSeen` : dérivé de la date du snapshot
- `attributions` : tableau vide (pas disponible dans les snapshots)
- `photoData` : non inclus (sera chargé par `EnhancedSpeciesCard` via `useSpeciesPhoto`)

Aussi, enrichir chaque espèce avec la liste des `marche_id` où elle apparaît, pour le panneau dépliable.

**2. Remplacer la liste custom par SpeciesExplorer**

Dans la section `taxons` de `EventBiodiversityTab`, remplacer la boucle `filteredSpecies.map(...)` par :
```tsx
<SpeciesExplorer species={allSpeciesAsBiodiversity} compact />
```

Cela apporte automatiquement :
- Photos via `EnhancedSpeciesCard`
- Noms français via `useSpeciesTranslationBatch`
- Filtres par catégorie, source, recherche
- Même design que Vivant

**3. Panneau dépliable "Marches d'observation"**

Créer un composant `SpeciesEmpreinteCard` qui wrap `EnhancedSpeciesCard` et ajoute :
- Un bouton chevron pour ouvrir/fermer un panneau
- Le panneau montre la liste des marches où l'espèce a été observée (nom de marche, photo du snapshot si dispo, lien vers la marche)
- Requête : on dispose déjà des `snapshots` avec `marche_id` — on croise avec `exploration_marches` → `marches` pour les noms

Alternative plus simple et cohérente : utiliser le `SpeciesDetailModal` existant (qui a déjà un onglet "Marches" via `useSpeciesMarches`) — il suffit de passer l'`explorationId` au `SpeciesExplorer`. Le modal existant `SpeciesGalleryDetailModal` fait déjà tout : photo, traduction, marches d'observation, audio, mini-carte.

**Approche retenue** : Réutiliser `SpeciesExplorer` + le modal existant `SpeciesDetailModal`/`SpeciesGalleryDetailModal`. Pas besoin de réinventer l'accordéon — le clic sur une espèce ouvre le modal riche existant avec toutes les infos.

### Fichiers modifiés

- **`src/components/community/EventBiodiversityTab.tsx`** :
  - Import `SpeciesExplorer` et `BiodiversitySpecies`
  - Transformer `allSpecies` en `BiodiversitySpecies[]`
  - Remplacer la section "taxons" par `<SpeciesExplorer species={...} compact />`
  - Supprimer le code custom de liste des taxons (filtres catégorie, boucle map)
  - Conserver la section Synthèse et Analyse IA intactes

### Résultat attendu

- Empreinte affiche les espèces avec le même design riche que Vivant : photos, noms français, badges source
- Clic sur une espèce ouvre le modal détail avec marches d'observation, audio, carte
- Cohérence totale entre les deux vues
- Les compteurs de synthèse restent inchangés et cohérents

